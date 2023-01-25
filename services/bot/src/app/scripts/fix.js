
import { Op } from 'sequelize'
import { BlogPost, Card, Deck, DeckType, Entry, Event, Format, Iron, Match, Matchup, Membership, Player, RatedDeck, Pool, Server, Stats, Status, Tournament } from '@fl/models'
import { capitalize } from '../functions/utility'
import axios from 'axios'
import * as Canvas from 'canvas'
import * as fs from 'fs'
import sharp from 'sharp'
import { S3 } from 'aws-sdk'
import { S3Keys } from '@fl/config'

const fixFormats = async () => {
    let b = 0
    let c = 0
    const formats = await Format.findAll()

    for (let i = 0; i < formats.length; i++) {
        const f = formats[i]
        const name = f.name.replace(' ', '_').replace('-', '_')

        try {
            const stats = await Stats.findAll({
                where: {
                    format: {[Op.iLike]: name }
                }
            }) || []
    
            for (let j = 0; j < stats.length; j++) {
                const s = stats[j]
                s.format = f.name
                await s.save()
                b++
            }
    
            const matches = await Match.findAll({
                where: {
                    format: {[Op.iLike]: name }
                }
            }) || []
    
            for (let j = 0; j < matches.length; j++) {
                const m = matches[j]
                m.format = f.name
                await m.save()
                c++
            }
        } catch (err) {
            console.log(err)
        }
    }

    return console.log(`fixed ${b} stats, ${c} matches`)
}


const fixDeckTypes = async () => {
    let b = 0
    let e = 0
    const decksTypes = await DeckType.findAll()

    for (let i = 0; i < decksTypes.length; i++) {
        try {
            const d = decksTypes[i]
            const name = capitalize(d.name, true)
            const category = capitalize(d.category, true)
            const format = capitalize(d.format, true)
            d.format = format
            d.name = name
            d.category = category
            await d.save()
            b++
        } catch (err) {
            e++
            console.log(err)
        }
    }

    return console.log(`fixed ${b} deckTypes, encountered ${e} errors`)
}

const fixMatchups = async () => {
    let b = 0
    let e = 0
    const matchups = await Matchup.findAll()

    for (let i = 0; i < matchups.length; i++) {
        try {
            const m = matchups[i]
            const format = capitalize(m.format, true).replace('_', '-')
            m.format = format
            await m.save()
            b++
        } catch (err) {
            e++
            console.log(err)
        }
    }

    return console.log(`fixed ${b} matchups, encountered ${e} errors`)
}

const erasePasswords = async () => {
    let b = 0
    const players = await Player.findAll({
        where: {
            password: {[Op.not]: null }
        }
    })

    for (let i = 0; i < players.length; i++) {
        const p = players[i]
        p.password = null
        await p.save()
        b++
    }

    return console.log(`erased the passwords for ${b} players`)
}


const fixInternal = async () => {
    const matches = await Match.findAll({
        where: {
            serverId: '961281521719836693'
        }
    })

    for (let i = 0; i < matches.length; i++) {
        const m = matches[i]
        m.internal = true
        await m.save()
    }

    return
}

const findMissingBlogPostPFPs = async () => {
    const blogposts = await BlogPost.findAll({ include: Player })
    for (let i = 0; i < blogposts.length; i++) {
        const bp = blogposts[i]
        if (!bp.player) continue
        const exists = fs.existsSync(`../formatlibrary/public/images/pfps/${bp.playerId}.png`)
        if (!exists) console.log(`missing PFP for ${bp.player.name}: ${bp.player.id}.png`)
    }
}

const downloadDuelingBookAvatar = async (playerId, cardId) => {
    const {data} = await axios.get(
        `https://images.duelingbook.com/low-res/${cardId}.jpg`, {
            responseType: 'arraybuffer',
        }
    )

    const png = await sharp(data).toFormat('png').toBuffer()
    const canvas = Canvas.createCanvas(128, 128)
    const context = canvas.getContext('2d')
    const image = await Canvas.loadImage(png)
    context.drawImage(image, 0, 0, 128, 128)
    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(`../pfps/${playerId}.png`, buffer)
    console.log(`saved new pfp for ${playerId}`)
}



