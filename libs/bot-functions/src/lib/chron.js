
import axios from 'axios'
import * as fs from 'fs'
import * as sharp from 'sharp'
import { Artwork, Card, Deck, DeckType, Entry, Event, Tournament, Match, Matchup, Membership, Player, Price, Print, Replay, Role, Server, Set, Stats } from '@fl/models'
import { createMembership, createPlayer } from './utility'
import { Op } from 'sequelize'
import { S3 } from 'aws-sdk'
import { config } from '@fl/config'
import * as tcgPlayer from '../../../../tokens/tcgplayer.json'
const Canvas = require('canvas')

// GET MIDNIGHT COUNTDOWN
export const getMidnightCountdown = () => {
	const date = new Date()
	const remainingMinutes = 60 - date.getMinutes()
	const remainingHours = 23 - date.getHours()
    return ( remainingHours * 60 + remainingMinutes ) * 60 * 1000
}

export const checkIfEndOfMonth = () => {
	const date = new Date()
    const daysInMonth = (new Date(date.getFullYear(), date.getMonth() + 1, 0)).getDate()
	const remainingDays = daysInMonth - date.getDate()
    
    if (remainingDays < 1) {
        setTimeout(() => updateGlobalNames(), getMidnightCountdown())
    } else {
        setTimeout(() => checkIfEndOfMonth(), 24 * 60 * 60 * 1000)
    }
}

// REFRESH EXPIRED TOKENS
export const refreshExpiredTokens = async () => {
    const difference = Date.now() - new Date(tcgPlayer[".expires"])
    if (!tcgPlayer[".expires"] ||difference > 24 * 60 * 60 * 1000) {
        const params = new URLSearchParams()
        params.append('grant_type', 'client_credentials')
        params.append('client_id', config.tcgPlayer.publicKey)
        params.append('client_secret', config.tcgPlayer.privateKey)

        const { data } = await axios.post(`https://api.tcgplayer.com/token`, params, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded' 
            }
        })

        fs.writeFile('./tokens/tcgplayer.json', JSON.stringify(data), (err) => {
            if (err) return console.error(err)
            console.log('Token stored to', './tokens/tcgplayer.json')
        })
    } else {
        console.log('Token Is Not Expiring Soon')
    }
}

