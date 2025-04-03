
import axios from 'axios'
import * as fs from 'fs'
import * as sharp from 'sharp'
import { Artwork, BlogPost, Card, ChronRecord, Community, Deck, DeckThumb, DeckType, Entry, Event, Format, Tournament, Match, Matchup, Membership, Player, Pool, Price, Print, Replay, Role, Server, Set, Stats, Subscription } from '@fl/models'
import { checkTimeBetweenDates, createMembership, createPlayer, dateToVerbose, s3FileExists, capitalize, checkIfDiscordNameIsTaken, getNextDateAtMidnight, getNextSundayAtMidnight, getStartOfNextMonthAtMidnight, countDaysInBetweenDates } from './utility'
import { Op } from 'sequelize'
import { getFirstOfTwoRatedConfirmations, updateGeneralStats, updateSeasonalStats } from '@fl/bot-functions'
import { Upload } from '@aws-sdk/lib-storage'
import { S3 } from '@aws-sdk/client-s3'
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

// IS SUNDAY
export const isSunday = () => {
	const date = new Date()
    if(date.getDay() === 0) {
        return true
    }
}

// GET REMAINING DAYS IN MONTH
export const getRemainingDaysInMonth = () => {
	const date = new Date()
    const daysInMonth = (new Date(date.getFullYear(), date.getMonth() + 1, 0)).getDate()
	const remainingDays = daysInMonth - date.getDate()
    return remainingDays
}

// RUN FREQUENT TASKS
export const runFrequentTasks = async (client) => {
    await cleanUpPools()
    await lookForAllPotentialPairs(client)
    await manageSubscriptions(client)

    return setTimeout(() => runFrequentTasks(client), 5 * 60 * 1000)
}

// RUN NIGHTLY TASKS
export const runNightlyTasks = async (client) => {
    try {
        // const index = await ChronRecord.count({
        //     where: {
        //         status: 'complete'
        //     }
        // })
        
        const tasks = [
            manageSubscriptions, purgeEntries, purgeTournamentRoles, assignTournamentRoles,
            purgeLocalsAndInternalDecks, recalculateAllStats, refreshExpiredTokens, updateSets, 
            updateMarketPrices, updateDecks, updateDeckTypes, downloadNewCards, 
            downloadAltArtworks, downloadMissingCardImages, updateServers
        ]
    
        for (let i = 0; i < tasks.length; i++) {
            console.log(`RUNNING TASK ${i}`)
            await tasks[i](client)
    
            if (i === tasks.length - 1) {
                const records = await ChronRecord.findAll({
                    where: {
                        status: 'complete'
                    }
                })
    
                for (let j = 0; j < records.length; j++) {
                    await records[j].update({ status: 'archived' })
                }

                if (isSunday()) {
                    await runWeeklyTasks(client)
                }
    
                const remainingDaysInMonth = getRemainingDaysInMonth()
                if (remainingDaysInMonth === 1) {
                    await runMonthlyTasks(client)
                }
            }
        }
    } catch (err) {
        console.log(err)
    }
    
    return setTimeout(() => runNightlyTasks(client), getMidnightCountdown())
}

// RUN MONTHLY TASKS
export const runWeeklyTasks = async (client) => {
    await updateMinMedMaxRarities()
    await conductCensus(client)
    await updateAvatars(client)
}

// RUN MONTHLY TASKS
export const runMonthlyTasks = async () => {
    await updateGlobalNames()
}

// REFRESH EXPIRED TOKENS
export const refreshExpiredTokens = async () => {
    try {
        const difference = new Date(tcgPlayer[".expires"]) - Date.now()
        if (!tcgPlayer[".expires"] || difference < 24 * 60 * 60 * 1000) {
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
                console.log('tcgPlayer token stored to', './tokens/tcgplayer.json')
            })
        } else {
            console.log('tcgPlayer token is not expiring soon')
        }
    } catch (err) {
        console.log(err)
    }
}

// UPDATE AVATARS
export const updateAvatars = async (client) => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'updateAvatars',
        status: 'underway'
    })
    
    const servers = await Server.findAll({ order: [['size', 'DESC']]})
    const discordIds = []
    try {
        for (let s = 0; s < servers.length; s++) {
            let count = 0
            const server = servers[s]
            const guild = client.guilds.cache.get(server.id)
            if (!guild) {
                console.log('no guild', server.name)
                continue
            }
            const membersMap = await guild.members.fetch()
            const memberIds = [...membersMap.keys()]
            
            for (let i = 0; i < memberIds.length; i++) {
                const memberId = memberIds[i]
                const member = membersMap.get(memberId)
                const user = member.user
                if (discordIds.includes(user.id)) continue
                discordIds.push(user.id)
                const avatar = user.avatar
                if (!avatar) continue
                const player = await Player.findOne({ where: { discordId: memberId }})
                if (!player) continue
                const isActive = player.email || (await Deck.count({ where: { builderId: player.id }})) || (await Stats.count({ where: { playerId: player.id }}))

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
                        },
                    })

                    const { Location: uri} = await new Upload({
                        client: s3,
                        params: { Bucket: 'formatlibrary', Key: `images/pfps/${player.discordId}.png`, Body: buffer, ContentType: `image/png` },
                    }).done()
                    console.log('uri', uri)
                    console.log(`saved new pfp for ${player.name}`)
                    count++
                } else {
                    continue
                }
            } 
        }
    } catch (err) {
        console.log(err)
    }  

    console.log(`updated ${count} avatars for ${server.name}`)

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    return console.log(`updateAvatars() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}


// CONDUCT CENSUS
export const conductCensus = async (client) => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'conductCensus',
        status: 'underway'
    })
    // Update every player's username and tag to match their Discord account.
    // It also creates new players if they are not in the database (i.e. they joined while bot was down).
    const servers = await Server.findAll({
        where: {
            access: {[Op.not]: 'free'}
        },
        order: [['size', 'DESC']]
    })

    const checkedDiscordIds = []
    
    for (let s = 0; s < servers.length; s++) {
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
                try {
                    checkedDiscordIds.push(member.user.id)
                    const player = await Player.findOne({ where: { discordId: member.user.id } })
                    if (player && ( 
                        player.discordName !== member.user.username
                    )) {
                        await checkIfDiscordNameIsTaken(member.user.username)
                        await player.update({ discordName: member.user.username })
                        updateCount++
                    } else if (!player && !member.user.bot) {
                        createCount++
                        await createPlayer(member)
                    }
                } catch (err) {
                    console.log(err)
                }
            }

            try {
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
            } catch (err) {
                console.log(err)
            }
        }

        const memberIds = members.map((m) => m.user.id) || []
        const memberships = (await Membership.findAll({ where: { serverId: guild.id }, include: Player })) || []
        for (let i = 0; i < memberships.length; i++) {
            try {
                const m = memberships[i]
                if (m.isActive === true && m.player && !memberIds.includes(m.player.discordId)) {
                    m.isActive = false
                    await m.save()
                    inactivatedCount++
                } else if (m.isActive === false && m.player && memberIds.includes(m.player.discordId)) {
                    m.isActive = true
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
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    return console.log(`conductCensus() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}