// COMPOSE THUMBNAILS
const composeThumbnails = async () => {
    let b = 0
    const decks = await Deck.findAll()
    if (!decks.length) return console.log('no decks found')
    for (let i = 0; i < decks.length; i++) {
        try {    
            const deck = decks[i]
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
            const card_width = 36
            const card_height = 52.5
            const canvas = Canvas.createCanvas(card_width * 10, card_height * rows)
            const context = canvas.getContext('2d')
    
            for (let i = 0; i < main.length; i++) {
                const card = main[i]
                const row = Math.floor(i / 10)
                const col = i % 10
                const image = await Canvas.loadImage(`../../formatlibrary/public/images/cards/${card.ypdId}.jpg`) 
                context.drawImage(image, card_width * col, row * card_height, card_width, card_height)
            }
            
            const buffer = canvas.toBuffer('image/png')
            fs.writeFileSync(`../decks/thumbnails/${deck.id}.png`, buffer)
            console.log('saved deck thumbnail')
            b++
        } catch (err) {
            console.log(err)
        }
    }

    return console.log(`composed ${b} deck thumbnails.`)
}


// COMPOSE PREVIEWS
const composePreviews = async () => {
    let b = 0
    const decks = await Deck.findAll({
        where: {
            placement: 1
        }
    })

    for (let z = 0; z < decks.length; z++) {
        try {
            const deck = decks[z]
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
        
            const buffer = canvas.toBuffer('image/png')
            fs.writeFileSync(`../decks/previews/${deck.id}.png`, buffer)
            console.log(`composed preview`)
            b++
        } catch (err) {
            console.log(err)
        }
    }

    return console.log(`composed ${b} previews`)
}

const fixDecks = async () => {
    let a = 0
    let e = 0
    const decks = await Deck.findAll({
        include: [Event, DeckType]
    })
    
    for (let i = 0; i < decks.length; i++) {
        try {
            const deck = decks[i]
            if (!deck.origin) {
                if (deck.eventId) {
                    await deck.update({ origin: 'event' })
                } else {
                    await deck.update({ origin: 'user' })
                }
            }

            if (deck.event && deck.event.abbreviation && deck.eventName !== deck.event.abbreviation) {
                await deck.update({ eventName: deck.event.abbreviation })
            }

            if (!deck.publishDate && deck.eventId) {
                await deck.update({ publishDate: deck.event.endDate })
            }

            if (deck.deckType && deck.category !== deck.deckType.category) {
                await deck.update({ category: deck.deckType.category })
            }

            a++
        } catch (err) {
            e++
            console.log(err)
        }
    }

    return console.log(`updated ${a} decks; encountered ${e} errors`)
}

const fixIrons = async () => {
    let a = 0
    let e = 0
    const irons = await Iron.findAll()
    for (let i = 0; i < irons.length; i++) {
        try {
            const d = irons[i]
            const player = await Player.findOne({ where: { discordId: d.playerId.toString() }})
            d.playerId = player.id
            await d.save()
            a++
        } catch (err) {
            console.log(err)
            e++
        }
    }

    return console.log(`updated ${a} irons; encountered ${e} errors`)
}

const fixMatches = async () => {
    let a = 0
    let e = 0
    const matches = await Match.findAll({
        where: {
            [Op.or]: {
                winner: null,
                loser: null
            }
        }
    })
    for (let i = 0; i < matches.length; i++) {
        try {
            const m = matches[i]
            const winningPlayer = await Player.findOne({ where: { id: m.winnerId }})
            m.winner = winningPlayer.name
            const losingPlayer = await Player.findOne({ where: { id: m.loserId }})
            m.loser = losingPlayer.name
            await m.save()
            a++
        } catch (err) {
            console.log(err)
            e++
        }
    }

    return console.log(`updated ${a} matches; encountered ${e} errors`)
}

const fixMemberships = async () => {
    let a = 0
    let e = 0
    const memberships = await Membership.findAll({ include: Player })
    for (let i = 0; i < memberships.length; i++) {
        try {
            const membership = memberships[i]
            const count = await Membership.count({
                where: {
                    playerId: membership.playerId,
                    guildName: membership.guildName
                }
            })

            if (count > 1) {
                console.log(`destroying ${membership.player.name}'s duplicate membership to ${membership.guildName}`)
                await membership.destroy()
                a++
            }
        } catch (err) {
            console.log(err)
            e++
        }
    }

    return console.log(`purged ${a} duplicate memberships; encountered ${e} errors`)
}