// UPDATE AVATARS
export const updateAvatars = async (client) => {
    const start = Date.now()
    const servers = await Server.findAll({ order: [['size', 'DESC']]})
    const discordIds = []
    for (let s = 0; s < servers.length; s++) {
        try {
            let count = 0
            const server = servers[s]
            const guild = client.guilds.cache.get(server.id)
            const membersMap = await guild.members.fetch()
            const memberIds = [...membersMap.keys()]
            
            for (let i = 0; i < memberIds.length; i++) {
                try {
                    const memberId = memberIds[i]
                    const member = membersMap.get(memberId)
                    const user = member.user
                    if (discordIds.includes(user.id)) continue
                    discordIds.push(user.id)
                    const avatar = user.avatar
                    if (!avatar) continue
                    const player = await Player.findOne({ where: { discordId: memberId }})
                    if (!player) continue
                    const isActive = player.email || await Deck.count({ where: { playerId: player.id }}) || await Stats.count({ where: { playerId: player.id }})

                    if (player && isActive && player.discordPfp && player.discordPfp !== avatar) {
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
                            }
                        })
    
                        const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/pfps/${player.discordId}.png`, Body: buffer, ContentType: `image/png` }).promise()
                        console.log('uri', uri)
                        console.log(`saved new pfp for ${player.globalName || player.discordName}`)
                        count++
                    } else {
                        continue
                    }
                } catch (err) {
                    console.log(err)
                }   
            }

            console.log(`updated ${count} avatars for ${server.name}`)
        } catch (err) {
            console.log(err)
        }
    }

    console.log(`updateAvatars() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => updateAvatars(client), getMidnightCountdown() + (11 * 60 * 1000))
}

// CONDUCT CENSUS
export const conductCensus = async (client) => {
    const start = Date.now()
    // Update every player's username and tag to match their Discord account.
    // It also creates new players if they are not in the database (i.e. they joined while bot was down).
    const servers = await Server.findAll({
        where: {
            access: {[Op.not]: 'free'}
        }
    })

    const checkedDiscordIds = []
    
    for (let s = 0; s < servers.length; s++) {
        try {
            const server = servers[s]
            const guild = client.guilds.cache.get(server.id)
            if (!guild) {
                console.log(`cannot find cached guild for ${server.name}`)
                continue
            }
            
            const membersMap = await guild.members.fetch()
            const members = [...membersMap.values()]
            const rolesMap = guild.roles.cache
            const roles = [...rolesMap.values()].reduce((a, v) => ({ ...a, [v.id]: v.name}), {})
            let updateCount = 0
            let createCount = 0
            let memberCount = 0
            let roleCount = 0
            let inactivatedCount = 0
            let reactivatedCount = 0

            for (let i = 0; i < members.length; i++) {
                const member = members[i]
                if (member.user.bot ) continue

                if (!checkedDiscordIds.includes(member.user.id)) {
                    checkedDiscordIds.push(member.user.id)
                    const player = await Player.findOne({ where: { discordId: member.user.id } })
                    if (player && ( 
                        player.discordName !== member.user.username || 
                        player.discriminator !== member.user.discriminator 
                    )) {
                        updateCount++
                        await player.update({
                            discordName: member.user.username,
                            discriminator: member.user.discriminator
                        })
                    } else if (!player && !member.user.bot) {
                        createCount++
                        await createPlayer(member)
                    }
                }

                const membership = await Membership.count({ where: { '$player.discordId$': member.user.id, serverId: guild.id }, include: Player })
                if (!membership) {
                    memberCount++
                    await createMembership(guild, member)
                }

                for (let j = 0; j < member._roles.length; j ++) {
                    const roleId = member._roles[j]
                    const membership = await Membership.findOne({ where: { '$player.discordId$': member.user.id, serverId: guild.id }, include: Player })
                    if (!membership) break
                    const count = await Role.count({ where: { membershipId: membership.id, roleId: roleId }})
                    if (!count) {
                        await Role.create({
                            membershipId: membership.id,
                            roleId: roleId,
                            roleName: roles[roleId]
                        })

                        roleCount++
                    }
                }
            }

            const memberIds = members.map((m) => m.user.id) || []
            const memberships = await Membership.findAll({ where: { serverId: guild.id }, include: Player }) || []
            for (let i = 0; i < memberships.length; i++) {
                try {
                    const m = memberships[i]
                    if (m.active === true && m.player && !memberIds.includes(m.player.discordId)) {
                        m.active = false
                        await m.save()
                        inactivatedCount++
                    } else if (m.active === false && m.player && memberIds.includes(m.player.discordId)) {
                        m.active = true
                        await m.save()
                        reactivatedCount++
                    }
                } catch (err) {
                    console.log(err)
                }
            }

            console.log( 
                `Updated the following in the database from ${server.name}:` +
                `\n- ${createCount} new ${createCount === 1 ? 'player' : 'players'}` +
                `\n- ${memberCount} new ${memberCount === 1 ? 'member' : 'members'}` +
                `\n- ${inactivatedCount} inactivated ${inactivatedCount === 1 ? 'member' : 'members'}` +
                `\n- ${reactivatedCount} reactivated ${reactivatedCount === 1 ? 'member' : 'members'}` +
                `\n- ${updateCount} updated ${updateCount === 1 ? 'player' : 'players'}` +
                `\n- ${roleCount} updated ${roleCount === 1 ? 'role' : 'roles'}`
            )
        } catch (err) {
            console.log(err)
        }
    }

    console.log(`conductCensus() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => conductCensus(client), getMidnightCountdown() + (4 * 60 * 1000))
}


// UPDATE GLOBAL NAMES
export const updateGlobalNames = async (client) => {
    const start = Date.now()
    // Update active player's global names to match their Discord account.

    const servers = await Server.findAll({
        where: {
            access: {[Op.not]: 'free'}
        }
    })

    const checkedDiscordIds = []
    let updateCount = 0
    
    for (let s = 0; s < servers.length; s++) {
        try {
            const server = servers[s]
            const guild = client.guilds.cache.get(server.id)
            if (!guild) {
                console.log(`cannot find cached guild for ${server.name}`)
                continue
            }
            
            const membersMap = await guild.members.fetch()
            const members = [...membersMap.values()]

            for (let i = 0; i < members.length; i++) {
                const member = members[i]
                if (member.user.bot || checkedDiscordIds.includes(member.user.id)) continue
                checkedDiscordIds.push(member.user.id)

                const player = await Player.findOne({ where: { discordId: member.user.id } })

                if (player && player.duelingBook && (member.user.discriminator === '0' || !player.globalName)) {
                    try {
                        const {data} = await axios.get(`https://discord.com/api/v9/users/${member.user.id}`, {
                            headers: {
                              Authorization: `Bot ${config.services.bot.token}`
                            }
                        })

                        if (
                            player.globalName !== data.global_name
                        ) {
                            console.log(`updating ${member.user.username}`)
                            updateCount++
                            await player.update({
                                globalName: data.global_name
                            })
                        }
                    } catch (err) {
                        console.log(`err`, err.response.headers['retry-after'])
                        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
                        await sleep(err.response.headers['retry-after'] * 1000)
                        i--
                        continue
                    }
                }
            }
        } catch (err) {
            console.log(err)
        }
    }

    console.log(`Monthly Task Complete: Updated ${updateCount} global names.`)
    console.log(`updateGlobalNames() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => checkIfEndOfMonth(), 24 * 60 * 60 * 1000)
}


// MARK INACTIVES
export const markInactives = async () => {
    const start = Date.now()
    let b = 0
    const oneYearAgo = new Date() - (365 * 24 * 60 * 60 * 1000)
    const stats = await Stats.findAll({ where: { inactive: {[Op.not]: true }}, include: Player })

    for (let i = 0; i < stats.length; i++) {
        const s = stats[i]
        const count = await Match.count({ 
            where: {
                formatName: s.format,
                [Op.or]: {
                    winnerId: s.playerId,
                    loserId: s.playerId
                },
                createdAt: {[Op.gte]: oneYearAgo}
            }
        })

        if (!count) { 
            console.log(`Inactivating ${s.player ? s.player.globalName || s.player.discordName : s.playerId}'s STATS IN ${s.format} FORMAT`)
            await s.update({ inactive: true })
            b++
        } else {
            await s.update({ inactive: false })
        }
    }

    console.log(`Inactivated ${b} stats rows in the database.`)
    console.log(`markInactives() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => markInactives(), getMidnightCountdown() + (0.6 * 60 * 1000))
}

// PURGE ENTRIES
export const purgeEntries = async () => {
    const start = Date.now()
    let count = 0
    const entries = await Entry.findAll({ include: Tournament })
    for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const tournament = entry.tournament
    if (tournament.state === 'complete') {
            await entry.destroy()
            count++
        }
    }

    console.log(`Purged ${count} old tournament entries from the database.`)
    console.log(`purgeEntries() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => purgeEntries(), getMidnightCountdown() + (0.1 * 60 * 1000))
} 

// PURGE TOURNAMENT PARTICIPANT ROLES
export const purgeTourRoles = async (client) => {
    const start = Date.now()
    const servers = await Server.findAll()
    for (let s = 0; s < servers.length; s++) {
        let b = 0
        try {
            const server = servers[s]
            const roleId = server.tourRole
            if (!roleId) continue
            const guild = client.guilds.cache.get(server.id)
            const membersMap = await guild.members.fetch()
            const members = [...membersMap.values()]

            for (let i = 0; i < members.length; i++) {
                const member = members[i]
                if (!member._roles.includes(roleId)) continue

                const count = await Entry.count({
                    where: {
                        active: true,
                        '$player.discordId$': member.user.id,
                        '$tournament.serverId$': server.id
                    },
                    include: [Player, Tournament]
                })

                if (member && !count) {
                    console.log(`removing tour role from ${member.user.username}`)
                    b++
                    member.roles.remove(roleId).catch((err) => console.log(err))
                }
            }

            console.log(`removed ${b} old tour roles from ${server.name}`)
        } catch (err) {
            console.log(err)
        }
    }

    console.log(`purgeTourRoles() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => purgeTourRoles(client), getMidnightCountdown() + (0.2 * 60 * 1000))
}

// ASSIGN TOURNAMENT PARTICIPANT ROLES
export const assignTourRoles = async (client) => {
    const start = Date.now()
    const servers = await Server.findAll()
    for (let s = 0; s < servers.length; s++) {
        let b = 0
        try {
            const server = servers[s]
            const roleId = server.tourRole
            if (!roleId) continue
            const guild = client.guilds.cache.get(server.id)
            const membersMap = await guild.members.fetch()
            const members = [...membersMap.values()]

            for (let i = 0; i < members.length; i++) {
                const member = members[i]
                if (member._roles.includes(roleId)) continue

                const count = await Entry.count({
                    where: {
                        active: true,
                        '$player.discordId$': member.user.id,
                        '$tournament.serverId$': server.id
                    },
                    include: [Player, Tournament]
                })

                if (member && count) {
                    console.log(`assigning tour role to ${member.user.username}`)
                    b++
                    member.roles.add(roleId).catch((err) => console.log(err))
                }
            }

            console.log(`assigned ${b} tour roles on ${server.name}`)
        } catch (err) {
            console.log(err)
        }
    }

    console.log(`assignTourRoles() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => assignTourRoles(client), getMidnightCountdown() + (0.4 * 60 * 1000))
}

