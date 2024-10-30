
const Canvas = require('canvas')
import axios from 'axios'
import * as sharp from 'sharp'
import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import { Op } from 'sequelize'
import { Alius, BlogPost, Card, Deck, DeckThumb, DeckType, Entry, Match, Matchup, Player, Replay, Team, Tournament, Server, Stats }  from '@fl/models'
import { capitalize, dateToVerbose, s3FileExists } from './utility'
import { getDeckType } from './deck'
import { config } from '@fl/config'
import { checkExpiryDate, uploadDeckFolder } from './drive'

// CREATE DECKS
export const createDecks = async (event, participants, standings = []) => {
    let b = 0
    let c = 0
    let e = 0

    for (let i = 0; i < participants.length; i++) {
        try {
            const {participant} = participants[i]

            const entries = await Entry.findAll({
                where: {
                    participantId: participant.id,
                    tournamentId: event.primaryTournamentId
                },
                include: Player
            })

            if (!entries.length) {
                console.log(`missing entry for participant ${participant.id}`)
            }

            for (let j = 0; j < entries.length; j++) {
                const entry = entries[j]

                const count = await Deck.count({
                    where: {
                        playerId: entry.playerId,
                        eventId: event.id
                    }
                })
    
                if (!count) {
                    const standing = standings?.find((s) => s.participantId === participant.id)
                    const placement = standing && standing.rank ? parseInt(standing.rank.replace(/^\D+/g, '')) :
                        participant.final_rank ? parseInt(participant.final_rank) :
                        null
    
                    const deckType = await getDeckType(entry.ydk, event.formatName)
    
                    await Deck.create({
                        type: deckType.name,
                        category: deckType.category,
                        builder: entry.player?.name,
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
    return (b + c === event.size) || (b + c === (event.size * 3))
}

// UPDATE SINGLE AVATAR
export const updateSingleAvatar = async (user) => {
    try {
        const avatar = user.avatar
        const player = await Player.findOne({ where: { discordId: user.id }})

        if (player) {
            await player.update({ discordPfp: avatar })
            
            const {data} = await axios.get(
                `https://cdn.discordapp.com/avatars/${player.discordId}/${avatar}.webp`, {
                    responseType: 'arraybuffer',
                }
            )

            const buffer = await sharp(data).toFormat('png').toBuffer()

            const s3 = new S3({
                region: config.s3.region,
                credentials: {
                    accessKeyId: config.s3.credentials.accessKeyId,
                    secretAccessKey: config.s3.credentials.secretAccessKey
                },
            })

            const { Location: uri} = await new Upload({
                client: s3,
                params: { Bucket: 'formatlibrary', Key: `images/pfps/${player.discordId}.png`, Body: buffer, ContentType: `image/png` },
            }).done()
            console.log('uri', uri)
            console.log(`saved new pfp for ${player.globalName || player.discordName}`)
        }
    } catch (err) {
        console.log(err)
    } 

    return console.log(`updated single avatar for:`, user)
}

// FIX PLACEMENTS
export const fixPlacements = async (event, participants, standings = []) => {
    let b = 0
    let c = 0
    let d = 0
    let e = 0

    for (let i = 0; i < participants.length; i++) {
        try {
            const {participant} = participants[i]

            const player = await Player.findOne({
                where: {
                    discordName: participant.name,
                }
            })

            if (!player) {
                console.log(`missing player for participant ${participant.id}`)
            }

            const deck = await Deck.findOne({
                where: {
                    playerId: player.id,
                    eventId: event.id
                }
            })

            if (deck && deck.display === false) {
                const standing = standings.find((s) => s.participantId === participant.id)
                const placement = standing && standing.rank ? parseInt(standing.rank.replace(/^\D+/g, '')) :
                    participant.final_rank ? parseInt(participant.final_rank) :
                    null

                await deck.update({ placement: placement })

                b++
                console.log(`updated ${event.abbreviation || event.name} #${placement} deck built by ${participant.name}`)
            } else if (deck && deck.display === true) {
                d++
                console.log(`skipping placement update for ${participant.name}'s deck since they made the top cut`)
            } else {
                c++
                console.log(`count not find ${participant.name}'s deck for for ${event.name}`)
            }
        } catch (err) {
            e++
            console.log(err)
        }
    }
    
    return console.log(`Updated standings for ${b} decks for ${event.name}. Skipped ${d} decks. Encountered ${e} errors. ${b + c + d} out of ${event.size} decks corrected thus far.`)
}


// COMPOSE BLOG POST
export const composeBlogPost = async (interaction, event, server) => {
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
    
    const title = `Congrats to ${event.winner} on winning ${event.abbreviation}!`
    const blogTitleDate = dateToVerbose(event.endDate, false, false, true)
    const publishDate = dateToVerbose(event.endDate, true, true, false)
      
    try {
        if (event.isTeamEvent) {
            const team = await Team.findOne({
                where: {
                    id: event.teamId
                },
                include: [{ model: Player, as: 'playerA' }, { model: Player, as: 'playerB' }, { model: Player, as: 'playerC' }]
            })

            const winningDeckA = await Deck.findOne({
                where: {
                    playerId: team.playerAId,
                    eventId: event.id,
                    placement: 1
                }
            })

            const winningDeckB = await Deck.findOne({
                where: {
                    playerId: team.playerBId,
                    eventId: event.id,
                    placement: 1
                }
            })

            const winningDeckC = await Deck.findOne({
                where: {
                    playerId: team.playerCId,
                    eventId: event.id,
                    placement: 1
                }
            })

            const winningDecks = [winningDeckA, winningDeckB, winningDeckC]
            const deckThumbnails = []

            for (let i = 0; i < winningDecks.length; i++) {
                const winningDeck = winningDecks[i]
                const deckThumb = (await DeckThumb.findOne({
                    where: {
                        formatId: winningDeck.formatId,
                        deckTypeId: winningDeck.deckTypeId
                    }
                })) ||
                    (await DeckThumb.findOne({
                    where: {
                        primary: true,
                        deckTypeId: winningDeck.deckTypeId
                    }
                })) ||
                    (await DeckThumb.findOne({
                    where: {
                        deckTypeId: winningDeck.deckTypeId
                    }
                }))

                deckThumbnails.push(
                    `<div class="deckThumbnail">` +
                        `<h3>${capitalize(winningDeck.type, true)}</h3>` +
                        `<div class="deckThumbnail-flexbox">` +
                            `<img class="deckThumbnail-image" src="https://cdn.formatlibrary.com/images/artworks/${deckThumb.leftCardArtworkId}.jpg" alt="${deckThumb.leftCard}"/>` +
                            `<img class="deckThumbnail-image" src="https://cdn.formatlibrary.com/images/artworks/${deckThumb.centerCardArtworkId}.jpg" alt="${deckThumb.centerCard}"/>` +
                            `<img class="deckThumbnail-image" src="https://cdn.formatlibrary.com/images/artworks/${deckThumb.rightCardArtworkId}.jpg" alt="${deckThumb.rightCard}"/>` +
                        `</div>` +
                    `</div>`
                )
            }

            const playerAPfpUrl = await s3FileExists(`images/pfps/${team.playerA.discordId}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${team.playerA.discordId}.png` :
                await s3FileExists(`images/pfps/${team.playerA.globalName}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${team.playerA.globalName}.png` :
                await s3FileExists(`images/pfps/${team.playerA.discordName}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${team.playerA.discordName}.png` :
                await s3FileExists(`images/pfps/${team.playerA.name}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${team.playerA.name}.png` :
                team.playerA.discordId ? 'https://cdn.formatlibrary.com/images/pfps/discord-default-red.png' :
                `https://cdn.formatlibrary.com/images/pfps/human-default.png`

            const playerBPfpUrl = await s3FileExists(`images/pfps/${team.playerB.discordId}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${team.playerB.discordId}.png` :
                await s3FileExists(`images/pfps/${team.playerB.globalName}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${team.playerB.globalName}.png` :
                await s3FileExists(`images/pfps/${team.playerB.discordName}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${team.playerB.discordName}.png` :
                await s3FileExists(`images/pfps/${team.playerB.name}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${team.playerB.name}.png` :
                team.playerB.discordId ? 'https://cdn.formatlibrary.com/images/pfps/discord-default-red.png' :
                `https://cdn.formatlibrary.com/images/pfps/human-default.png`
                
            const playerCPfpUrl = await s3FileExists(`images/pfps/${team.playerC.discordId}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${team.playerC.discordId}.png` :
                await s3FileExists(`images/pfps/${team.playerC.globalName}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${team.playerC.globalName}.png` :
                await s3FileExists(`images/pfps/${team.playerC.discordName}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${team.playerC.discordName}.png` :
                await s3FileExists(`images/pfps/${team.playerC.name}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${team.playerC.name}.png` :
                team.playerC.discordId ? 'https://cdn.formatlibrary.com/images/pfps/discord-default-red.png' :
                `https://cdn.formatlibrary.com/images/pfps/human-default.png`
        
            const serverLogoUrl = server?.preferredLogoUrl ? `https://cdn.formatlibrary.com/images/logos/${server.preferredLogoUrl.replaceAll('+', '%2B')}.png` :
                server?.discordIconId ? `https://cdn.discordapp.com/icons/${server.id}/${server.discordIconId}.webp?size=240` :
                await s3FileExists(`images/logos/${event.community}.png`) ? `https://cdn.formatlibrary.com/images/logos/${event.community}.png` :
                'https://cdn.formatlibrary.com/images/artworks/71625222.jpg'
            
            const serverInviteUrl = server && server.vanityUrl ? `https://discord.com/invite/${server.vanityUrl}` : server?.inviteLink
            const conclusion = server && serverInviteUrl ? `<p class="blogpost-paragraph"><a class="blogpost-event-link" href="${serverInviteUrl}">Join the ${event.community} Discord community to compete in similar events!</a></p>` :
                server && !serverInviteUrl ? `<p class="blogpost-paragraph">Join the ${event.community} Discord community to compete in similar events!</p>` :
                ''
                
            const content = 
                `<div class="blogpost-title-flexbox">` +
                    `<div class="blogpost-title-text">` +
                        `<a href="/events/${event.abbreviation}">` +
                            `<h1 class="blogpost-title">${title}</h1>` +
                        `</a>` +
                        `<p class="blogpost-date">${blogTitleDate}</p>` +
                    `</div>` +
                    `<div class="blogpost-title-emojis">` +
                        `<img class="blogpost-format-icon" src="https://cdn.formatlibrary.com/images/emojis/${event.format?.icon || 'unicorn'}.png"/>` +
                        `<img class="blogpost-event-icon" src="https://cdn.formatlibrary.com/images/emojis/event.png"/>` +
                    `</div>` +
                `</div>` +
                `<div class="blogpost-content-flexbox">` +
                    `<p class="blogpost-paragraph"> ${event.winner} won <a class="blogpost-event-link" href="/events/${event.abbreviation}">${event.name}</a> on ${publishDate}!</p>` +
                    `<div class="blogpost-images-flexbox">` +
                        `<div class="blogpost-pfp-community-flexbox">` +
                            `<img class="blogpost-community"  src="${serverLogoUrl}" />` +
                        `</div>` +
                        `<div class="blogpost-deck-box">` + 
                            `${deckThumbnails[0]}` +
                            `${deckThumbnails[1]}` +
                            `${deckThumbnails[2]}` +
                        `</div>` +
                        `<div class="blogpost-pfp-community-flexbox">` +
                            `<img class="blogpost-pfp" src="${playerAPfpUrl}" />` +
                            `<img class="blogpost-pfp" src="${playerBPfpUrl}" />` +
                            `<img class="blogpost-pfp" src="${playerCPfpUrl}" />` +
                        `</div>` +
                    `</div>` +
                    `${conclusion}` +
                `</div>`
        
            await BlogPost.create({
                title: title,
                content: content,
                publishDate: publishDate,
                formatName: event.formatName,
                formatId: event.formatId,
                teamId: event.teamId,
                serverId: event.tournament?.serverId,
                eventDate: event.endDate,
                eventId: event.id
            })
        
            return await interaction.channel.send(`Composed blogpost for ${event.name}.`)
        } else {
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
        
            if (!decks.length) return await interaction.channel.send(`No decks found for ${event.formatName}.`)
                     
            const freqs = decks.reduce((acc, curr) => (acc[curr.type] ? acc[curr.type]++ : acc[curr.type] = 1, acc), {})
            const popularDecks = Object.entries(freqs).sort((a, b) => b[1] - a[1]).map((e) => e[0]).slice(0, 6)
            const title = `Congrats to ${event.winner} on winning ${event.abbreviation}!`
            const blogTitleDate = dateToVerbose(event.endDate, false, false, true)
            const publishDate = dateToVerbose(event.endDate, true, true, false)

            const playerPfpUrl = await s3FileExists(`images/pfps/${event.winner.discordId}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${event.winner.discordId}.png` :
                await s3FileExists(`images/pfps/${event.winner.globalName}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${event.winner.globalName}.png` :
                await s3FileExists(`images/pfps/${event.winner.discordName}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${event.winner.discordName}.png` :
                await s3FileExists(`images/pfps/${event.winner.name}.png`) ? `https://cdn.formatlibrary.com/images/pfps/${event.winner.name}.png` :
                `https://cdn.formatlibrary.com/images/pfps/discord-default-red.png`
            
            const serverLogoUrl = server.preferredLogoUrl ? `https://cdn.formatlibrary.com/images/logos/${server.preferredLogoUrl.replaceAll('+', '%2B')}.png` :
                server.discordIconId ? `https://cdn.discordapp.com/icons/${server.id}/${server.discordIconId}.webp?size=240` :
                await s3FileExists(`images/logos/${event.community}.png`) ? `https://cdn.formatlibrary.com/images/logos/${event.community}.png` :
                'https://cdn.formatlibrary.com/images/artworks/71625222.jpg'

                
            const main = []
            const mainKonamiCodes = deck.ydk
                .split('#main')[1]
                .split('#extra')[0]
                .split(/[\s]+/)
                .filter((e) => e.length)
                .map((e) => e.trim())
    
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
                const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`) 
                context.drawImage(image, (card_width + 1) * col, row * (card_height + 1), card_width, card_height)
            }
        
            const serverInviteUrl = server && server.vanityUrl ? `https://discord.com/invite/${server.vanityUrl}` : server?.inviteLink
            const conclusion = server && serverInviteUrl ? `<p class="blogpost-paragraph"><a class="blogpost-event-link" href="${serverInviteUrl}">Join the ${event.community} Discord community to compete in similar events!</a></p>` :
                server && !serverInviteUrl ? `<p class="blogpost-paragraph">Join the ${event.community} Discord community to compete in similar events!</p>` :
                ''

            const content = 
                `<div class="blogpost-title-flexbox">` +
                        `<div class="blogpost-title-text">` +
                            `<a href="/events/${event.abbreviation}">` +
                                `<h1 class="blogpost-title">${title}</h1>` +
                            `</a>` +
                            `<p class="blogpost-date">${blogTitleDate}</p>` +
                        `</div>` +
                    `<div class="blogpost-title-emojis">` +
                        `<img class="blogpost-format-icon" src="https://cdn.formatlibrary.com/images/emojis/${event.format.icon}.png"/>` +
                        `<img class="blogpost-event-icon" src="https://cdn.formatlibrary.com/images/emojis/event.png"/>` +
                    `</div>` +
                `</div>` +
                `<div class="blogpost-content-flexbox">` +
                    `<p class="blogpost-paragraph">` +
                        `${event.winner} won <a class="blogpost-event-link" href="/events/${event.abbreviation}">${event.name}</a> on ${publishDate} with a ${popularDecks.includes(deck.type) ? 'popular' : 'rogue'} deck, ${capitalize(deck.type, true)}!` +
                    `</p>` +
                    `<div class="blogpost-images-flexbox">` +
                        `<div class="blogpost-pfp-community-flexbox">` +
                            `<img class="blogpost-pfp" src="${playerPfpUrl}" />` +
                            `<img class="blogpost-community"  src="${serverLogoUrl}" />` +
                        `</div>` +
                        `<div class="blogpost-deck-box">` + 
                            `<a class="blogpost-deck-link" href="/decks/${deck.id}">` +
                                `<img class="blogpost-deck" src="https://cdn.formatlibrary.com/images/decks/previews/${deck.id}.png" />` +
                            `</a>` +
                        `</div>` +
                    `</div>` +
                    `${conclusion}` +
                `</div>`
        
            await BlogPost.create({
                title: title,
                content: content,
                publishDate: publishDate,
                format: event.formatName,
                formatId: event.formatId,
                playerId: event.playerId,
                serverId: event.tournament?.serverId,
                winningDeckId: event.deckId,
                eventDate: event.endDate,
                eventId: event.id
            })
        
            const buffer = canvas.toBuffer('image/png')
            const s3 = new S3({
                region: config.s3.region,
                credentials: {
                    accessKeyId: config.s3.credentials.accessKeyId,
                    secretAccessKey: config.s3.credentials.secretAccessKey
                },
            })
    
            const { Location: uri} = await new Upload({
                client: s3,
                params: { Bucket: 'formatlibrary', Key: `images/decks/previews/${deck.id}.png`, Body: buffer, ContentType: `image/png` },
            }).done()
            console.log('uri', uri)
            return await interaction.channel.send(`Composed blogpost for ${event.name}.`)
        }
    } catch (err) {
        console.log(err)
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
        },
    })

    for (let i = 0; i < decks.length; i++) {
        const deck = decks[i]
        console.log(`drawing ${deck.builder}'s deck...`)
        const main = []
        const mainKonamiCodes = deck.ydk
            .split('#main')[1]
            .split('#extra')[0]
            .split(/[\s]+/)
            .filter((e) => e.length)
            .map((e) => e.trim())

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
                const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`) 
                context.drawImage(image, card_width * col, row * card_height, card_width, card_height)
            }
            
            const buffer = canvas.toBuffer('image/png')
            const { Location: uri} = await new Upload({
                client: s3,
                params: { Bucket: 'formatlibrary', Key: `images/decks/thumbnails/${deck.id}.png`, Body: buffer, ContentType: `image/png` },
            }).done()
            console.log('uri', uri)
        } catch (err) {
            console.log(`Error composing ${deck.builder}'s deck thumbnail`, err)
        }
    }

    return await interaction.channel.send(`Composed deck thumbnails for ${event.name}.`)
}


// DISPLAY DECKS
export const displayDecks = async (interaction, event) => {
    const minPlacement = event.tournament?.topCut ? event.tournament?.topCut :
        event.size <= 8 ? 1 :
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

// DISPLAY DECKS
export const displayReplays = async (interaction, event) => {    
    if (event.primaryTournamentId) {
        const primaryReplays = await Replay.findAll({ 
            where: {
                tournamentId: event.primaryTournamentId
            }
        })
     
        for (let i = 0; i < primaryReplays.length; i++) {
            try {
                const replay = primaryReplays[i]

                const winningDeck = await Deck.findOne({
                    where: {
                        playerId: replay.winnerId,
                        eventId: event.id
                    },
                    include: DeckType
                })
    
                const losingDeck = await Deck.findOne({
                    where: {
                        playerId: replay.loserId,
                        eventId: event.id
                    },
                    include: DeckType
                })

                const round = replay.roundInt
                let display = false
        
                if (event.tournament?.type === 'single elimination') {
                    const totalRounds = Math.ceil(Math.log2(event.size))
                    const roundsRemaining = totalRounds - round
                    display = roundsRemaining === 0 || 
                        event.size > 8 && roundsRemaining <= 1 ||
                        event.size > 16 && roundsRemaining <= 2 ||
                        event.size > 32 && roundsRemaining <= 3
                } else if (event.tournament?.type === 'double elimination') {
                const totalWinnersRounds = Math.ceil(Math.log2(event.size)) + 1
                const fullBracketSize = Math.pow(2, Math.ceil(Math.log2(event.size)))
                const correction = (event.size - (fullBracketSize / 2)) <= (fullBracketSize / 4) ? -1 : 0
                const totalLosersRounds = (totalWinnersRounds - 2) * 2 + correction
                    if (round > 0) {
                        const roundsRemaining = totalWinnersRounds - round
                        display = roundsRemaining === 0 || 
                            event.size > 8 && roundsRemaining <= 1 ||
                            event.size > 16 && roundsRemaining <= 2 ||
                            event.size > 32 && roundsRemaining <= 3
                    } else {
                        const roundsRemaining = totalLosersRounds - Math.abs(round)
                        display = roundsRemaining === 0 ||
                            event.size > 8 && roundsRemaining <= 1 ||
                            event.size > 16 && roundsRemaining <= 2 ||
                            event.size > 32 && roundsRemaining <= 3
                    }
                }

                await replay.update({
                    winningDeckType: winningDeck?.deckType.name,
                    winningDeckId: winningDeck?.id,
                    winningDeckTypeId: winningDeck?.deckTypeId,
                    losingDeckType: losingDeck?.deckType?.name,
                    losingDeckId: losingDeck?.id,
                    losingDeckTypeId: losingDeck?.deckTypeId,
                    eventName: event.abbreviation,
                    eventId: event.id,
                    publishDate: event.endDate,
                    display: display
                })
            } catch (err) {
                console.log(err)
            }
        } 

        await interaction.channel.send(`Published ${primaryReplays.length} new primary tournament replays for ${event.name}.`)
    } else {
        await interaction.channel.send(`No primary tournament replays found for ${event.name}.`)
    }

    if (event.topCutTournamentId) {
        const topCutReplays = await Replay.findAll({ 
            where: {
                tournamentId: event.topCutTournamentId,
                display: false
            }
        })
    
        for (let i = 0; i < topCutReplays.length; i++) {
            try {
                const replay = topCutReplays[i]

                const winningDeck = await Deck.findOne({
                    where: {
                        playerId: replay.winnerId,
                        eventId: event.id
                    },
                    include: DeckType
                })
    
                const losingDeck = await Deck.findOne({
                    where: {
                        playerId: replay.loserId,
                        eventId: event.id
                    },
                    include: DeckType
                })
    
                await replay.update({
                    winningDeckType: winningDeck?.deckType?.name,
                    winningDeckId: winningDeck?.id,
                    winningDeckTypeId: winningDeck?.deckTypeId,
                    losingDeckType: losingDeck?.deckType?.name,
                    losingDeckId: losingDeck?.id,
                    losingDeckTypeId: losingDeck?.deckTypeId,
                    eventName: event.abbreviation,
                    eventId: event.id,
                    publishDate: event.endDate,
                    display: true
                })
            } catch (err) {
                console.log(err)
            }
        }
    
        if (topCutReplays.length) {
            return await interaction.channel.send(`Displayed ${topCutReplays.length} new top cut replays for ${event.name}.`)
        } else {
            return await interaction.channel.send(`The top cut replays for ${event.name} were already published.`)
        }
    } else {
        return await interaction.channel.send(`No top cut replays found for ${event.name}.`)
    }
}

// GENERATE MATCHUP DATA
export const generateMatchupData = async (interaction, server, event, tournament) => {
    const { data: participants } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeAPIKey}`)
    const { data: matches } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/matches.json?api_key=${server.challongeAPIKey}`)
    const deckMap = {}
    let b = 0
    let c = 0
    let d = 0

    for (let i = 0; i < participants.length; i++) {
        const { participant } = participants[i]
        const entry = await Entry.findOne({ 
            where: {
                participantId: participant?.id?.toString()
            }
        })

        if (entry) {
            const deck = await Deck.findOne({
                where: {
                    playerId: entry.playerId,
                    eventId: event.id
                },
                include: DeckType
            })

            if (!deck) continue
            deckMap[participant.id] = deck
        } else {
            const [discordName,] = participant.name.split('#')
            const players = [...(await Player.findAll({
                where: {
                    [Op.or]: {
                        discordName: {[Op.iLike]: discordName},
                        globalName: {[Op.iLike]: discordName}
                    }
                }
            })), ...[...(await Alius.findAll({
                where: {
                    formerName: {[Op.iLike]: discordName}
                },
                include: Player
            }))].map((a) => a.player)]

            if (!players.length) {
                console.log(`CANNOT FIND PLAYER matching participant: ${participant.name} (${participant.id})`)
            }

            for (let j = 0; j < players.length; j++) {
                const player = players[j]
                if (!player) {
                    console.log(`CANNOT FIND PLAYER matching participant: ${participant.name} (${participant.id})`)
                    continue
                }

                const deck = await Deck.findOne({
                    where: {
                        playerId: player.id,
                        eventId: event.id
                    }
                })

                if (!deck) {
                    console.log(`NO DECK FOUND for ${player.globalName || player.discordName}`)
                    continue   
                }                 

                deckMap[participant.id] = deck
            }
        }
    }

    for (let i = 0; i < matches.length; i++) {
        const { match } = matches[i]
        const retrobotMatch = await Match.findOne({ where: { challongeMatchId: match.id }})

        if (!retrobotMatch && (match.forfeited || match.scores_csv === '0-0')) {     
            c++  
            console.log(`match ${match.id} appears to be forfeited from ${tournament.name}`)
            continue
        }

        const winningDeck = deckMap[match.winner_id?.toString()]
        const losingDeck = deckMap[match.loser_id?.toString()]

        if (!winningDeck || !losingDeck) {
            if (!winningDeck) console.log(`MISSING DECK FROM WINNER (${match.winner_id}) of match ${match.id}`)
            if (!losingDeck) console.log(`MISSING DECK FROM LOSER (${match.loser_id}) of match ${match.id}`)
            continue
        }

        const count = await Matchup.count({ where: { challongeMatchId: match.id }})

        if (count) {           
            d++
            console.log(`already have matchup data for match ${match.id} from ${tournament.name}`)
            continue
        }

        const matchup = await Matchup.create({
            formatName: event.format?.name,
            formatId: event.format?.id,
            tournamentId: tournament.id,
            challongeMatchId: match.id,
            matchId: retrobotMatch?.id,
            winningDeckId: winningDeck.id,
            losingDeckId: losingDeck.id,
            winningDeckType: winningDeck.type,
            losingDeckType: losingDeck.type,
            winningDeckTypeId: winningDeck.deckTypeId,
            losingDeckTypeId: losingDeck.deckTypeId,
        })

        b++

        const wins = await Matchup.count({
            where: {
                winningDeckTypeId: matchup.winningDeckTypeId,
                losingDeckTypeId: matchup.losingDeckTypeId,
            }
        })

        const losses = await Matchup.count({
            where: {
                winningDeckTypeId: matchup.losingDeckTypeId,
                losingDeckTypeId: matchup.winningDeckTypeId,
            }
        })

        const percentage = (wins / (wins + losses)).toFixed(3) * 100
        console.log(`added new ${matchup.formatName} format matchup data point: ${matchup.winningDeckType} > ${matchup.losingDeckType} (${percentage}%)`)
    }

    return interaction.editReply(`Generated new matchup data points for ${b} matches from ${tournament.name}.${d ? ` ${d} matchups were already recorded.` : ''}${c ? ` ${c} matches appear to have been forfeited.` : ''} ${b + d + c} out of ${matches.length} matches are now accounted for.`)
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