const fixPools = async () => {
    let a = 0
    let e = 0
    const pools = await Pool.findAll()
    for (let i = 0; i < pools.length; i++) {
        try {
            const d = pools[i]
            const player = await Player.findOne({ where: { discordId: d.playerId.toString() }})
            d.playerId = player.id
            await d.save()
            a++
        } catch (err) {
            console.log(err)
            e++
        }
    }

    return console.log(`updated ${a} rated pools; encountered ${e} errors`)
}

const fixServers = async () => {
    let a = 0
    let e = 0
    const servers = await Server.findAll()
    for (let i = 0; i < servers.length; i++) {
        try {
            const d = servers[i]
            const player = await Player.findOne({ where: { discordId: d.ownerId.toString() }})
            d.ownerId = player.id
            await d.save()
            a++
        } catch (err) {
            console.log(err)
            e++
        }
    }

    return console.log(`updated ${a} servers; encountered ${e} errors`)
}

const fixStats = async () => {
    let a = 0
    let e = 0
    const stats = await Stats.findAll()
    for (let i = 0; i < stats.length; i++) {
        try {
            const d = stats[i]
            const player = await Player.findOne({ where: { discordId: d.playerId.toString() }})
            d.playerId = player.id
            await d.save()
            a++
        } catch (err) {
            console.log(err)
            e++
        }
    }

    return console.log(`updated ${a} stats; encountered ${e} errors`)
}

const fixEvents = async () => {
    let b = 0
    let e = 0
    const events = await Event.findAll()
    for (let i = 0; i < events.length; i++) {
        try {
            const event = events[i]
            await event.update({ type: event.type.toLowerCase() })
            b++
        } catch (err) {
            console.log(err)
            e++
        }
    }

    return console.log(`fixed ${b} events; encountered ${e} errors`)
}

const fixPlayers = async () => {
    const irlPlayers = await Player.findAll({
        where: {
            firstName: {[Op.not]: null},
            lastName: null
        }
    })

    for (let i = 0; i < irlPlayers.length; i++) {
        const player = irlPlayers[i]
        const arr = player.firstName.split(" ")
        player.firstName = arr[0]
        player.lastName = arr.slice(1).join(" ")
        await player.save()
    }

    console.log(`fixed ${irlPlayers.length} irl players`)

    const discordPlayers = await Player.findAll({
        where: {
            discordId: {[Op.not]: null}
        }
    })

    for (let i = 0; i < discordPlayers.length; i++) {
        const player = discordPlayers[i]
        player.discordName = player.name
        await player.save()
    }

    return console.log(`fixed ${discordPlayers.length} discord players`)
}

const downloadYDKs = async () => {
    let z = 0
    let b = 0
    const entries = await Entry.findAll({ include: Tournament })

    for (let i = 0; i < entries.length; i++) {
        try {
            const e = entries[i]
            const url = e.url
            const id = url.slice(url.indexOf('?id=') + 4)
            const {data} = await axios.get(`https://www.duelingbook.com/php-scripts/load-deck.php/deck?id=${id}`)
            if (!data) return false
            const main = data.main.map((e) => e.serial_number)
            const side = data.side.map((e) => e.serial_number)
            const extra = data.extra.map((e) => e.serial_number)
            const ydk = ['created by...', '#main', ...main, '#extra', ...extra, '!side', ...side, ''].join('\n')
    
            await Deck.create({
                builder: e.playerName,
                formatName: e.tournament.formatName,
                ydk: ydk,
                eventName: e.tournament.name,
                origin: 'event',
                display: false,
                community: e.tournament.community,
                playerId: e.playerId
            })

            b++
        } catch (err) {
            console.log(err)
            z++
        }
    }

    return console.log(`saved ${b} decks; encountered ${z} errors`)
}

const saveYDKs = async () => {
    const decks = await Deck.findAll({ where: { eventName: 'DD1' }, include: Player })
    for (let i = 0; i < decks.length; i++) {
        const deck = decks[i]
        const player = deck.player
        try {
            const tag = player.name.replace(/[^\ws]/gi, "_").replace(/ /g,'') + '_' + player.discriminator
            fs.writeFile(`../decks/EdisonFormat.com/DD01/${tag}.ydk`, deck.ydk, (err) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(`${player.name}'s deck was saved!`)
                }
            })
        } catch (err) {
            console.log(err)
        }
    }
}