// UPDATE DECK TYPES
export const updateDeckTypes = async (client) => {
    const start = Date.now()
    let b = 0
    const decks = await Deck.findAll({
        where: {
            type: 'Other',
            suggestedType: {[Op.not]: null }
        }
    })

    for (let i = 0; i < decks.length; i++) {
        const deck = decks[i]
        const deckType = await DeckType.findOne({
            where: {
                cleanName: {[Op.iLike]: deck.suggestedType.replaceAll(' ', '_').replaceAll('-', '_') }
            }
        })

        if (deckType) {
            await deck.update({
                type: deckType.name,
                deckTypeId: deckType.id,
                suggestedType: null
            })

            b++
        } else {
            continue
        }
    }

    console.log(`updated ${b} decks with suggested deck-types`)
    console.log(`updateDeckTypes() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => updateDeckTypes(client), getMidnightCountdown() + (13 * 60 * 1000))
}

// UPDATE MARKET PRICES
export const updateMarketPrices = async () => {
    const start = Date.now()
    let b = 0 
    let c = 0
    const prints = await Print.findAll({
        where: {
            tcgPlayerProductId: {[Op.not]: null}
        }
    })

    for (let i = 0; i < prints.length; i++) {
        const print = prints[i]

        try {
            const endpoint = `https://api.tcgplayer.com/pricing/product/${print.tcgPlayerProductId}`
            const { data } = await axios.get(endpoint, {
                headers: {
                    "Accept": "application/json",
                    "Authorization": `bearer ${tcgPlayer.access_token}`
                }
            })
        
            for (let i = 0; i < data.results.length; i++) {
                const result = data.results[i]
                if (!result.marketPrice) continue
        
                const priceType = result.subTypeName === 'Unlimited' ? 'unlimPrice' :
                    result.subTypeName === '1st Edition' ? 'firstPrice' :
                    result.subTypeName === 'Limited' ? 'limPrice' :
                    null
        
                const recentPrice = await Price.findOne({
                    where: {
                        printId: print.id,
                        source: 'TCGplayer',
                        edition: result.subTypeName
                    },
                    order: [['createdAt', 'DESC']]
                })
        
                if (recentPrice && recentPrice.usd === result.marketPrice) {
                    console.log(`no change in market price for print: ${print.rarity} ${print.cardCode} - ${print.cardName} - ${result.subTypeName} - $${result.marketPrice}`)
                    c++
                    continue
                } else {
                    try {
                        await print.update({ [priceType]: result.marketPrice })
                        await Price.create({
                            usd: result.marketPrice,
                            edition: result.subTypeName,
                            source: 'TCGplayer',
                            printId: print.id
                        }) 
    
                        b++
                        console.log(`saved market price for print: ${print.rarity} ${print.cardCode} - ${print.cardName} - ${result.subTypeName} - $${result.marketPrice}`)
                    } catch (err) {
                        console.log(err)
                    }
                }
            }
        } catch (err) {
            console.log(err)
        }
    }

    console.log(`created ${b} new prices and checked ${c} other(s)`)
    console.log(`updateMarketPrices() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => updateMarketPrices(), getMidnightCountdown() + (3 * 60 * 1000))
}

// UPDATE PRINTS
export const updatePrints = async (set, groupId) => {
    let b = 0
    let c = 0
    let e = 0
    const size = set.size

    for (let offset = 0; offset < (size + 100); offset += 100) {
        try {
            const endpoint = `https://api.tcgplayer.com/catalog/products?groupId=${groupId}&getExtendedFields=true&offset=${offset}&limit=100`
            const { data } = await axios.get(endpoint, {
                headers: {
                    "Accept": "application/json",
                    "Authorization": `bearer ${tcgPlayer.access_token}`
                }
            })
        
            for (let i = 0; i < data.results.length; i++) {
                const result = data.results[i]
                let print = await Print.findOne({
                    where: {
                        tcgPlayerProductId: result.productId
                    }
                })
    
                if (!print) {
                    let name = result.name.replace(/ *\[^]*\) */g, '')
                    if (name.includes('Token:')) name = name.replace('Token:', '') + ' Token'

                    if (
                        name.includes('Yu-Gi-Oh!') ||
                        name.includes('Booster Pack') ||
                        name.includes('Booster Box') ||
                        name.includes('Booster Case') ||
                        name.includes('Blister Pack') ||
                        name.includes('Power Box') ||
                        name.includes('Mega Pack') ||
                        name.includes('Millennium Pack') ||
                        name.includes('Retro Pack') ||
                        name.includes('Duelist Pack') ||
                        name.includes('Battle Pack') ||
                        name.includes('Tournament Pack') ||
                        name.includes('Champion Pack') ||
                        name.includes('Anniversary Pack') ||
                        name.includes('Premium Pack') ||
                        name.includes('Premium Gold') ||
                        name.includes('Turbo Pack') ||
                        name.includes('Starter Deck') ||
                        name.includes('Structure Deck') ||
                        name.includes('Anniversary Tin') ||
                        name.includes('Sarcophagus Tin') ||
                        name.includes('Collectors Tin') ||
                        name.includes('Collector\'s Tin') ||
                        name.includes('2020 Tin') ||
                        name.includes('2021 Tin') ||
                        name.includes('2022 Tin') ||
                        name.includes('2023 Tin') ||
                        name.includes('2024 Tin') ||
                        name.includes('2026 Tin') ||
                        name.includes('2027 Tin') ||
                        name.includes('2028 Tin') ||
                        name.includes('2029 Tin') ||
                        name.includes('Display Box') ||
                        name.includes('Academy Box') ||
                        name.includes('Devastator Box') ||
                        name.includes('Saga Box') ||
                        name.includes('Box Display') ||
                        name.includes('Box Set') ||
                        name.includes('Value Box') ||
                        name.includes('Speed Duel Deck') ||
                        name.includes('Battle City Box') ||
                        name.includes('Mini Box') ||
                        name.includes('Starter Display') ||
                        name.includes('Mavens Box') ||
                        name.includes('Promo Pack') ||
                        name.includes('Master\'s Guide') || 
                        name.includes('Advance Edition') || 
                        name.includes('Special Edition') || 
                        name.includes('Secret Edition') || 
                        name.includes('Domination Display') || 
                        name.includes('Deluxe Edition') ||  
                        name.includes('Master Collection') || 
                        name.includes('Hero Collection') ||
                        name.includes('Legendary Collection') || 
                        name.includes('Collector\'s Set') || 
                        name.includes('Collector Set') || 
                        name.includes('God Deck') || 
                        name.includes('Mega-Tin') || 
                        name.includes('Zexal Tin') || 
                        name.includes('Collection Tin') || 
                        name.includes('[1st Edition]') ||
                        name.includes('[Limited Edition]') ||
                        name.includes('[Unlimited Edition]') ||
                        name.includes('Art Token') ||
                        name.includes('Rise of the True Dragons Display') ||
                        name.includes('Overload Box') ||
                        name.includes('Field Center Token')
                    ) continue

                    if (name.startsWith('Token: ')) name = name.slice(7) + ' Token'
                    if (name.includes(' (')) name = name.slice(0, name.indexOf(' ('))

                    const card = await Card.findOne({
                        where: {
                            [Op.or]: {
                                name: {[Op.iLike]: name },
                                cleanName: {[Op.iLike]: name }
                            }
                        }
                    })
    
                    if (!card) {
                        c++
                        console.log(`could not find card for new print: ${result.name}`)
                        continue
                    }

                    const isSpeedDuel = set.name?.includes('Speed Duel')
                    if (isSpeedDuel && !card.speedLegal) {
                        await card.update({ 
                            speedLegal: true,
                            speedDate: set.tcgDate
                        })
                    }
    
                    print = await Print.create({
                        cardName: card.name,
                        cardCode: result.extendedData[0].value,
                        setName: set.setName,
                        rarity: result.extendedData[1].value,
                        cardId: card.id,
                        setId: set.id,
                        tcgPlayerUrl: result.url,
                        tcgPlayerProductId: result.productId
                    })

                    b++
                    console.log(`created new print: ${print.rarity} ${print.cardCode} - ${print.cardName} (productId: ${print.tcgPlayerProductId})`)
                }
            }
        } catch (err) {
            console.log({
                status: err.response?.status,
                statusText: err.response?.statusText,
                method: err.response?.config.method,
                url: err.response?.config.url,
                data: err.response?.config.data
            })
            e++
        }
    }

    return console.log(`created ${b} new prints for ${set.setName}, couldn't find ${c} cards, encountered ${e} errors`)
}