// UPDATE GLOBAL NAMES
export const updateGlobalNames = async () => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'updateGlobalNames',
        status: 'underway'
    })
    // Update active player's global names to match their Discord account. 
    // Prioritize by most active player.
    // If global name is taken, do not update it.

    const gamesPlayed = {}

    const stats = [...await Stats.findAll({
        include: Player
    })]
    
    stats.forEach((s) => {
        if (!s.player.globalName) {
            if (gamesPlayed[s.playerId]) {
                gamesPlayed[s.playerId] += s.games
            } else {
                gamesPlayed[s.playerId] = s.games
            }
        }
    })

    const playerIdsSortedByGamesPlayed = Object.entries(gamesPlayed).sort((a, b) => b[1] - a[1])

    let updateCount = 0
    for (let i = 0; i < playerIdsSortedByGamesPlayed.length; i++) {
        try {
            const playerId = playerIdsSortedByGamesPlayed[i][0]
            const player = await Player.findOne({ where: { id: playerId } })
            if (!player?.discordId) continue

            const {data} = await axios.get(`https://discord.com/api/v9/users/${player.discordId}`, {
                headers: {
                    Authorization: `Bot ${config.services.bot.token}`
                }
            })

            if (data.global_name) {
                try {
                    const count = await Player.count({ where: { globalName: data.global_name }})
                    
                    if (count) {
                        console.log(`Sorry, ${player.discordName}, but ${data.global_name} is already taken by a player with a higher priority.`)
                        continue
                    } else {
                        console.log(`updating ${player.discordName}'s global name: ${player.globalName} -> ${data.global_name}`)
                        await player.update({ globalName: data.global_name })
                        updateCount++
                    }
                } catch (err) {
                    console.log(err)
                }
            }
        } catch (err) {
            console.log(`error message:`, err?.message)
            const retryAfter = err?.response?.headers?.['retry-after']
            if (!retryAfter) continue
            console.log(`retry after:`, retryAfter)
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
            await sleep(err.response.headers['retry-after'] * 1000)
            i--
            continue
        }
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    console.log(`Monthly Task Complete: Updated ${updateCount} global names.`)
    return console.log(`updateGlobalNames() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}


// MARK INACTIVES
// export const markInactives = async () => {
//     const start = Date.now()
    // const chronRecord = await ChronRecord.create({
    //     function: 'markInactives',
    //     status: 'underway'
    // })
//     let b = 0
//     const twoYearsAgo = new Date(Date.now() - (2 * 365 * 24 * 60 * 60 * 1000))
//     const stats = await Stats.findAll({ where: { isActive:  true }, include: Player })

//     for (let i = 0; i < stats.length; i++) {
//         const s = stats[i]
//         const count = await Match.count({ 
//             where: {
//                 formatId: s.formatId,
//                 [Op.or]: {
//                     winnerId: s.playerId,
//                     loserId: s.playerId
//                 },
//                 createdAt: {[Op.gte]: twoYearsAgo}
//             }
//         })

//         if (!count) { 
//             console.log(`Inactivating ${s.player?.name || s.playerId}'s STATS IN ${s.formatName} FORMAT`)
//             await s.update({ isActive: false }).catch((err) => console.log(err))
//             b++
//         }
//     }

//     console.log(`Inactivated ${b} stats rows in the database.`)
//     return console.log(`markInactives() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
// }

// PURGE ENTRIES
export const purgeEntries = async () => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'purgeEntries',
        status: 'underway'
    })
    let count = 0
    try {
        const entries = await Entry.findAll({ include: Tournament })
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]
            const tournament = entry.tournament
            if (tournament.state === 'complete') {
                await entry.destroy()
                count++
            }
        }
    } catch (err) {
        console.log(err)
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })
    
    console.log(`Purged ${count} old tournament entries from the database.`)
    return console.log(`purgeEntries() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}

// PURGE TOURNAMENT PARTICIPANT ROLES
export const purgeTournamentRoles = async (client) => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'purgeTournamentRoles',
        status: 'underway'
    })
    const servers = await Server.findAll()
    for (let s = 0; s < servers.length; s++) {
        try {
            let b = 0
            const server = servers[s]
            const roleId = server.tournamentRoleId
            if (!roleId) continue
            const guild = client.guilds.cache.get(server.id)
            const membersMap = await guild.members.fetch()
            const members = [...membersMap.values()]

            for (let i = 0; i < members.length; i++) {
                const member = members[i]
                if (!member._roles.includes(roleId)) continue

                const count = await Entry.count({
                    where: {
                        isActive: true,
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

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    return console.log(`purgeTournamentRoles() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}