const fixEntries = async () => {
    let b = 0
    const entries = await Entry.findAll({ include: Player })
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        entry.playerName = entry.player.name
        await entry.save()
        b++
    }

    return console.log(`fixed ${b} entries`)
}

// COPY RATED DECKS TO DECKS
const copyRatedDecksToDecks = async () => {
    let b = 0
    const ratedDecks = await RatedDeck.findAll({ include: Player })
    for (let i = 0; i < ratedDecks.length; i++) {
        try {
            const rd = ratedDecks[i]
            const format = await Format.findOne({ where: { name: rd.format }})
    
            const deck = await Deck.create({
                name: rd.name,
                builder: rd.builder,
                playerId: rd.player.id,
                formatName: format.name,
                formatId: format.id,
                origin: 'user',
                url: rd.url,
                ydk: rd.ydk,
                display: false
            })
        
            if (deck) b++
        } catch (err) {
            console.log(err)
        }
    }

    return console.log(`copied ${b} rated decks to the decks table`)
}

const fixBlogs = async () => {
    let a = 0
    const blogposts = await BlogPost.findAll({ include: Event }) 
    for (let i = 0; i < blogposts.length; i++) {
        try {
            const b = blogposts[i]
            if (!b.event || !b.event.abbreviation) continue
            if (!b.title.includes('on winning ')) continue
            const oldAbbreviation = b.title.slice(b.title.indexOf('on winning ') + 11, -1)
            const newAbbreviation = b.event.abbreviation
            await b.update({ content: b.content.replaceAll(oldAbbreviation, newAbbreviation)})
            a++
        } catch (err) {
            console.log(err)
        }
    }

    return console.log(`fixed ${a} blogposts`)
}

const purgePfps = async () => {
    let b = 0
    let e = 0

    const s3 = new S3({
        region: S3Keys.region,
        credentials: {
            accessKeyId: S3Keys.credentials.accessKeyId,
            secretAccessKey: S3Keys.credentials.secretAccessKey
        }
    })

    let data = []
    let complete = false
    let token = null
    while (!complete) {
        const { Contents, IsTruncated, NextContinuationToken } = await s3.listObjectsV2({
            Bucket: 'formatlibrary', 
            Prefix: 'images/pfps/',
            ContinuationToken: token,
        }).promise()
        
        data = [...data, ...Contents]

        if (IsTruncated) {
            token = NextContinuationToken
        } else {
            complete = true
        }
    }
    
    for (let i = 0; i < data.length; i++) {
        try {
            const Key = data[i].Key
            const file = Key.slice(12, -4)
            const player = await Player.findOne({ where: {
                [Op.or]: {
                    name: file,
                    discordId: file
                }
            }})
    
            if (!player) {
                console.log('DELETE:', Key, `(Not Found)`)
                await s3.deleteObject({
                    Bucket: 'formatlibrary', 
                    Key: Key
                }).promise()

                b++
            } 
    
            if (!player) continue
    
            const isActive = player.email || await Deck.count({ where: { playerId: player.id }}) || await Stats.count({ where: { playerId: player.id }})
    
            if (!isActive) {
                console.log('DELETE:', Key, `(${player.name})`)
                await s3.deleteObject({
                    Bucket: 'formatlibrary', 
                    Key: Key
                }).promise()

                b++
            }
        } catch (err) {
            console.log(err)
            e++
        }

        console.log(`Deleted ${b} objects, encountered ${e} errors`)
    }
}