// GET NEW GROUP ID
export const getNewGroupId = async (setId) => {
    const size = 1000
    const categoryId = `2`
    for (let offset = 0; offset < size; offset += 100) {
        const endpoint = `https://api.tcgplayer.com/catalog/categories/${categoryId}/groups?offset=${offset}&limit=100`
        const { data } = await axios.get(endpoint, {
            headers: {
                "Accept": "application/json",
                "Authorization": `bearer ${tcgPlayer.access_token}`
            }
        })
    
        for (let i = 0; i < data.results.length; i++) {
            const r = data.results[i]
            const set = await Set.findOne({
                where: {
                    [Op.and]: [
                        {setName: {[Op.iLike]: r.name}},
                        {id: setId},
                        {tcgPlayerGroupId: null}
                    ]
                }
            })

            if (set) {
                set.tcgPlayerGroupId = r.groupId
                await set.save()
                return r.groupId
            }
        }
    }   
}

// GET LINK ARROWS
export const getLinkArrows = (directionsArr = []) => {
    const arrows = []
    directionsArr.forEach((dir) => {
        let abbr = ''
        const cardinals = dir.split('-')
        cardinals.forEach((car) => {
            abbr = abbr + car.charAt(0)
        })

        arrows.push(abbr)
    })

    return arrows.join('-')
}

// GET SORT PRIORITY
export const getSortPriority = (type = '') => {
    const sortPriority = type.includes('Trap') ? 11 :
        type.includes('Spell') ? 10 :
        type.includes('Link') ? 9 :
        type.includes('Xyz') ? 8 :
        type.includes('Synchro') ? 7 :
        type.includes('Fusion') ? 6 :
        type.includes('Ritual') ? 5 :
        type.includes('Pendulum') && type.includes('Effect') ? 4 :
        type.includes('Effect') ? 3 :
        type.includes('Pendulum') && !type.includes('Effect') ? 2 :
        type.includes('Normal') ? 1 :
        null

    return sortPriority
}

// GET COLOR
export const getColor = (type = '') => {
    const color = type.includes('Trap') ? 'violet' :
        type.includes('Spell') ? 'green' :
        type.includes('Link') ? 'dark-blue' :
        type.includes('Pendulum') && !type.includes('Normal') ? 'orange-green' :
        type.includes('Pendulum') && type.includes('Normal') ? 'yellow-green' :
        type.includes('Xyz') ? 'black' :
        type.includes('Synchro') ? 'white' :
        type.includes('Ritual') ? 'light-blue' :
        type.includes('Fusion') ? 'purple' :
        type.includes('Effect') ? 'orange' :
        type.includes('Normal') ? 'yellow' :
        type.includes('Token') ? 'gray' :
        null

    return color
}

