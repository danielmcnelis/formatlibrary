
const Canvas = require('canvas')
import { S3 } from 'aws-sdk'
import { Op } from 'sequelize'
import { BlogPost, Card, Deck, DeckType, Entry, Player, Tournament, Server }  from '@fl/models'
import { capitalize, dateToVerbose } from './utility'
import { getDeckType } from './deck'
import { config } from '@fl/config'
import { checkExpiryDate, uploadDeckFolder } from './drive'

// CREATE DECKS
export const createDecks = async (event, data) => {
    let b = 0
    let c = 0
    let e = 0
    
    for (let i = 0; i < data.length; i++) {
        try {
            const participant = data[i].participant
            const entries = await Entry.findAll({
                where: {
                    participantId: participant.id,
                    tournamentId: event.tournamentId
                },
                include: Player
            })

            if (!event.isTeamEvent && !entries.length) {
                console.log(`missing entry for participant ${participant.id}`)
            } else if (event.isTeamEvent && entries.length !== 3) {
                console.log(`missing ${(3 - entries.length) || 3} team entries for participant ${participant.id}`)
            } 

            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                const count = await Deck.count({
                    where: {
                        playerId: entry.playerId,
                        eventId: event.id
                    }
                })

                if (count !== 3) {
                    const placement = participant.final_rank ? parseInt(participant.final_rank, 10) : null
                    const dname = await getDeckType(entry.ydk, event.formatName)

                    const deckType = await DeckType.findOne({ 
                        where: { 
                            name: {[Op.iLike]: dname } 
                        }
                    }) || ({ name: 'Other', category: 'Other' })

                    await Deck.create({
                        type: deckType.name,
                        category: deckType.category,
                        builder: entry.playerName,
                        formatName: event.formatName,
                        formatId: event.formatId,
                        ydk: entry.ydk,
                        placement: placement,
                        eventName: event.abbreviation || event.name,
                        origin: 'event',
                        display: false,
                        community: event.community,
                        playerId: entry.playerId,
                        eventId: event.id,
                        deckTypeId: deckType.id,
                        eventDate: event.startDate
                    })

                    b++
                    console.log(`uploaded ${event.abbreviation || event.name} #${placement} ${deckType.name} deck built by ${entry.playerName}`)
                } else {
                    c++
                    console.log(`already have ${entry.playerName}'s deck for ${event.name}`)
                }
            }
        } catch (err) {
            e++
            console.log(err)
        }
    }
    
    console.log(`Uploaded ${b} decks for ${event.name}. Encountered ${e} errors. ${b + c} out of ${event.size} decks saved thus far.`)
    return b + c === event.size || b + c === event.size * 3
} 