// CLEAN UP POOLS
export const cleanUpPools = async () => {
    const start = Date.now()
    
    let b = 0
    let c = 0
    let e = 0
    const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000))
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))

    const poolsToPurge = await Pool.findAll({
        where: {
            updatedAt: {[Op.lte]: thirtyDaysAgo}
        }
    })

    for (let i = 0; i < poolsToPurge.length; i++) {
        try {
            const pool = poolsToPurge[i]
            await pool.destroy()
            b++
        } catch (err) {
            e++
            console.log(err)
        }
    }
    
    const poolsToReset = await Pool.findAll({
        where: {
            updatedAt: {[Op.lte]: twoHoursAgo}
        }
    })

    for (let i = 0; i < poolsToReset.length; i++) {
        try {
            const pool = poolsToReset[i]
            await pool.update({ status: 'pending' })
            c++
        } catch (err) {
            e++
            console.log(err)
        }
    }

    console.log(`purged ${b} rated pools, reset ${c} rated pools, encountered ${e} errors`)
    return console.log(`cleanUpPools() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}

// LOOK FOR ALL POTENTIAL PAIRS
export const lookForAllPotentialPairs = async (client) => {
    console.log('lookForAllPotentialPairs()')
    const pools = await Pool.findAll({
        where: {
            status: 'pending'
        },
        include: [Player, Format]
    })

    const playerIds = []

    for (let i = 0; i < pools.length; i++) {
        const pool = pools[i]
        const player = pool.player
        const format = pool.format
        const potentialPairs = await Pool.findAll({ 
            where: { 
                formatId: pool.formatId,
                playerId: {[Op.not]: pool.playerId},
                status: 'pending'
            },
            include: Player,
            order: [['createdAt', 'ASC']]
        }) || []
    
        for (let i = 0; i < potentialPairs.length; i++) {
            try {
                const potentialPair = potentialPairs[i]
                const cutoff = new Date(new Date() - (15 * 60 * 1000))
        
                const mostRecentMatch = await Match.findOne({
                    where: {
                        [Op.or]: [
                            { winnerId: player.id, loserId: potentialPair.playerId },
                            { loserId: player.id, winnerId: potentialPair.playerId },
                        ],
                        formatId: pool.formatId
                    },
                    order: [['createdAt', 'DESC']]
                })
    
                if (mostRecentMatch && cutoff < mostRecentMatch?.createdAt) {
                    console.log(`<!> ${pool.playerName} and ${potentialPair.playerName} are recent opponents. Match reported at ${recentMatch?.createdAt}<!>`)
                    continue
                } else if (playerIds.includes(player.id) || playerIds.includes(potentialPair.playerId)) {
                    console.log(`<!> ${pool.playerName} and/or ${potentialPair.playerName} have already been sent a confirmation notification <!>`)
                    continue
                } else {
                    playerIds.push(player.id)
                    playerIds.push(potentialPair.playerId)
                    console.log(`getFirstOfTwoRatedConfirmations from ${player?.name} (${format.name})`)
                    getFirstOfTwoRatedConfirmations(client, player, potentialPair.player, format)
                    continue
                }
            } catch (err) {
                console.log(err)
            }
        }
    }
}

// RECALCULATE FORMAT STATS
export const recalculateFormatStats = async (format) => {
    const count = await Match.count({ where: { formatId: format.id }})
    console.log(`Recalculating data from ${count} ${format.name} ${format.emoji} matches. Please wait...`)

    const attributes = format.useSeasonalElo ? [
        'id', 'formatId', 'elo', 'bestElo', 'backupElo', 'wins', 'losses', 'games', 
        'seasonalElo', 'bestSeasonalElo', 'backupSeasonalElo', 'seasonalWins', 'seasonalLosses', 'seasonalGames', 
        'classicElo', 'backupClassicElo', 'currentStreak', 'bestStreak', 'vanquished', 'playerName', 'playerId', 'serverId'
    ] : [
        'id', 'formatId', 'elo', 'bestElo', 'backupElo', 'wins', 'losses', 'games',  
        'classicElo', 'backupClassicElo', 'currentStreak', 'bestStreak', 'vanquished', 'playerName', 'playerId', 'serverId'
    ]

    const servers = await Server.findAll({
        where: {
            [Op.or]: [
                {
                    id: '414551319031054346'
                },
                {
                    hasInternalLadder: true,
                    formatId: format.id
                }
            ],
        }
    })

    for (let z = 0; z < servers.length; z++) {
        const server = servers[z]
        console.log('server.name', server.name)
        let allStats = await Stats.findAll({ 
            where: { formatId: format.id, serverId: server.id }, 
            attributes: attributes
        })

        const allMatches = await Match.findAll({ 
            where: { formatId: format.id, serverId: server.id }, 
            attributes: ['id', 'formatId', 'serverId', 'winnerName', 'loserName', 'winnerId', 'loserId', 'winnerDelta', 'loserDelta', 'classicDelta', 'createdAt', 'isSeasonal'], 
            order: [["createdAt", "ASC"]]
        })

        if (!allMatches.length) { 
            console.log(`No matches for ${format.name}.`)
            continue
        }

        // const today = new Date()
        let currentDate = allMatches[0].createdAt
        let firstDayOfSeason = format.seasonResetDate
        let currentSunday
        let currentMonth
        // let nextDate = getNextDateAtMidnight(currentDate)
        let nextSunday = firstDayOfSeason ? getNextSundayAtMidnight(firstDayOfSeason) : null
        let nextMonth = getStartOfNextMonthAtMidnight(currentDate)
    
        if (format.useSeasonalElo) {
            for (let i = 0; i < allStats.length; i++) {
                const stats = allStats[i]
                await stats.update({
                    elo: 500.00,
                    bestElo: 500.00,
                    backupElo: null,
                    wins: 0,
                    losses: 0,
                    games: 0,
                    seasonalElo: 500.00,
                    bestSeasonalElo: 500.00,
                    backupSeasonalElo: null,
                    seasonalWins: 0,
                    seasonalLosses: 0,
                    seasonalGames: 0,
                    classicElo: 500.00,
                    backupClassicElo: null,
                    currentStreak: 0,
                    bestStreak: 0,
                    vanquished: 0
                })
            }
        } else {
            for (let i = 0; i < allStats.length; i++) {
                const stats = allStats[i]
                await stats.update({
                    elo: 500.00,
                    bestElo: 500.00,
                    backupElo: null,
                    wins: 0,
                    losses: 0,
                    games: 0,
                    classicElo: 500.00,
                    backupClassicElo: null,
                    currentStreak: 0,
                    bestStreak: 0,
                    vanquished: 0
                })
            }
        }
    
        for (let i = 0; i < allMatches.length; i++) {
            try {
                const match = allMatches[i]
                
                if (nextMonth < match.createdAt) {
                    await applyGeneralDecay(format.id, format.name, server.id, currentMonth || currentDate, nextMonth)
                    currentMonth = nextMonth
                    nextMonth = getStartOfNextMonthAtMidnight(currentMonth)

                    allStats = await Stats.findAll({ 
                        where: { formatId: format.id, serverId: server.id }, 
                        attributes: attributes
                    })
                }
    
                if (match.isSeasonal && format.useSeasonalElo && format.seasonResetDate < match.createdAt && nextSunday < match.createdAt) {
                    await applySeasonalDecay(format.id, format.name, server.id, currentSunday || firstDayOfSeason, nextSunday)
                    currentSunday = nextSunday
                    nextSunday = getNextSundayAtMidnight(currentSunday)

                    allStats = await Stats.findAll({
                        where: { formatId: format.id, serverId: server.id }, 
                        attributes: attributes
                    })
                }
    
                const winnerId = match.winnerId
                const loserId = match.loserId
                const winnerStats = allStats.find((s) => s.playerId === winnerId)
                const loserStats = allStats.find((s) => s.playerId === loserId)
    
                if (!winnerStats) {
                    const stats = await Stats.create({
                        playerName: match.winnerName,
                        playerId: winnerId,
                        formatName: format.name,
                        formatId: format.id,
                        serverId: server.id,
                        isInternal: server.hasInternalLadder
                    })
    
                    console.log('created new winner stats', winnerId)
                    allStats.push(stats)
                    i--
                    continue
                }
    
                if (!loserStats) {
                    const stats = await Stats.create({
                        playerName: match.loserName,
                        playerId: loserId,
                        formatName: format.name,
                        formatId: format.id,
                        serverId: server.id,
                        isInternal: server.hasInternalLadder
                    })
    
                    console.log('created new loser stats:', loserId)
                    allStats.push(stats)
                    i--
                    continue
                }
    
                const [winnerDelta, loserDelta, classicDelta] = await updateGeneralStats(winnerStats, loserStats)
                await match.update({ winnerDelta, loserDelta, classicDelta })
                if (match.isSeasonal && format.seasonResetDate < match.createdAt) await updateSeasonalStats(winnerStats, loserStats)
                console.log(`${format.name} Match ${i+1}: ${winnerStats.playerName} > ${loserStats.playerName}`)
            } catch (err) {
                console.log(err)
            }
        }
    
        for (let i = 0; i < allStats.length; i++) {
            const stats = allStats[i]
            const victories = await Match.findAll({
                where: {
                    winnerId: stats.playerId,
                    formatId: format.id, 
                    serverId: server.id
                },
                attributes: ['winnerId', 'loserId', 'formatId', 'serverId']
            })
    
            const vanquishedIds = []
            victories.forEach((v) => {
                if (!vanquishedIds.includes(v.loserId)) vanquishedIds.push(v.loserId)
            })
    
            console.log(`${stats.playerName} has defeated ${vanquishedIds.length} unique opponents`)
            await stats.update({ vanquished: vanquishedIds.length })
        }
    }

    return console.log(`Recalculation for ${format.name} Format is complete!`)
}
    

// RECALCULATE ALL STATS
export const recalculateAllStats = async () => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'recalculateAllStats',
        status: 'underway'
    })

    const formats = await Format.findAll({
        attributes: ['id', 'name'],
        order: [["name", "ASC"]]
    })
    
    for (let i = 0; i < formats.length; i++) {
        const format = formats[i]
        await recalculateFormatStats(format)
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    console.log(`All recalculations complete!`)
    return console.log(`recalculateAllStats() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}




// APPLY DECAY
export const applyGeneralDecay = async (formatId, formatName, serverId, currentDate, nextDate) => {
    const allStats = await Stats.findAll({
        where: {
            formatId: formatId,
            serverId: serverId,
            elo: {[Op.gt]: 500}
        },
        attributes: ['id', 'formatId', 'serverId', 'playerName', 'playerId', 'elo']
    })

    // GENERAL MATCHES
    const generalMatchesInPeriod = await Match.findAll({
        where: {
            formatId: formatId,
            serverId: serverId,
            createdAt: {
                [Op.and]: [
                    {[Op.gte]: currentDate},
                    {[Op.lt]: nextDate}
                ]
            }
        },
        attributes: ['winnerId', 'loserId', 'formatId', 'serverId', 'createdAt']
    })

    const days = Math.ceil(((nextDate.getTime() - currentDate.getTime())) / (1000 * 60 * 60 * 24))
    let generalDecayRate = Math.pow(Math.E, (-1 * generalMatchesInPeriod.length) / (days * 20000))
    if (generalDecayRate < 0.999) generalDecayRate = 0.999

    const generalActivePlayerIds = []
    for (let i = 0; i < generalMatchesInPeriod.length; i++) {
        const match = generalMatchesInPeriod[i]
        if (!generalActivePlayerIds.includes(match.winnerId)) {
            generalActivePlayerIds.push(match.winnerId)
        }

        if (!generalActivePlayerIds.includes(match.loserId)) {
            generalActivePlayerIds.push(match.loserId)
        }
    }

    const generalGamesPlayed = {}
    for (let i = 0; i < generalMatchesInPeriod.length; i++) {
        const match = generalMatchesInPeriod[i]

        if (generalGamesPlayed[match.winnerId]) {
            generalGamesPlayed[match.winnerId] = generalGamesPlayed[match.winnerId] + 1
        } else {
            generalGamesPlayed[match.winnerId] = 1
        }

        if (generalGamesPlayed[match.loserId]) {
            generalGamesPlayed[match.loserId] = generalGamesPlayed[match.loserId] + 1
        } else {
            generalGamesPlayed[match.loserId] = 1
        }
    }

    for (let i = 0; i < allStats.length; i++) {
        const stats = allStats[i]
        const n = generalGamesPlayed[stats.playerId] || 0
        const standard = Math.floor(days / 7)
        const shields = n > standard ? standard : n
        console.log(`${stats.playerName}'s shields:`, shields, 'out of', standard)

        if (
            stats.elo > 500
        ) {
            stats.elo = stats.elo * Math.pow(generalDecayRate, standard - shields)
            if (stats.elo < 500) {
                stats.backupElo = stats.elo
                stats.elo = 500
            }
            await stats.save()
        }
    }

    console.log(`Applied General Decay Rate of ${generalDecayRate} on ${nextDate} to ${formatName} Format.`)
}