// DOWNLOAD CARD IMAGE
export const downloadCardImage = async (id) => {
    const s3 = new S3({
        region: config.s3.region,
        credentials: {
            accessKeyId: config.s3.credentials.accessKeyId,
            secretAccessKey: config.s3.credentials.secretAccessKey
        }
    })

    try {
        const {data: fullCardImage} = await axios({
            method: 'GET',
            url: `https://images.ygoprodeck.com/images/cards/${id}.jpg`,
            responseType: 'stream'
        })
    
        const { Location: imageUri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/cards/${id}.jpg`, Body: fullCardImage, ContentType: `image/jpg` }).promise()
        console.log('imageUri', imageUri)
    } catch (err) {
        console.log(err)
    }

    try {
        const {data: croppedCardImage} = await axios({
            method: 'GET',
            url: `https://images.ygoprodeck.com/images/cards_cropped/${id}.jpg`,
            responseType: 'stream'
        })
    
        const { Location: artworkUri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/artworks/${id}.jpg`, Body: croppedCardImage, ContentType: `image/jpg` }).promise()
        console.log('artworkUri', artworkUri)
    } catch (err) {
        console.log(err)
    }
}

// DOWNLOAD ALT ARTWORKS
export const downloadAltArtworks = async () => {
    const start = Date.now()
    let b = 0
    let e = 0

    const s3 = new S3({
        region: config.s3.region,
        credentials: {
            accessKeyId: config.s3.credentials.accessKeyId,
            secretAccessKey: config.s3.credentials.secretAccessKey
        }
    })

    const { data } = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes')

    for (let i = 0; i < data.data.length; i++) {
        const datum = data.data[i]
        const id = datum.id.toString()
        const name = datum.name
        const images = data.card_images

        try {
            const card = await Card.findOne({
                where: {
                    [Op.or]: [
                        {ypdId: id},
                        {name: name}
                    ]
                }
            })

            if (!card) continue

            for (let i = 0; i < images.length; i++) {
                const image = images[i]
                const ypdId = image.id

                const count = await Artwork.count({
                    where: {
                        ypdId: image.id
                    }
                })

                if (count) {
                    console.log(`artwork is already saved, ypdId: ${image.id}`)
                } else if (ypdId === card.id) {
                    await Artwork.create({
                        cardName: card.name,
                        cardId: card.id,
                        ypdId: card.ypdId,
                        isOriginal: true
                    })
                } else {
                    try {
                        const {data: fullCardImage} = await axios({
                            method: 'GET',
                            url: image.image_url,
                            responseType: 'stream'
                        })
                    
                        const { Location: imageUri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/cards/${id}.jpg`, Body: fullCardImage, ContentType: `image/jpg` }).promise()
                        console.log('imageUri', imageUri)

                        const {data: croppedCardImage} = await axios({
                            method: 'GET',
                            url: image.image_url_cropped,
                            responseType: 'stream'
                        })
                    
                        const { Location: artworkUri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/artworks/${id}.jpg`, Body: croppedCardImage, ContentType: `image/jpg` }).promise()
                        console.log('artworkUri', artworkUri)

                        if (imageUri && artworkUri) {
                            await Artwork.create({
                                cardName: card.name,
                                cardId: card.id,
                                ypdId: image.id
                            })

                            console.log(`saved new alternate artwork data, ypdId: ${image.id}`)
                            b++
                        }
                    } catch (err) {
                        console.log(err)
                    }  
                }
            }
        } catch (err) {
            console.log(err)
        }
    }

    console.log(`Saved ${b} new artworks, encountered ${e} errors`)
    console.log(`downloadAltArtworks() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => downloadAltArtworks(), getMidnightCountdown() + (2 * 60 * 1000))
}