// COMPOSE BLOG POST
export const composeBlogPost = async (interaction, event) => {
    if (event.isTeamEvent) return await interaction.channel.send(`Cannot make blogpost for team event: ${event.name}.`)

    try {
        const count = await BlogPost.count({
            where: {
                title: {
                    [Op.or]: {
                        [Op.substring]: event.name,
                        [Op.substring]: event.abbreviation
                    }
                }
            }
        })

        if (count) return await interaction.channel.send(`Blogpost for ${event.name} already exists.`)

        const deck = await Deck.findOne({
            where: {
                eventId: event.id,
                placement: 1
            }
        })

        const decks = await Deck.findAll({ 
            where: {
                formatId: event.formatId
            }
        })
    
        if (!decks.length) return console.log('no decks found')
        
        const freqs = decks.reduce((acc, curr) => (acc[curr.type] ? acc[curr.type]++ : acc[curr.type] = 1, acc), {})
        const popularDecks = Object.entries(freqs).sort((a, b) => b[1] - a[1]).map((e) => e[0]).slice(0, 6)
        const title = `Congrats to ${event.winner} on winning ${event.abbreviation}!`
        const blogTitleDate = dateToVerbose(event.endDate, false, false, true)
        const publishDate = dateToVerbose(event.endDate, true, true, false)
    
        const main = []
        const mainKonamiCodes = deck.ydk.split('#main')[1].split('#extra')[0].split('\n').filter((e) => e.length)

        for (let i = 0; i < mainKonamiCodes.length; i++) {
            let konamiCode = mainKonamiCodes[i]
            while (konamiCode.length < 8) konamiCode = '0' + konamiCode
            const card = await Card.findOne({ where: { konamiCode }})
            if (!card) continue
            main.push(card)
        }

        main.sort((a, b) => {
            if (a.sortPriority > b.sortPriority) {
                return 1
            } else if (b.sortPriority > a.sortPriority) {
                return -1
            } else if (a.name > b.name) {
                return 1
            } else if (b.name > a.name) {
                return -1
            } else {
                return false
            }
        })

        const rows = Math.ceil(main.length / 10)
        const card_width = 72
        const card_height = 105
        const canvas = Canvas.createCanvas((card_width * 10) + 9, (card_height * rows) + rows - 1)
        const context = canvas.getContext('2d')
    
        for (let i = 0; i < main.length; i++) {
            const card = main[i]
            const row = Math.floor(i / 10)
            const col = i % 10
            const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`) 
            context.drawImage(image, (card_width + 1) * col, row * (card_height + 1), card_width, card_height)
        }
    
        const conclusion = event.series ? `Enter the next <i>${event.name.replace(/[0-9]/g, '').trim()}</i> to see if you can knock out the reigning champ!` :
            event.name.includes('Format World Championship') ? `And so the ${event.startDate.getFullYear()} ${capitalize(event.formatName, true)} Format season comes to a close. Be sure to enter next year's qualifiers for your chance to compete in the World Championship!` :
            event.name.includes('Last Chance') ? `And so the ${event.startDate.getFullYear()} ${capitalize(event.formatName, true)} Format qualifying season comes to a close. Tune in to find out who wins the World Championship!` :
            event.name.includes('Obelisk') || event.name.includes('Ra') || event.name.includes('Slifer') ? `Join the Goat Format Europe Discord community to compete in the <i>Academy series</i>!` :
            `Join the ${event.community} Discord community to compete in similar events!`
    
        const content = 
            `<div className="blogpost-title-flexbox">` +
                    `<div className="blogpost-title-text">` +
                        `<a href="/events/${event.abbreviation}">` +
                            `<h1 className="blogpost-title">${title}</h1>` +
                        `</a>` +
                        `<p className="blogpost-date">${blogTitleDate}</p>` +
                    `</div>` +
                `<div className="blogpost-title-emojis">` +
                    `<img className="blogpost-format-icon" src="https://cdn.formatlibrary.com/images/emojis/${event.format.icon}.png"/>` +
                    `<img className="blogpost-event-icon" src="https://cdn.formatlibrary.com/images/emojis/event.png"/>` +
                `</div>` +
            `</div>` +
            `<div className="blogpost-content-flexbox">` +
                `<p className="blogpost-paragraph">` +
                    `${event.winner} won <a className="blogpost-event-link" href="/events/${event.abbreviation}">${event.name}</a> on ${publishDate} with a ${popularDecks.includes(deck.type) ? 'popular' : 'rogue'} deck, ${capitalize(deck.type, true)}!` +
                `</p>` +
                `<div className="blogpost-images-flexbox">` +
                    `<div className="blogpost-pfp-community-flexbox">` +
                        `<img className="blogpost-pfp" src="https://cdn.formatlibrary.com/images/pfps/${event.player.discordId || event.player.name}.png" />` +
                        `<img className="blogpost-community"  src="https://cdn.formatlibrary.com/images/logos/${event.community}.png" />` +
                    `</div>` +
                    `<div className="blogpost-deck-box">` + 
                        `<a className="blogpost-deck-link" href="/decks/${deck.id}">` +
                            `<img className="blogpost-deck" src="https://cdn.formatlibrary.com/images/decks/previews/${deck.id}.png" />` +
                        `</a>` +
                    `</div>` +
                `</div>` +
                `<p className="blogpost-paragraph">${conclusion}</p>` +
            `</div>`
    
        await BlogPost.create({
            title: title,
            content: content,
            publishDate: publishDate,
            format: event.formatName,
            eventDate: event.endDate,
            eventId: event.id
        })
    
        const buffer = canvas.toBuffer('image/png')
        const s3 = new S3({
            region: config.s3.region,
            credentials: {
                accessKeyId: config.s3.credentials.accessKeyId,
                secretAccessKey: config.s3.credentials.secretAccessKey
            }
        })

        const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/decks/previews/${deck.id}.png`, Body: buffer, ContentType: `image/png` }).promise()
        console.log('uri', uri)
        return await interaction.channel.send(`Composed blogpost for ${event.name}.`)
    } catch (err) {
        console.log('composeBlogpost()', err)
        return await interaction.channel.send(`Error composing blogpost for ${event.name}.`)
    }
}


// COMPOSE THUMBNAILS
export const composeThumbnails = async (interaction, event) => {
    const decks = await Deck.findAll({
        where: {
            eventId: event.id
        }
    })

    if (!decks.length) return await interaction.channel.send(`Composed deck thumbnails for ${event.name}.`)
    
    const s3 = new S3({
        region: config.s3.region,
        credentials: {
            accessKeyId: config.s3.credentials.accessKeyId,
            secretAccessKey: config.s3.credentials.secretAccessKey
        }
    })

    for (let i = 0; i < decks.length; i++) {
        const deck = decks[i]
        console.log(`drawing ${deck.builder}'s deck...`)
        const main = []
        const mainKonamiCodes = deck.ydk.split('#main')[1].split('#extra')[0].split('\n').filter((e) => e.length)

        for (let i = 0; i < mainKonamiCodes.length; i++) {
            let konamiCode = mainKonamiCodes[i]
            while (konamiCode.length < 8) konamiCode = '0' + konamiCode
            const card = await Card.findOne({ where: { konamiCode }})
            if (!card) continue
            main.push(card)
        }

        main.sort((a, b) => {
            if (a.sortPriority > b.sortPriority) {
                return 1
            } else if (b.sortPriority > a.sortPriority) {
                return -1
            } else if (a.name > b.name) {
                return 1
            } else if (b.name > a.name) {
                return -1
            } else {
                return false
            }
        })
            
        try {
            const rows = Math.ceil(main.length / 10)
            const card_width = 36
            const card_height = 52.5
            const canvas = Canvas.createCanvas(card_width * 10, card_height * rows)
            const context = canvas.getContext('2d')
    
            for (let i = 0; i < main.length; i++) {
                const card = main[i]
                const row = Math.floor(i / 10)
                const col = i % 10
                const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`) 
                context.drawImage(image, card_width * col, row * card_height, card_width, card_height)
            }
            
            const buffer = canvas.toBuffer('image/png')
            const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/decks/thumbnails/${deck.id}.png`, Body: buffer, ContentType: `image/png` }).promise()
            console.log('uri', uri)
        } catch (err) {
            console.log(`Error composing ${deck.builder}'s deck thumbnail`, err)
        }
    }

    return await interaction.channel.send(`Composed deck thumbnails for ${event.name}.`)
}

            
// DISPLAY DECKS
export const displayDecks = async (interaction, event) => {
    const minPlacement = event.size <= 8 ? 1 :
        event.size > 8 && event.size <= 16 ? 2 :
        event.size > 16 && event.size <= 24 ? 3 :
        event.size > 24 && event.size <= 32 ? 4 :
        event.size > 32 && event.size <= 48 ? 6 :
        event.size > 48 && event.size <= 64 ? 8 :
        event.size > 64 && event.size <= 96 ? 12 :
        event.size > 96 && event.size <= 128 ? 16 :
        event.size > 128 && event.size <= 224 ? 24 :
        32
        
    const decks = await Deck.findAll({ 
        where: {
            eventId: event.id,
            display: false,
            placement: {[Op.lte]: minPlacement}
        }
    })

    if (!decks.length) {
        const count = await Deck.count({
            where: {
                eventId: event.id,
                display: true
            }
        })

        return await interaction.channel.send(`The top ${count} deck lists for ${event.name} were already published.`)
    }

    for (let i = 0; i < decks.length; i++) {
        const deck = decks[i]
        await deck.update({ display: true })
    }
    
    return await interaction.channel.send(`Displayed ${decks.length} new deck lists for ${event.name}.`)
}

// PUBLISH DECKS
export const publishDecks = async (interaction, event) => {
    const decks = await Deck.findAll({
        where: {
            eventId: event.id,
            publishDate: null
        }
    })

    for (let i = 0; i < decks.length; i++) {
        const deck = decks[i]
        await deck.update({ publishDate: event.endDate })
    }

    return await interaction.channel.send(`Published ${decks.length} new deck lists for ${event.name}.`)
}

// FIX DECK FOLDER
export const fixDeckFolder = async (interaction, tournamentId) => {
    const server = await Server.findOne({
        where: {
            id: interaction.guildId
        }
    })

    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        }
    })

    const decks = await Deck.findAll({
        where: {
            eventName: {
                [Op.or]: [tournament.abbreviation, tournament.name]
            }
        },
        include: Player
    })

    try {
        await checkExpiryDate(server)
        await uploadDeckFolder(server, tournament.name, decks)
        return await interaction.reply({ content: `Your tournament files have been uploaded! ${server.logo}` })
    } catch (err) {
        console.log(err)
        return await interaction.reply({ content: `Error. Check bot logs.` })
    }
}