// APPLY SEASONAL DECAY
export const applySeasonalDecay = async (formatId, formatName, serverId, currentDate, nextDate) => {
    console.log('dates', currentDate, nextDate)
    const allStats = await Stats.findAll({
        where: {
            formatId: formatId,
            serverId: serverId,
            seasonalElo: {[Op.gt]: 500}
        },
        attributes: ['id', 'formatId', 'serverId', 'playerName', 'playerId', 'seasonalElo']
    })

    const seasonalMatchesInPeriod = await Match.findAll({
        where: {
            formatId: formatId,
            serverId: serverId,
            isSeasonal: true,
            createdAt: {
                [Op.and]: [
                    {[Op.gte]: currentDate},
                    {[Op.lt]: nextDate}
                ]
            }
        },
        attributes: ['winnerId', 'loserId', 'serverId', 'formatId', 'isSeasonal', 'createdAt']
    })

    const days = Math.ceil((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    console.log('days', days)
    console.log('seasonalMatchesInPeriod.length', seasonalMatchesInPeriod.length)
    let seasonalDecayRate = Math.pow(Math.E, (-1 * seasonalMatchesInPeriod.length) / (days * 600))
    if (seasonalDecayRate < 0.99) seasonalDecayRate = 0.99

    const seasonalGamesPlayed = {}
    for (let i = 0; i < seasonalMatchesInPeriod.length; i++) {
        const match = seasonalMatchesInPeriod[i]

        if (seasonalGamesPlayed[match.winnerId]) {
            seasonalGamesPlayed[match.winnerId] = seasonalGamesPlayed[match.winnerId] + 1
        } else {
            seasonalGamesPlayed[match.winnerId] = 1
        }

        if (seasonalGamesPlayed[match.loserId]) {
            seasonalGamesPlayed[match.loserId] = seasonalGamesPlayed[match.loserId] + 1
        } else {
            seasonalGamesPlayed[match.loserId] = 1
        }
    }

    console.log('seasonalGamesPlayed', seasonalGamesPlayed)

    const k = formatName === 'Edison' ? 1 : formatName === 'HAT' ? 0.5 : 1
    for (let i = 0; i < allStats.length; i++) {
        const stats = allStats[i]
        const n = seasonalGamesPlayed[stats.playerId] || 0
        const standard = Math.floor(k * days / 7)
        const shields = n > standard ? standard : n

        console.log(`${stats.playerName}'s shields:`, shields, 'out of', standard)

        if (
            stats.seasonalElo > 500
        ) {
            stats.seasonalElo = stats.seasonalElo * Math.pow(seasonalDecayRate, standard - shields)
            if (stats.seasonalElo < 500) {
                stats.backupSeasonalElo = stats.seasonalElo
                stats.seasonalElo = 500
            }
            await stats.save()
        }
    }

    console.log(`Applied Seasonal Decay Rate of ${seasonalDecayRate} on ${nextDate} to ${formatName} Format.`)
}



// MANAGE SUBSCRIBERS
export const manageSubscriptions = async (client) => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'manageSubscriptions',
        status: 'underway'
    })
    
    let a = 0
    let b = 0

    try {
        const discordPremiumRoleId = '1102002847056400464'
        const discordSupporterRoleId = '1102020060631011400'

        const stripePremiumRoleId = '1335316985097093290'
        const stripeSupporterRoleId = '1335317256921682053'
        const stripeSubscriberRoleId = '1336745321186988084'

        const guild = client.guilds.cache.get('414551319031054346')
        const membersMap = await guild.members.fetch()
        // const members = [...membersMap.values()]
        const programmer = await client.users.fetch('194147938786738176')
        const players = await Player.findAll()
        // UPDATE SUBSCRIPTIONS
        const {data} = await axios.get(`https://formatlibrary.com/xdcriptions`)
                        
        for (let i = 0; i < players.length; i++) {
            try {
                const player = players[i]
                const member = membersMap.get(player.discordId)
                const activeSubscription = await Subscription.findOne({
                    where: {
                        playerId: player.id,
                        status: 'active'
                    }
                })


                if (activeSubscription && activeSubscription.tier === 'Premium' && (!player.isSubscriber || player.subscriberTier !== 'Premium')) {
                    await player.update({ isSubscriber: true, subscriberTier: 'Premium' })
                    if (player.email !== activeSubscription.email) {
                        await player.update({ alternateEmail: activeSubscription.email })
                    }
                    await programmer.send({ content: `Welcome ${player.name} to the Stripe Premium Tier!`})
                    console.log('!!member found line 1080', !!member)
                    member?.roles.add(stripePremiumRoleId)
                    member?.roles.add(stripeSubscriberRoleId)
                    member?.roles.remove(stripeSupporterRoleId)
                    a++
                } else if (activeSubscription && activeSubscription.tier === 'Supporter' && (!player.isSubscriber || player.subscriberTier !== 'Supporter')) {
                    await player.update({ isSubscriber: true, subscriberTier: 'Supporter' })
                    if (player.email !== activeSubscription.email) {
                        await player.update({ alternateEmail: activeSubscription.email })
                    }

                    await programmer.send({ content: `Welcome ${player.name} to the Stripe Supporter Tier!`})
                    console.log('!!member found line 1092', !!member)
                    member?.roles.add(stripeSupporterRoleId)
                    member?.roles.add(stripeSubscriberRoleId)
                    member?.roles.remove(stripePremiumRoleId)
                    a++
                } else if (member?._roles.includes(discordPremiumRoleId) && (!player.isSubscriber || player.subscriberTier !== 'Premium')) {
                    await programmer.send({ content: `Welcome ${player.name} to the Premium Tier!`})
                    console.log(`Welcome ${player.name} to the Premium Tier!`)
                    await player.update({ isSubscriber: true, subscriberTier: 'Premium' })
                    a++
                } else if (member?._roles.includes(discordSupporterRoleId) && (!player.isSubscriber || player.subscriberTier !== 'Supporter')) {
                    await programmer.send({ content: `Welcome ${player.name} to the Supporter Tier!`})
                    console.log(`Welcome ${player.name} to the Supporter Tier!`)
                    await player.update({ isSubscriber: true, subscriberTier: 'Supporter' })
                    a++
                } else if (!activeSubscription && player.discordId !== programmer.id && player.isSubscriber && !member?._roles.includes(discordSupporterRoleId) && !member?._roles.includes(discordPremiumRoleId)) {
                    await programmer.send({ content: `${player.name} is no longer a Subscriber (${player.subscriberTier}).`})
                    console.log(`${player.name} is no longer a Subscriber (${player.subscriberTier}).`)
                    await player.update({ isSubscriber: false, subscriberTier: null })
                    member?.roles.remove(stripeSupporterRoleId)
                    member?.roles.remove(stripePremiumRoleId)
                    member?.roles.remove(stripeSubscriberRoleId)
                    b++
                } 
            } catch (err) {
                console.log(err)
            }
        }
    } catch (err) {
        console.log(err)
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    console.log(`added ${a} new subscriptions and removed ${b} old subscriptions`)
    return console.log(`manageSubscriptions() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)

}

// ASSIGN SEASONAL LADDER ROLES
export const assignSeasonalLadderRoles = async (client) => {
    const guild = client.guilds.cache.get('414551319031054346')
    const edisonLadderPlayersRoleId = '1333089910563016704'
    const hatLadderPlayersRoleId = '1333090132991148072'
    const goatLadderPlayersRoleId = '1333090182819483831'
    const tenguLadderPlayersRoleId = '1333090222262452284'

    const edisonLadderPlayers = await Stats.findAll({
        where: {
            formatName: 'Edison',
            seasonalGames: {[Op.gt]: 0}
        },
        include: Player
    })

    for (let i = 0; i < edisonLadderPlayers.length; i++) {
        try {
            const {player} = edisonLadderPlayers[i]
            const member = await guild.members.fetch(player?.discordId)
            member.roles.add(edisonLadderPlayersRoleId)
        } catch (err) {
            console.log(err)
        }
    }

    const hatLadderPlayers = await Stats.findAll({
        where: {
            formatName: 'HAT',
            seasonalGames: {[Op.gt]: 0}
        },
        include: Player
    })

    for (let i = 0; i < hatLadderPlayers.length; i++) {
        try {
            const {player} = hatLadderPlayers[i]
            const member = await guild.members.fetch(player?.discordId)
            member.roles.add(hatLadderPlayersRoleId)
        } catch (err) {
            console.log(err)
        }
    }

    const goatLadderPlayers = await Stats.findAll({
        where: {
            formatName: 'Goat',
            seasonalGames: {[Op.gt]: 0}
        },
        include: Player
    })

    for (let i = 0; i < goatLadderPlayers.length; i++) {
        try {
            const {player} = goatLadderPlayers[i]
            const member = await guild.members.fetch(player?.discordId)
            member.roles.add(goatLadderPlayersRoleId)
        } catch (err) {
            console.log(err)
        }
    }

    const tenguLadderPlayers = await Stats.findAll({
        where: {
            formatName: 'Tengu',
            seasonalGames: {[Op.gt]: 0}
        },
        include: Player
    })

    for (let i = 0; i < tenguLadderPlayers.length; i++) {
        try {
            const {player} = tenguLadderPlayers[i]
            const member = await guild.members.fetch(player?.discordId)
            member.roles.add(tenguLadderPlayersRoleId)
        } catch (err) {
            console.log(err)
        }
    }
}

// ASSIGN TOURNAMENT PARTICIPANT ROLES
export const assignTournamentRoles = async (client) => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'assignTournamentRoles',
        status: 'underway'
    })
    
    const servers = await Server.findAll({
        where: {
            tournamentRoleId: {[Op.not]: null}
        }
    })

    for (let s = 0; s < servers.length; s++) {
        try {
            let b = 0
            const server = servers[s]
            const roleId = server.tournamentRoleId
            if (!roleId) continue
            const guild = client.guilds.cache.get(server.id)
            const membersMap = await guild.members.fetch()
            const members = [...membersMap.values()]

            for (let i = 0; i < members.length; i++) {
                const member = members[i]
                if (member._roles.includes(roleId)) continue

                const count = await Entry.count({
                    where: {
                        isActive: true,
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


    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    return console.log(`assignTournamentRoles() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}

// UPDATE DECK TYPES
export const updateDeckTypes = async () => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'updateDeckTypes',
        status: 'underway'
    })
    let b = 0

    // UPDATE USER DECKS LABELED AS "OTHER"
    const decks = await Deck.findAll({
        where: {
            deckTypeName: 'Other',
            suggestedDeckTypeName: {[Op.not]: null }
        }
    })

    for (let i = 0; i < decks.length; i++) {
        const deck = decks[i]
        const deckType = await DeckType.findOne({
            where: {
                cleanName: {[Op.iLike]: deck.suggestedDeckTypeName.replaceAll(' ', '_').replaceAll('-', '_') }
            }
        })

        if (deckType) {
            await deck.update({
                deckTypeName: deckType.name,
                deckTypeId: deckType.id,
                suggestedDeckTypeName: null
            })

            b++
        } else {
            continue
        }
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    console.log(`updated ${b} decks with suggested deck-types`)
    return console.log(`updateDeckTypes() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}

// UPDATE MARKET PRICES
export const updateMarketPrices = async () => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'updateMarketPrices',
        status: 'underway'
    })
    let b = 0 
    let c = 0

    const ids = [...await Print.findAll({
        where: {
            tcgPlayerProductId: {[Op.not]: null}
        },
        attributes: ['id', 'cardName', 'tcgPlayerProductId'],
        order: [['cardName', 'ASC']]
    })].map((p) => p.tcgPlayerProductId)

    for (let i = 0; i < ids.length; i += 100) {
        try {
            const endpoint = `https://api.tcgplayer.com/pricing/product/${ids.slice(i, i + 100).join(',')}`
            const { data } = await axios.get(endpoint, {
                headers: {
                    "Accept": "application/json",
                    "Authorization": `bearer ${tcgPlayer.access_token}`
                }
            })
        
            for (let i = 0; i < data?.results?.length; i++) {
                const result = data.results[i]
                if (!result?.marketPrice) continue

                const print = await Print.findOne({ where: { tcgPlayerProductId: result.productId }})
        
                const priceType = result.subTypeName === 'Unlimited' ? 'unlimitedPrice' :
                    result.subTypeName === '1st Edition' ? 'firstEditionPrice' :
                    result.subTypeName === 'Limited' ? 'limitedPrice' :
                    null
        
                await print.update({ [priceType]: result.marketPrice })
                await Price.create({
                    usd: result.marketPrice,
                    edition: result.subTypeName,
                    source: 'TCGplayer',
                    printId: print.id
                })

                b++
                console.log(`saved market price for: ${print.rarity} ${print.cardCode} - ${print.cardName} - ${result.subTypeName} - $${result.marketPrice}`)            
            }
        } catch (err) {
            console.log(err)
        }
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    console.log(`created ${b} new prices and checked ${c} other(s)`)
    return console.log(`updateMarketPrices() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}

// UPDATE MIN MED MAX RARITIES
export const updateMinMedMaxRarities = async () => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'updateMinMedMaxRarities',
        status: 'underway'
    })
    let b = 0 
    let e = 0

    const cards = await Card.findAll({order: [['name', 'ASC']]})

    try {
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i]
            const prints = await Print.findAll({ where: { cardId: card.id, marketPrice: {[Op.not]: null} }, order: [['marketPrice', 'ASC']] })
            for (let j = 0; j < prints.length; j++) {
                const print = prints[j]
                await print.update({
                    isMinRarity: false,
                    isMedianRarity: false,
                    isMaxRarity: false
                })
            }
    
            if (prints.length >= 2) {
                const minRarityPrint = await Print.findOne({
                    where: {
                        cardId: card.id,
                        marketPrice: {[Op.not]: null}
                    },
                    order: [['marketPrice', 'ASC']]
                })
                await minRarityPrint.update({ isMinRarity: true })
            }
    
            if (prints.length >= 3) {
                const medianRarityPrint = prints[Math.floor(prints.length / 2)]
                await medianRarityPrint.update({ isMedianRarity: true })
            }
    
            if (prints.length >= 1) {
                const maxRarityPrint = await Print.findOne({
                    where: {
                        cardId: card.id, 
                        marketPrice: {[Op.not]: null}
                    },
                    order: [['marketPrice', 'DESC']]
                })
                await maxRarityPrint.update({ isMaxRarity: true })
            }
            b++
            console.log(`updated ${card.name}`)
        }
    } catch (err) {
        console.log(err)
        e++
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    console.log(`updated ${b} max/median/min prints and encountered ${e} errors`)
    return console.log(`updateMinMedMaxRarities() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}


// PURGE DUPLICATE PRICES
export const purgeDuplicatePrices = async () => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'purgeDuplicatePrices',
        status: 'underway'
    })
    let b = 0 
    let c = 0

    const prints = await Print.findAll({ 
        where: { 
            tcgPlayerProductId: {[Op.not]: null }
        },
        order: [['cardName', 'ASC']]
    })

    for (let i = 0; i < prints.length; i++) {
        const print = prints[i]
        console.log(`print.cardName`, print.cardName, `number ${i} of ${prints.length}`)
        const firstPrices = await Price.findAll({
            where: {
                printId: print.id,
                edition: '1st Edition'
            },
            order: [['createdAt', 'ASC']]
        })

        for (let j = 1; j < firstPrices.length; j++) {
            const previousDay = firstPrices[j-1].createdAt
            const currentDay = firstPrices[j].createdAt
            if ( 
                previousDay.getFullYear() === currentDay.getFullYear() &&
                previousDay.getMonth() === currentDay.getMonth() &&
                previousDay.getDate() === currentDay.getDate()
            ) {
                console.log(`duplicate prices: ${previousDay} and ${currentDay} (hours diff: ${((currentDay - previousDay) / (1000 * 60 * 60)).toFixed(2)})`)
                await firstPrices[j].destroy()
                j++
                b++
            } else {
                c++
            }
        }

        const unlimitedPrices = await Price.findAll({
            where: {
                printId: print.id,
                edition: 'Unlimited'
            },
            order: [['createdAt', 'ASC']]
        })

        for (let j = 1; j < unlimitedPrices.length; j++) {
            const previousDay = unlimitedPrices[j-1].createdAt
            const currentDay = unlimitedPrices[j].createdAt
            if ( 
                previousDay.getFullYear() === currentDay.getFullYear() &&
                previousDay.getMonth() === currentDay.getMonth() &&
                previousDay.getDate() === currentDay.getDate()
            ) {
                console.log(`duplicate prices: ${previousDay} and ${currentDay} (hours diff: ${((currentDay - previousDay) / (1000 * 60 * 60)).toFixed(2)})`)
                await unlimitedPrices[j].destroy()
                j++
                b++
            } else {
                c++
            }
        }

        const limitedPrices = await Price.findAll({
            where: {
                printId: print.id,
                edition: 'Limited'
            },
            order: [['createdAt', 'ASC']]
        })

        for (let j = 1; j < limitedPrices.length; j++) {
            const previousDay = limitedPrices[j-1].createdAt
            const currentDay = limitedPrices[j].createdAt
            if ( 
                previousDay.getFullYear() === currentDay.getFullYear() &&
                previousDay.getMonth() === currentDay.getMonth() &&
                previousDay.getDate() === currentDay.getDate()
            ) {
                console.log(`duplicate prices: ${previousDay} and ${currentDay} (hours diff: ${((currentDay - previousDay) / (1000 * 60 * 60)).toFixed(2)})`)
                await limitedPrices[j].destroy()
                j++
                b++
            } else {
                c++
            }
        }

        const normalPrices = await Price.findAll({
            where: {
                printId: print.id,
                edition: 'Normal'
            },
            order: [['createdAt', 'ASC']]
        })

        for (let j = 1; j < normalPrices.length; j++) {
            const previousDay = normalPrices[j-1].createdAt
            const currentDay = normalPrices[j].createdAt
            if ( 
                previousDay.getFullYear() === currentDay.getFullYear() &&
                previousDay.getMonth() === currentDay.getMonth() &&
                previousDay.getDate() === currentDay.getDate()
            ) {
                console.log(`duplicate prices: ${previousDay} and ${currentDay} (hours diff: ${((currentDay - previousDay) / (1000 * 60 * 60)).toFixed(2)})`)
                await normalPrices[j].destroy()
                j++
                b++
            } else {
                c++
            }
        }
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    console.log(`purged ${b} prices and checked ${c} other(s)`)
    return console.log(`purgeDuplicatePrices() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
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
                    if (isSpeedDuel && !card.isSpeedLegal) {
                        await card.update({ 
                            isSpeedLegal: true,
                            speedDate: set.releaseDate
                        })
                    }
    
                    print = await Print.create({
                        cardName: card.name,
                        cardCode: result.extendedData[0].value,
                        setName: set.name,
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

    return console.log(`created ${b} new prints for ${set.name}, couldn't find ${c} cards, encountered ${e} errors`)
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
                        {name: {[Op.iLike]: r.name}},
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

// CREATE ARTWORK
export const findOrCreateArtwork = async (artworkId, cardName, cardId, isOriginal) => {
    const [artwork] = await Artwork.findOrCreate({
        where: {
            artworkId,
            cardName,
            cardId,
            isOriginal
        }
    })

    return artwork
}


// UPLOAD CARD IMAGES
export const uploadCardImages = async (s3, artworkId) => {
    const fullSuccess = await uploadFullCardImage(s3, artworkId)
    const mediumSuccess = await uploadMediumCardImage(s3, artworkId)
    const croppedSuccess = await uploadCroppedImage(s3, artworkId)
    return [fullSuccess, mediumSuccess, croppedSuccess]
}


// DOWNLOAD CROPPED IMAGE AND UPLOAD TO ARTWORK FOLDER
export const uploadCroppedImage = async (s3, artworkId) => {
    try {
        const {data: croppedCardImage} = await axios({
            method: 'GET',
            url: `https://images.ygoprodeck.com/images/cards_cropped/${artworkId}.jpg`,
            responseType: 'stream'
        })
        
        const { Location: artworkUri} = await new Upload({
            client: s3,
            params: { Bucket: 'formatlibrary', Key: `images/artworks/${artworkId}.jpg`, Body: croppedCardImage, ContentType: `image/jpg` },
        }).done()
        console.log('artwork image uri', artworkUri)
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

// DOWNLOAD CARD IMAGE, RESIZE, AND UPLOAD TO MEDIUM CARDS FOLDER
export const uploadMediumCardImage = async (s3, artworkId) => {
   try {
        const {data: fullCardImage} = await axios({
            method: 'GET',
            url: `https://images.ygoprodeck.com/images/cards/${artworkId}.jpg`,
            responseType: 'stream'
        })

        const mediumCardImage = fullCardImage.pipe(sharp().resize(144, 210).jpeg())
        const { Location: imageUri} = await new Upload({
            client: s3,
            params: { Bucket: 'formatlibrary', Key: `images/medium_cards/${artworkId}.jpg`, Body: mediumCardImage, ContentType: `image/jpg` },
        }).done()
        console.log('medium card image uri', imageUri)
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

// DOWNLOAD CARD IMAGE AND UPLOAD TO CARDS FOLDER
export const uploadFullCardImage = async (s3, artworkId, cardName, cardId) => {
    const {data: fullCardImage} = await axios({
        method: 'GET',
        url: `https://images.ygoprodeck.com/images/cards/${artworkId}.jpg`,
        responseType: 'stream'
    })

    try {
        const { Location: imageUri} = await new Upload({
            client: s3,
            params: { Bucket: 'formatlibrary', Key: `images/cards/${artworkId}.jpg`, Body: fullCardImage, ContentType: `image/jpg` },
        }).done()
        console.log('card image uri', imageUri)
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}
 
// DOWNLOAD ALT ARTWORKS
export const downloadAltArtworks = async () => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'downloadAltArtworks',
        status: 'underway'
    })
    let b = 0
    let c = 0
    let e = 0

    const s3 = new S3({
        region: config.s3.region,
        credentials: {
            accessKeyId: config.s3.credentials.accessKeyId,
            secretAccessKey: config.s3.credentials.secretAccessKey
        },
    })

    const { data } = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes')

    for (let i = 0; i < data.data.length; i++) {
        const datum = data.data[i]
        const id = datum.id.toString()
        const name = datum.name
        const images = datum.card_images

        try {
            const card = await Card.findOne({
                where: {
                    [Op.or]: [
                        {ypdId: id},
                        {name: name}
                    ]
                }
            })

            if (!card) {
                console.log(`could not find card: ${name} (${id})`)
                continue
            }

            for (let i = 0; i < images.length; i++) {
                const image = images[i]
                const artworkId = image.id.toString()

                const count = await Artwork.count({
                    where: {
                        artworkId: artworkId
                    }
                })

                if (count) {
                    console.log(`artwork is already saved, id: ${image.id}`)
                } else if (artworkId === card.artworkId) {
                    await Artwork.findOrCreate({
                        cardName: card.name,
                        cardId: card.id,
                        artworkId: card.artworkId,
                        isOriginal: true
                    })

                    console.log(`saved new original artwork data, id: ${image.id}`)
                    b++
                } else {
                    try {
                        const {data: fullCardImage} = await axios({
                            method: 'GET',
                            url: image.image_url,
                            responseType: 'stream'
                        })
                    
                        const { Location: imageUri} = await new Upload({
                            client: s3,
                            params: { Bucket: 'formatlibrary', Key: `images/cards/${artworkId}.jpg`, Body: fullCardImage, ContentType: `image/jpg` },
                        }).done()
                        console.log('imageUri', imageUri)

                        const {data: croppedCardImage} = await axios({
                            method: 'GET',
                            url: image.image_url_cropped,
                            responseType: 'stream'
                        })
                    
                        const { Location: artworkUri} = await new Upload({
                            client: s3,
                            params: { Bucket: 'formatlibrary', Key: `images/artworks/${artworkId}.jpg`, Body: croppedCardImage, ContentType: `image/jpg` },
                        }).done()
                        console.log('artworkUri', artworkUri)

                        if (imageUri && artworkUri) {
                            await Artwork.findOrCreate({
                                cardName: card.name,
                                cardId: card.id,
                                artworkId: artworkId
                            })

                            console.log(`saved new alternate artwork data, artworkId: ${artworkId}`)
                            c++
                        }
                    } catch (err) {
                        console.log(err)
                    }  
                }
            }
        } catch (err) {
            console.log(err)
            e++
        }
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    console.log(`Saved ${b} original artworks, ${c} new artworks, encountered ${e} errors`)
    return console.log(`downloadAltArtworks() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}


// DOWNLOAD ORIGINAL ARTWORKS
export const downloadOriginalArtworks = async () => {
    let b = 0
    let e = 0

    // const s3 = new S3({
    //     region: config.s3.region,
    //     credentials: {
    //         accessKeyId: config.s3.credentials.accessKeyId,
    //         secretAccessKey: config.s3.credentials.secretAccessKey
    //     },
    // })
    
    const artworks = await Artwork.findAll({
        where: {
            isOriginal: true
        },
        include: Card
    })


    for (let i = 0; i < artworks.length; i++) {
        const artwork = artworks[i]
        await artwork.card.update({ konamiCode: artwork.artworkId })
        b++

        // try {
        //     const {data: fullCardImage} = await axios({
        //         method: 'GET',
        //         url: `https://images.ygoprodeck.com/images/cards/${artwork.card.artworkId}.jpg`,
        //         responseType: 'stream'
        //     })
        
        //     const { Location: imageUri} = await new Upload({
        //         client: s3,
        //         params: { Bucket: 'formatlibrary', Key: `images/cards/${artwork.card.artworkId}.jpg`, Body: fullCardImage, ContentType: `image/jpg` },
        //     }).done()
        //     console.log('imageUri', imageUri)

        //     const {data: croppedCardImage} = await axios({
        //         method: 'GET',
        //         url: `https://images.ygoprodeck.com/images/cards_cropped/${artwork.card.artworkId}.jpg`,
        //         responseType: 'stream'
        //     })
        
        //     const { Location: artworkUri} = await new Upload({
        //         client: s3,
        //         params: { Bucket: 'formatlibrary', Key: `images/artworks/${artwork.card.artworkId}.jpg`, Body: croppedCardImage, ContentType: `image/jpg` },
        //     }).done()
        //     console.log('artworkUri', artworkUri)

        //     b++
        // } catch (err) {
        //     console.log(err)
        // }
    }

    return console.log(`Saved ${b} original artworks, encountered ${e} errors`)
}

// DOWNLOAD MISSING CARD IMAGES
export const downloadMissingCardImages = async () => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'manageSubscriptions',
        status: 'underway'
    })
    const cards = await Card.findAll({ include: Artwork })
    let a = 0
    let b = 0
    let c = 0
    let d = 0
    let e = 0

    const s3 = new S3({
        region: config.s3.region,
        credentials: {
            accessKeyId: config.s3.credentials.accessKeyId,
            secretAccessKey: config.s3.credentials.secretAccessKey
        },
    })
    
    for (let i = 0; i < cards.length; i++) {
        try {
            const card = cards[i]
            const artworks = card.artworks?.map((artwork) => artwork.dataValues)
    
            if (!artworks || !artworks.length) {
                const artwork = await findOrCreateArtwork(card.ypdId, card.name, card.id, true)
                artworks.push(artwork)
            }
    
            for (let j = 0; j < artworks.length; j++) {
                const artworkId = artworks[j].artworkId
                if (!await s3FileExists(`images/cards/${artworkId}.jpg`)) {
                    if (await uploadFullCardImage(s3, artworkId)) {
                        a++
                    } else {
                        d++
                    }
                }
    
                if (!await s3FileExists(`images/medium_cards/${artworkId}.jpg`)) {
                   if (await uploadMediumCardImage(s3, artworkId)) {
                        b++
                    } else {
                        d++
                    }
                }
    
                if (!await s3FileExists(`images/artworks/${artworkId}.jpg`)) {
                    if (await uploadCroppedImage(s3, artworkId)) {
                        c++
                    } else {
                        d++
                    }
                }
            }
        } catch (err) {
            console.log(err)
            e++
        }
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })
    console.log(`Saved ${a} full sized card images, ${b} medium sized card images, ${c} cropped artwork images, encountered ${d} download/upload errors and ${e} loop errors`)
    return console.log(`downloadAltArtworks() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}

// DOWNLOAD CARD ARTWORK
export const downloadCardArtworks = async () => {
    const cards = await Card.findAll()

    for (let i = 0; i < cards.length; i++) {
        try {
            const {artworkId: id} = cards[i]
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
                },
            })
        
            const { Location: uri} = await new Upload({
                client: s3,
                params: { Bucket: 'formatlibrary', Key: `images/artworks/${id}.jpg`, Body: data, ContentType: `image/jpg` },
            }).done()
            console.log('uri', uri)
        } catch (err) {
            console.log(err)
        }
    }
}

// DOWNLOAD NEW CARDS
export const downloadNewCards = async () => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'downloadNewCards',
        status: 'underway'
    })

    const s3 = new S3({
        region: config.s3.region,
        credentials: {
            accessKeyId: config.s3.credentials.accessKeyId,
            secretAccessKey: config.s3.credentials.secretAccessKey
        },
    })

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
        const images = datum.card_images

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

            const isTcgLegal = (
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

            const isOcgLegal = (
                category === 'Skill' ||
                category === 'Token'
            ) ? false : !!datum.misc_info[0]?.ocg_date

            const isSpeedLegal = datum.misc_info[0]?.formats?.includes('Speed Duel')
            const tcgDate = category !== 'Skill' ? datum.misc_info[0]?.tcg_date || null : null
            const ocgDate = category !== 'Skill' ? datum.misc_info[0]?.ocg_date || null : null

            if (!card) {
                await Card.create({
                    name: name,
                    cleanName: cleanName,
                    konamiCode: konamiCode,
                    ypdId: id,
                    isTcgLegal: isTcgLegal,
                    isOcgLegal: isOcgLegal,
                    isSpeedLegal: isSpeedLegal,
                    category: category,
                    icon: category !== 'Monster' ? datum.race : null,
                    isNormal: category === 'Monster' && type.includes('Normal'),
                    isEffect: category === 'Monster' &&
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
                    isFusion: category === 'Monster' && type.includes('Fusion'),
                    isRitual: category === 'Monster' && type.includes('Ritual'),
                    isSynchro: category === 'Monster' && type.includes('Synchro'),
                    isXyz: category === 'Monster' && type.includes('Xyz'),
                    isPendulum: category === 'Monster' && type.includes('Pendulum'),
                    isLink: category === 'Monster' && type.includes('Link'),
                    isFlip: category === 'Monster' && type.includes('Flip'),
                    isGemini: category === 'Monster' && type.includes('Gemini'),
                    isSpirit: category === 'Monster' && type.includes('Spirit'),
                    isToon: category === 'Monster' && type.includes('Toon'),
                    isTuner: category === 'Monster' && type.includes('Tuner'),
                    isUnion: category === 'Monster' && type.includes('Union'),
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
                    isExtraDeck: type.includes('Fusion') || type.includes('Synchro') || type.includes('Xyz') || type.includes('Link'),
                    color: getColor(datum.type),
                    sortPriority: getSortPriority(datum.type)
                })

                b++
                console.log(`New card: ${name} (TCG Date: ${datum.misc_info[0]?.tcg_date}, OCG Date: ${datum.misc_info[0]?.ocg_date})`)
                
                for (let i = 0; i < images.length; i++) {
                    const cardImageId = images[i].id
                    const isOriginal = i === 0
                    const artwork = await findOrCreateArtwork(cardImageId.toString(), name, card.id, isOriginal)
                    
                    if (isOriginal && artwork?.artworkId) {
                        await card.update({ artworkId: artwork?.artworkId })
                    }

                    const successes = await uploadCardImages(s3, cardImageId)
                    if (successes[0]) console.log(`Image saved (${name})`)
                }
            } else if (card && (card.name !== name || card.ypdId !== id || card.cleanName !== cleanName || !card.artworkId || (checkTimeBetweenDates(new Date(), new Date(tcgDate), 7) && card.ypdId !== card.artworkId))) {
                c++

                for (let i = 0; i < images.length; i++) {
                    const cardImageId = images[i].id
                    const isOriginal = i === 0
                    const artwork = await findOrCreateArtwork(cardImageId.toString(), name, card.id, isOriginal)
                    
                    if (isOriginal && artwork?.artworkId) {
                        await card.update({ artworkId: artwork?.artworkId })
                    }

                    const successes = await uploadCardImages(s3, cardImageId)
                    if (successes[0]) console.log(`Image saved (${name})`)
                }

                console.log(`New name and/or ID: ${card.name} (${card.ypdId}) is now: ${name} (${id})`)

                await card.update({
                    name: name,
                    cleanName: cleanName,
                    konamiCode: konamiCode,
                    ypdId: id,
                    description: datum.desc,
                    isTcgLegal: isTcgLegal,
                    isOcgLegal: isOcgLegal,
                    tcgDate: tcgDate,
                    ocgDate: ocgDate
                })
            } else if (card && tcgDate && (!card.tcgDate || !card.isTcgLegal || checkTimeBetweenDates(new Date(), new Date(tcgDate), 7))) {
                console.log(`New TCG Card: ${card.name}`)
                
                for (let i = 0; i < images.length; i++) {
                    const cardImageId = images[i].id
                    const isOriginal = i === 0
                    const artwork = await findOrCreateArtwork(cardImageId.toString(), name, card.id, isOriginal)
                    
                    if (isOriginal && artwork?.artworkId) {
                        await card.update({ artworkId: artwork?.artworkId })
                    }

                    const successes = await uploadCardImages(s3, cardImageId)
                    if (successes[0]) console.log(`Image saved (${name})`)
                }

                await card.update({
                    name: name,
                    cleanName: cleanName,
                    description: datum.desc,
                    tcgDate: tcgDate,
                    isTcgLegal: true
                })

                t++
            } else if (card && ocgDate && (!card.ocgDate || !card.isOcgLegal || checkTimeBetweenDates(new Date(), new Date(ocgDate), 7))) {
                await card.update({
                    ocgDate: ocgDate,
                    isOcgLegal: true  
                })

                o++
                console.log(`New OCG Card: ${card.name}`)
            } else if (card && (!card.isSpeedLegal || !card.speedDate) && isSpeedLegal) {
                const print = await Print.findOne({
                    where: {
                        cardId: card.id,
                        setName: {[Op.substring]: 'Speed Duel'}
                    },
                    include: Set,
                    order: [[Set, 'releaseDate', 'DESC']],
                })

                const speedDate = print?.set?.legalDate || print?.set?.releaseDate

                await card.update({
                    speedDate: speedDate,
                    isSpeedLegal: true
                })

                p++
                console.log(`New Speed Duel Card: ${card.name}`)
            }
        } catch (err) {
            e++ 
            console.log(err)
        }
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    console.log(`Found ${b} new cards, ${c} new names, ${t} new TCG cards, ${o} new OCG cards, ${p} new Speed Duel cards, encountered ${e} errors`)
    return console.log(`downloadNewCards() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}


// PURGE LOCALS AND INTERNAL DECKS
export const purgeLocalsAndInternalDecks = async () => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'purgeLocalsAndInternalDecks',
        status: 'underway'
    })
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

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    console.log(`Purged ${b} locals and internal tournament decks, encountered ${e} errors`)
    return console.log(`purgeLocalsAndInternalDecks() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}


// PURGE BETA CARDS
export const purgeBetaCards = async () => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'purgeBetaCards',
        status: 'underway'
    })
    let b = 0
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

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    console.log(`Purged ${b} beta cards, encountered ${e} errors`)
    return console.log(`purgeBetaCards() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}