// DOWNLOAD CARD ARTWORK
export const downloadCardArtworks = async () => {
    const cards = await Card.findAll()

    for (let i = 0; i < cards.length; i++) {
        try {
            const {ypdId: id} = cards[i]
            const {data} = await axios({
                method: 'GET',
                url: `https://images.ygoprodeck.com/images/cards_cropped/${id}.jpg`,
                responseType: 'stream'
            })
        
            const s3 = new S3({
                region: config.s3.region,
                credentials: {
                    accessKeyId: config.s3.credentials.accessKeyId,
                    secretAccessKey: config.s3.credentials.secretAccessKey
                }
            })
        
            const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/artworks/${id}.jpg`, Body: data, ContentType: `image/jpg` }).promise()
            console.log('uri', uri)
        } catch (err) {
            console.log(err)
        }
    }
}

// DOWNLOAD NEW CARDS
export const downloadNewCards = async () => {
    const start = Date.now()
    let b = 0
    let c = 0
    let t = 0
    let o = 0
    let p = 0
    let e = 0
    const { data } = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes')
    for (let i = 0; i < data.data.length; i++) {
        const datum = data.data[i]
        const id = datum.id.toString()
        const name = datum.name
        const cleanName = datum.name.replaceAll(/['"]/g, '').split(/[^A-Za-z0-9]/).filter((e) => e.length).join(' ')

        try {
            const card = await Card.findOne({
                where: {
                    [Op.or]: [
                        {ypdId: id},
                        {name: name}
                    ]
                    
                }
            })
    
            let konamiCode = id
            while (konamiCode.length < 8) konamiCode = '0' + konamiCode
            const type = datum.type
            const category = type.includes('Monster') ? 'Monster' :
                type.includes('Spell') ? 'Spell' :
                type.includes('Skill') ? 'Skill' :
                type.includes('Trap') ? 'Trap' :
                type.includes('Token') ? 'Token' :
                null

            if (!category) console.log(`No category for ${datum.type}`)

            const tcgLegal = (
                id === '501000000' || 
                id === '501000001' || 
                id === '501000002' || 
                id === '501000003' || 
                id === '501000004' || 
                id === '501000006' || 
                id === '501000007' || 
                id === '111000561' ||
                category === 'Skill' ||
                category === 'Token'
            ) ? false : !!datum.misc_info[0]?.tcg_date

            const ocgLegal = (
                category === 'Skill' ||
                category === 'Token'
            ) ? false : !!datum.misc_info[0]?.ocg_date

            const speedLegal = datum.misc_info[0]?.formats?.includes('Speed Duel')
            const tcgDate = category !== 'Skill' ? datum.misc_info[0]?.tcg_date || null : null
            const ocgDate = category !== 'Skill' ? datum.misc_info[0]?.ocg_date || null : null

            if (!card) {
                await Card.create({
                    name: name,
                    cleanName: cleanName,
                    konamiCode: konamiCode,
                    ypdId: id,
                    tcgLegal: tcgLegal,
                    ocgLegal: ocgLegal,
                    speedLegal: speedLegal,
                    category: category,
                    icon: category !== 'Monster' ? datum.race : null,
                    normal: category === 'Monster' && type.includes('Normal'),
                    effect: category === 'Monster' &&
                        !type.includes('Normal') && 
                        (
                            type.includes('Effect') || 
                            type.includes('Flip') || 
                            type.includes('Gemini') || 
                            type.includes('Spirit') || 
                            type.includes('Toon') || 
                            type.includes('Union') || 
                            type.includes('Tuner')
                        ),
                    fusion: category === 'Monster' && type.includes('Fusion'),
                    ritual: category === 'Monster' && type.includes('Ritual'),
                    synchro: category === 'Monster' && type.includes('Synchro'),
                    xyz: category === 'Monster' && type.includes('Xyz'),
                    pendulum: category === 'Monster' && type.includes('Pendulum'),
                    link: category === 'Monster' && type.includes('Link'),
                    flip: category === 'Monster' && type.includes('Flip'),
                    gemini: category === 'Monster' && type.includes('Gemini'),
                    spirit: category === 'Monster' && type.includes('Spirit'),
                    toon: category === 'Monster' && type.includes('Toon'),
                    tuner: category === 'Monster' && type.includes('Tuner'),
                    union: category === 'Monster' && type.includes('Union'),
                    attribute: datum.attribute,
                    type: (category === 'Monster' || category === 'Token') ? datum.race : null,
                    level: (category === 'Monster' || category === 'Token') && !type.includes('Link') ? datum.level : null,
                    rating: category === 'Monster' && type.includes('Link') ? datum.linkval : null,
                    arrows: category === 'Monster' && type.includes('Link') ? getLinkArrows(datum.linkmarkers) : null,
                    scale: category === 'Monster' && type.includes('Pendulum') ? datum.scale : null,
                    atk: (category === 'Monster' || category === 'Token') ? datum.atk : null,
                    def: (category === 'Monster' || category === 'Token') && !type.includes('Link') ? datum.def : null,
                    description: datum.desc,
                    tcgDate: tcgDate,
                    ocgDate: ocgDate,
                    extraDeck: type.includes('Fusion') || type.includes('Synchro') || type.includes('Xyz') || type.includes('Link'),
                    color: getColor(datum.type),
                    sortPriority: getSortPriority(datum.type)
                })
                b++
                console.log(`New card: ${name} (TCG Date: ${datum.misc_info[0]?.tcg_date}, OCG Date: ${datum.misc_info[0]?.ocg_date})`)
                await downloadCardImage(id)
                console.log(`Image saved (${name})`)
            } else if (card && (card.name !== name || card.ypdId !== id || card.cleanName !== cleanName)) {
                c++
                console.log(`New name and/or ID: ${card.name} (${card.ypdId}) is now: ${name} (${id})`)
                
                await card.update({
                    name: name,
                    cleanName: cleanName,
                    ypdId: id,
                    konamiCode: konamiCode,
                    description: datum.desc,
                    tcgLegal: tcgLegal,
                    ocgLegal: ocgLegal,
                    tcgDate: tcgDate,
                    ocgDate: ocgDate
                })

                await downloadCardImage(id)
                console.log(`Image saved (${datum.name})`)
            } else if (card && (!card.tcgDate || !card.tcgLegal) && tcgDate) {
                await card.update({
                    name: name,
                    cleanName: cleanName,
                    description: datum.desc,
                    tcgDate: tcgDate,
                    tcgLegal: true
                })

                t++
                console.log(`New TCG Card: ${card.name}`)
                await downloadCardImage(id)
                console.log(`Image saved (${card.name})`)
            } else if (card && (!card.ocgDate || !card.ocgLegal) && ocgDate) {
                await card.update({
                    ocgDate: ocgDate,
                    ocgLegal: true  
                })

                o++
                console.log(`New OCG Card: ${card.name}`)
            } else if (card && (!card.speedLegal || !card.speedDate) && speedLegal) {
                const print = await Print.findOne({
                    where: {
                        cardId: card.id,
                        setName: {[Op.substring]: 'Speed Duel'}
                    },
                    include: Set,
                    order: [[Set, 'tcgDate', 'DESC']],
                })

                const speedDate = print?.set?.tcgDate

                await card.save({
                    speedDate: speedDate,
                    speedLegal: true
                })

                p++
                console.log(`New Speed Duel Card: ${card.name}`)
            }
        } catch (err) {
            e++ 
            console.log(err)
        }
    }

    console.log(`Found ${b} new cards, ${c} new names, ${t} new TCG cards, ${o} new OCG cards, ${p} new Speed Duel cards, encountered ${e} errors`)
    console.log(`downloadNewCards() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => downloadNewCards(), getMidnightCountdown() + (2 * 60 * 1000))
}


// PURGE LOCALS AND INTERNAL DECKS
export const purgeLocalsAndInternalDecks = async () => {
    const start = Date.now()
    let b = 0
    let e = 0
    const decks = await Deck.findAll({
        where: {
            origin: 'event',
            eventId: null
        }
    })

    for (let i = 0; i < decks.length; i++) {
        try {
            const deck = decks[i]
            await deck.destroy()
            b++
        } catch (err) {
            console.log(err)
            e++
        }
    }

    console.log(`Purged ${b} locals and internal tournament decks, encountered ${e} errors`)
    console.log(`purgeLocalsAndInternalDecks() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => purgeLocalsAndInternalDecks(), getMidnightCountdown() + (0.3 * 60 * 1000))
}


// PURGE BETA CARDS
export const purgeBetaCards = async () => {
    const start = Date.now()
    let b = 0
    let c = 0
    let e = 0
    const { data } = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes')
    for (let i = 0; i < data.data.length; i++) {
        const datum = data.data[i]
        const id = datum.id.toString()
        const name = datum.name
        const betaId = datum.misc_info[0]?.beta_id?.toString()
        const betaName = datum.misc_info[0]?.beta_name
        if (!betaId || !betaName) continue

        try {
            const betaCard = await Card.findOne({
                where: {
                    ypdId: betaId,
                    name: betaName
                }
            })
    
            const card = await Card.findOne({
                where: {
                    ypdId: id,
                    name: name
                }
            })

            if (betaCard && card && betaCard.id !== card.id) {
                console.log(`destroying ${betaCard.name} (${betaCard.ypdId}), which is now ${card.name} (${card.ypdId})`)
                await betaCard.destroy()
                b++
            } else if (betaCard && !card) {
                console.log(`Beta Card: ${betaCard.name} (${betaCard.ypdId}) exists, but ${card.name} (${card.ypdId}) does not ⚠️`)
            } else if (!betaCard && card) {
                console.log(`${card.name} (${card.ypdId}) exists, while Beta Card: ${betaName} (${betaId}) does not 👍`)
            } else {                
                console.log(`Beta Card: ${betaCard.name} (${betaCard.ypdId}) and ${card.name} (${card.ypdId}) share the same FL id: (${betaCard.id})`)
            }
        } catch (err) {
            e++ 
            console.log(err)
        }
    }

    console.log(`Purged ${b} beta cards, updating ${c} card names, encountered ${e} errors`)
    console.log(`purgeBetaCards() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => purgeBetaCards(), (24 * 60 * 60 * 1000))
}


// UPDATE SETS
export const updateSets = async () => {
    const start = Date.now()
    let b = 0
    let c = 0
    const { data } = await axios.get('https://db.ygoprodeck.com/api/v7/cardsets.php')
    for (let i = 0; i < data.length; i++) {
        try {
            const datum = data[i]
            if (!datum.set_name.includes('Shonen Jump') && !datum.set_name.includes('(POR)') && datum.tcg_date) {
                let set = await Set.findOne({
                    where: {
                        setName: {[Op.iLike]: datum.set_name }
                    }
                })

                if (set && !set.tcgPlayerGroupId) {
                    const tcgPlayerGroupId = await getNewGroupId(set.id)
                    if (!tcgPlayerGroupId) {
                        console.log(`no tcgPlayerGroupId for ${set.setName}`)
                        continue
                    } else {
                        console.log(`updating group Id for ${set.setName} from ${set.tcgPlayerGroupId} to ${tcgPlayerGroupId}`)
                        set.tcgPlayerGroupId = tcgPlayerGroupId
                        await set.save()
                    }
                }

                if (set && set.tcgPlayerGroupId) {
                    if (set.size !== datum.num_of_cards) {
                        console.log(`updating size of ${set.setName} from ${set.size} to ${datum.num_of_cards}`)
                        set.size = datum.num_of_cards
                        await set.save()
                        c++
                    }

                    try {
                        await updatePrints(set, set.tcgPlayerGroupId)
                    } catch (err) {
                        console.log(err)
                    }
                } else if (!set) {
                    set = await Set.create({
                        setName: datum.set_name,
                        setCode: datum.set_code,
                        size: datum.num_of_cards,
                        tcgDate: datum.tcg_date
                    })

                    b++

                    console.log(`created new set: ${datum.set_name} (${datum.set_code})`)
                    const groupId = await getNewGroupId(set.id)

                    try {
                        await updatePrints(set, groupId)
                        console.log(`collected prints for new set: ${datum.set_name} (${datum.set_code})`)
                    } catch (err) {
                        console.log(err)
                    }
                }
            }
        } catch (err) {
            console.log(err)
        }
    }

    console.log(`created ${b} new sets and updated ${c} other(s)`)
    console.log(`updateSets() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => updateSets(), getMidnightCountdown() + (1 * 60 * 1000))
}

// DRAW SET BANNED
export const drawSetBanner = async (set) => {
    const prints = await Print.findAll({
        where: {
            setId: set.id,
            region: {[Op.or]: ['NA', null]}
        },
        order: [['cardCode', 'ASC']],
        include: Card
    })

    const main = []
    
    for (let i = 0; i < prints.length; i++) {
        let konamiCode = prints[i].card.konamiCode
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        const card = await Card.findOne({ where: { konamiCode: konamiCode }})
        if (!card) continue
        const filtered = main.filter((c) => c.id === card.id)
        if (!filtered.length) main.push(card)
    }

    const sortFn = (a, b) => {
        if (a.sortPriority > b.sortPriority) {
            return 1
        } else if (b.sortPriority > a.sortPriority) {
            return -1
        } else if (a.name > b.name) {
            return 1
        } else if (b.name > a.name) {
            return -1
        } else {
            return 0
        }
    }

    main.sort(sortFn)

    const card_width = 72
    const card_height = 105
    const canvas = Canvas.createCanvas(card_width * main.length, card_height)
    const context = canvas.getContext('2d')

    for (let i = 0; i < main.length; i++) {
        const card = main[i]
        const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`) 
        context.drawImage(image, card_width * i, 0, card_width, card_height)
    }

    const buffer = canvas.toBuffer('image/png')
    const s3 = new S3({
        region: config.s3.region,
        credentials: {
            accessKeyId: config.s3.credentials.accessKeyId,
            secretAccessKey: config.s3.credentials.secretAccessKey
        }
    })

    const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/sets/slideshows/${set.setCode}.png`, Body: buffer, ContentType: `image/png` }).promise()
    console.log('uri', uri)
}

// UPDATE SERVERS
export const updateServers = async (client) => {
    const start = Date.now()
    const guilds = [...client.guilds.cache.values()]

    for (let i = 0; i < guilds.length; i++) {
        const guild = guilds[i]
        const count = await Server.count({
            where: {
                id: guild.id
            }
        }) 

        if (!count) {
            console.log('Creating server:', guild.name)
            await Server.create({ id: guild.id, name: guild.name })
        } else {
            console.log(`server found: ${guild.name}`)
        }
    }

    const servers = await Server.findAll()
    for (let i = 0; i < servers.length; i++) {
        try {
            const server = servers[i]
            const guild = client.guilds.cache.get(server.id)
            if (!guild) {
                console.log(`${server.name} cannot be found in the client cache`)
                await server.destroy()
                continue
            } else {
                console.log(`guild found: ${server.name}`)
            }
    
            if (server.name !== guild.name) {
                console.log(`updating server name from ${server.name} => ${guild.name}`)
                server.name = guild.name
                await server.save()
            }
    
            if (server.size !== guild.memberCount) {
                console.log(`updating server size from ${server.size} => ${guild.memberCount}`)
                server.size = guild.memberCount
                await server.save()
            }

            const owner = await Player.findOne({ where: { discordId: guild.ownerId }})

            if (owner && server.ownerId !== owner.id) {
                console.log(`updating server owner from ${server.ownerId} => ${owner.id}`)
                server.ownerId = owner.id
                await server.save()
            }
        } catch (err) {
            console.log(err)
        }
    }

    console.log(`updateServers() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => updateServers(client), getMidnightCountdown() + (0.8 * 60 * 1000))
}