const fixPfps = async () => {
    let b = 0
    let e = 0

    const s3 = new S3({
        region: S3Keys.region,
        credentials: {
            accessKeyId: S3Keys.credentials.accessKeyId,
            secretAccessKey: S3Keys.credentials.secretAccessKey
        }
    })

    const players = await Player.findAll({
        where: {
            discordPfp: {[Op.not]: null}
        }
    })

    for (let i = 0; i < players.length; i++) {
        const player = players[i]
        const isActive = player.email || await Deck.count({ where: { playerId: player.id }}) || await Stats.count({ where: { playerId: player.id }})
        if (!isActive) continue

        try {
            const { ETag } = await s3.headObject({ 
                Bucket: 'formatlibrary',
                Key: `images/pfps/${player.discordId}`
            }).promise()

            if (ETag) continue
        } catch (err) {
            try {
                const {data} = await axios.get(
                    `https://cdn.discordapp.com/avatars/${player.discordId}/${player.discordPfp}.webp`, {
                        responseType: 'arraybuffer',
                    }
                )

                if (!data) continue
                const buffer = await sharp(data).toFormat('png').toBuffer()
                const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/pfps/${player.discordId}.png`, Body: buffer, ContentType: `image/png` }).promise()
                console.log('uri', uri)
                console.log(`saved new pfp for ${player.name}`)
                b++
            } catch (err) {
                console.log(err)
                e++
            }
        }    
    }

    return console.log(`saved ${b} pfps, encountered ${e} errors`)
}

const fixTournmanets = async () => {
    const tournaments = await Tournament.findAll()
    let b = 0
    let e = 0

    for (let i = 0; i < tournaments.length; i++) {
        try {
            const tournament = tournaments[i]
            const format = await Format.findOne({
                where: {
                    [Op.or]: {
                        name: {[Op.iLike]: tournament.formatName}
                    }
                }
            })
    
            await tournament.update({ formatId: format.id })
            b++
        } catch (err) {
            e++
            console.log(err)
        }
    }

    return console.log(`saved ${b} tournaments, encountered ${e} errors`)
}

const fixStatuses = async () => {
    const statuses = await Status.findAll({
        where: {
            banlist: 'sep13'
        },
        order: [["name", "ASC"]]
    })

    let b = 0
    let e = 0
    const c = statuses.length

    for (let i = 0; i < statuses.length; i+=2) {
        try {
            const status = statuses[i]
            await status.destroy()
            b++
        } catch (err) {
            console.log(err)
            e++
        }
    }

    return console.log(`destroyed ${b} out of ${c} statuses, encountered ${e} errors`)
}

const findDuplicateTournamentReports = async () => {
    let b = 0
    let e = 0
    const matches = await Match.findAll({
        where: {
            tournament: true
        },
        order: [["createdAt", "ASC"]]
    })

    for (let i = 0 ; i < matches.length; i++) {
        try {
            const match = matches[i]
            const fifteenMinutesLater = match.createdAt + (30 * 60 * 1000)
    
            const duplicates = [...await Match.findAll({
                where: {
                    id: {[Op.gt]: match.id},
                    winnerId: match.winnerId,
                    loserId: match.loserId,
                    tournament: false,
                    createdAt: {[Op.lte]: fifteenMinutesLater}
                }
            })].map((m) => m.id)
    
            if (duplicates.length) {
                b += duplicates.length
                console.log(`Potential Duplicate: ${match.id} and ${duplicates.join(', ')}. (${match.createdAt.toDateString()})`)
            }
        } catch (err) {
            e++
            console.log(err)
        }
    }

    return console.log(`found ${b} potential duplicates, encountered ${e} errors`)

}

const fixCards = async () => {
    let b = 0
    let e = 0

    const cards = await Card.findAll({
        where: {
            description: {[Op.substring]: ': ●'}
        }
    })

    for (let i = 0; i < cards.length; i++) {
        try {
            const card = cards[i]
            await card.update({ description: card.description.replaceAll(': ●', ':\n●') })
            b++
        } catch (err) {
            console.log(err)
            e++
        }
    }

    return console.log(`fixed ${b} card descriptions; encountered ${e} errors`)
}


// fixCards()
// findDuplicateTournamentReports()
// fixStatuses()
// fixTournmanets()
// fixPfps()
// fixBlogs()
// copyRatedDecksToDecks()
// fixEntries()
// saveYDKs()
// downloadYDKs()
// fixPlayers()
// fixDecks()
// fixEntries()
// fixIrons()
// fixMatches()
// fixMemberships()
// fixPools()
// fixServers()
// fixStats()
// fixRatedDecks()
// fixEvents()
// fixBlogposts()
// composeThumbnails()
// composePreviews()
// downloadDuelingBookAvatar('692063231988072479', '3904')
// findMissingBlogPostPFPs()
// fixInternal()
// fixFormats()
// erasePasswords()
// createNewStatues()
// fixStats()
// fixMatches()
// fixDecks()
// fixDeckTypes()
// fixMatchups()
// deleteMemberships()
// fixMemberships()