// UPDATE SETS
export const updateSets = async () => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'updateSets',
        status: 'underway'
    })
    let b = 0
    let c = 0
    const { data } = await axios.get('https://db.ygoprodeck.com/api/v7/cardsets.php')
    for (let i = 0; i < data.length; i++) {
        try {
            const datum = data[i]
            if (!datum.set_name.includes('Shonen Jump') && !datum.set_name.includes('(POR)') && datum.tcg_date) {
                let set = await Set.findOne({
                    where: {
                        name: {[Op.iLike]: datum.set_name }
                    }
                })

                if (set && !set.tcgPlayerGroupId) {
                    const tcgPlayerGroupId = await getNewGroupId(set.id)
                    if (!tcgPlayerGroupId) {
                        console.log(`no tcgPlayerGroupId for ${set.name}`)
                        continue
                    } else {
                        console.log(`updating group Id for ${set.name} from ${set.tcgPlayerGroupId} to ${tcgPlayerGroupId}`)
                        set.tcgPlayerGroupId = tcgPlayerGroupId
                        await set.save()
                    }
                }

                if (set && set.tcgPlayerGroupId) {
                    if (set.size !== datum.num_of_cards) {
                        console.log(`updating size of ${set.name} from ${set.size} to ${datum.num_of_cards}`)
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
                        name: datum.set_name,
                        setCode: datum.set_code,
                        size: datum.num_of_cards,
                        releaseDate: datum.tcg_date
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

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    console.log(`created ${b} new sets and updated ${c} other(s)`)
    return console.log(`updateSets() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}

// DRAW SET BANNER
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
        const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`) 
        context.drawImage(image, card_width * i, 0, card_width, card_height)
    }

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
        params: { Bucket: 'formatlibrary', Key: `images/sets/slideshows/${set.setCode}.png`, Body: buffer, ContentType: `image/png` },
    }).done()
    console.log('uri', uri)
}

// UPDATE SERVERS
export const updateServers = async (client) => {
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'updateServers',
        status: 'underway'
    })
    const guilds = [...client.guilds.cache.values()]

    for (let i = 0; i < guilds.length; i++) {
        const guild = guilds[i]
        const count = await Server.count({
            where: {
                id: guild.id
            }
        }) 

        if (!count) {
            try {
                console.log('Creating server:', guild.name)
                await Server.create({ id: guild.id, name: guild.name })
            } catch (err) {
                console.log(err)
            }
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

            if (server.discordIconId !== guild.icon) {
                console.log(`updating server discord icon id from ${server.discordIconId} => ${guild.icon}`)
                server.discordIconId = guild.icon
                await server.save()
            }

            const owner = await Player.findOne({ where: { discordId: guild.ownerId }})

            if (owner && server.ownerId !== owner.id) {
                console.log(`updating server owner from ${server.ownerId} => ${owner.id}`)
                server.ownerId = owner.id
                await server.save()
            }

            const count = await Community.count({ where: { serverId: server.id } })
            if (server.access === 'partner' && !count) {
                await Community.create({
                    name: server.communityName || server.name,
                    serverName: server.name,
                    serverId: server.id,
                    logo: server.logoName
                })
            }

            if (server.access !== 'free' && !server.logoName) {
                if (await s3FileExists(`images/logos/${server.name.replaceAll('+', '%2B')}.png`)) {
                    await server.update({ logoName: server.name })
                } 
            }
        } catch (err) {
            console.log(err)
        }
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    return console.log(`updateServers() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}


// UPDATE DECKS
export const updateDecks = async () => {
    console.log('updateDecks()')
    const start = Date.now()
    const chronRecord = await ChronRecord.create({
        function: 'updateDecks',
        status: 'underway'
    })
    let b = 0
    let e = 0
    const decks = await Deck.findAll({ include: DeckType })
    for (let i = 0; i < decks.length; i++) {
        try {
            const deck = decks[i]
            let updated
            if (deck.deckType?.category && deck.category !== deck.deckType?.category) {
                console.log(`updating deck ${deck.id} category:`, deck.category, '->', deck.deckType?.category)
                await deck.update({ category: deck.deckType.category })
                updated = true
            }

            if (updated) b++
        } catch (err) {
            e++
            console.log(err)
        }
    }

    await chronRecord.update({
        status: 'complete',
        runTime: ((Date.now() - start)/(60 * 1000)).toFixed(5)
    })

    console.log(`updated ${b} decks, encountered ${e} errors`)
    return console.log(`updateDecks() runtime: ${((Date.now() - start)/(60 * 1000)).toFixed(5)} min`)
}