// UPDATE DECKS
export const updateDecks = async () => {
    const start = Date.now()
    let b = 0
    let e = 0
    const decks = await Deck.findAll({ include: [DeckType, Event, Player] })
    for (let i = 0; i < decks.length; i++) {
        try {
            const deck = decks[i]
            let updated

            if (deck.player?.name && deck.builder !== deck.player?.name) {
                console.log(`updating deck ${deck.id} builder:`, deck.builder, '->', deck.player?.name)
                await deck.update({ builder: deck.player.name })
                updated = true
            }
    
            if (deck.deckType?.name && deck.type !== deck.deckType?.name) {
                console.log(`updating deck ${deck.id} type:`, deck.type, '->', deck.deckType?.name)
                await deck.update({ type: deck.deckType.name })
                updated = true
            }
    
            if (deck.deckType?.category && deck.category !== deck.deckType?.category) {
                console.log(`updating deck ${deck.id} category:`, deck.category, '->', deck.deckType?.category)
                await deck.update({ category: deck.deckType.category })
                updated = true
            }
    
            if (deck.event?.abbreviation && deck.eventName !== deck.event?.abbreviation) {
                console.log(`updating deck ${deck.id} eventName:`, deck.eventName, '->', deck.event?.abbreviation)
                await deck.update({ eventName: deck.event.abbreviation })
                updated = true
            }

            if (updated) b++
        } catch (err) {
            e++
            console.log(err)
        }
    }

    console.log(`updated ${b} decks, encountered ${e} errors`)
    console.log(`updateDecks() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => updateDecks(), getMidnightCountdown() + (14 * 60 * 1000))
}


// UPDATE REPLAYS
export const updateReplays = async () => {
    const start = Date.now()
    let b = 0
    let e = 0
    const replays = await Replay.findAll({ 
        include: [{ model: Deck, as: 'losingDeck' }, { model: Deck, as: 'winningDeck' }, Event, { model: Player, as: 'loser' }, { model: Player, as: 'winner' }] 
    })

    for (let i = 0; i < replays.length; i++) {
        try {
            const replay = replays[i]
            let updated

            if (replay.winningDeck?.type && replay.winningDeckType !== replay.winningDeck?.type) {
                console.log(`updating replay ${replay.id} winningDeckType:`, replay.winningDeckType, '->', replay.winningDeck?.type)
                await replay.update({ winningDeckType: replay.winningDeck.type })
                updated = true
            }
    
            if (replay.losingDeck?.type && replay.losingDeckType !== replay.losingDeck?.type) {
                console.log(`updating replay ${replay.id} losingDeckType:`, replay.losingDeckType, '->', replay.losingDeck?.type)
                await replay.update({ losingDeckType: replay.losingDeck.type })
                updated = true
            }
    
            if (replay.winner?.name && replay.winnerName !== replay.winner?.name) {
                console.log(`updating replay ${replay.id} winnerName:`, replay.winnerName, '->', replay.winner?.name)
                await replay.update({ winnerName: replay.winner.name })
                updated = true
            }
    
            if (replay.loser?.name && replay.loserName !== replay.loser?.name) {
                console.log(`updating replay ${replay.id} loserName:`, replay.loserName, '->', replay.loser?.name)
                await replay.update({ loserName: replay.loser.name })
                updated = true
            }
    
            if (replay.event?.abbreviation && replay.eventName !== replay.event?.abbreviation) {
                console.log(`updating replay ${replay.id} eventName:`, replay.eventName, '->', replay.event?.abbreviation)
                await replay.update({ eventName: replay.event.abbreviation })
                updated = true
            }

            if (updated) b++
        } catch (err) {
            e++
            console.log(err)
        }
    }

    console.log(`updated ${b} replays, encountered ${e} errors`)
    console.log(`updateReplays() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => updateReplays(), getMidnightCountdown() + (15 * 60 * 1000))
}


// UPDATE MATCHUPS
export const updateMatchups = async () => {
    const start = Date.now()
    let b = 0
    let e = 0
    const matchups = await Matchup.findAll({ 
        include: [{ model: Deck, as: 'losingDeck' }, { model: Deck, as: 'winningDeck' }] 
    })

    for (let i = 0; i < matchups.length; i++) {
        try {
            const matchup = matchups[i]
            let updated

            if (matchup.winningDeck?.type && matchup.winningDeckType !== matchup.winningDeck?.type) {
                console.log(`updating matchup ${matchup.id} winningDeckType:`, matchup.winningDeckType, '->', matchup.winningDeck?.type)
                await matchup.update({ 
                    winningDeckType: matchup.winningDeck.type,
                    winningDeckTypeId: matchup.winningDeck.deckTypeId
                })
                updated = true
            }
    
            if (matchup.losingDeck?.type && matchup.losingDeckType !== matchup.losingDeck?.type) {
                console.log(`updating matchup ${matchup.id} losingDeckType:`, matchup.losingDeckType, '->', matchup.losingDeck?.type)
                await matchup.update({ 
                    losingDeckType: matchup.losingDeck.type,
                    losingDeckTypeId: matchup.losingDeck.deckTypeId
                })
                updated = true
            }

            if (updated) b++
        } catch (err) {
            e++
            console.log(err)
        }
    }

    console.log(`updated ${b} matchups, encountered ${e} errors`)
    console.log(`updateMatchups() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
    return setTimeout(() => updateMatchups(), getMidnightCountdown() + (16 * 60 * 1000))
}
