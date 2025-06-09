
//RATED FUNCTIONS

//MODULE IMPORTS
import axios from 'axios'
import { Op } from 'sequelize'
import { Deck, Format, Match, Pairing, Player, Pool, Stats, Server } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { getIssues } from './deck'
import { drawDeck } from './utility'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { client } from '../client'
import { getForgedIssues } from './forged'
import { time } from 'console'

// GET RATED CONFIRMATION
export const getRatedConfirmation = async (player, opponent, format, guild) => {
    console.log('getRatedConfirmation()')
    if (!guild) guild = client.guilds.cache.get('414551319031054346')
    const member = await guild.members.fetch(player.discordId)
    if (!member) {
        console.log(`player ${player.name} is no longer a member of a supporting server, so they cannot play rated`)
        return
    }

    const yourPool = await Pool.findOne({
        where: {
            playerId: player.id,
            formatId: format.id
        }
    })

    const opponentsPool = await Pool.findOne({
        where: {
            playerId: opponent.id,
            formatId: format.id
        }
    })

    await yourPool.update({ status: 'confirming' })
 
    const row = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
            .setCustomId(`YY-${yourPool.id}-${opponentsPool.id}-${guild.id}`)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Primary)
        )

        .addComponents(new ButtonBuilder()
            .setCustomId(`NY-${yourPool.id}-${opponentsPool.id}-${guild.id}`)
            .setLabel('No')
            .setStyle(ButtonStyle.Primary)
        )

    const message = await member.user?.send({ content: `I've found a Rated ${format.name} Format ${format.emoji} opponent for you. Do you still wish to play?`, components: [row] })
    function delay(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time, async () => {
                const unconfirmed = await Pool.count({
                    where: {
                        id: yourPool.id,
                        status: 'confirming'
                    }
                })
        
                if (unconfirmed) {
                    await message.edit({ components: [] }).catch((err) => console.log(err))
                    await yourPool.destroy()
                    console.log(`removed ${yourPool.playerName} from the ${yourPool.formatName} rated pool`)
                    await message.channel.send({ content: `Sorry, time's up! I've removed you from the ${format.name} Format ${format.emoji} rated pool.`})
                    return false
                } else {
                    return true
                }
            }, time);
        });
      }

      async function myFunction() {
        console.log("Before delay")
        await delay(2 * 60 * 1000)
        console.log("After delay")
        return false
      }

      await myFunction()
}


// GET FIRST PLAYER RATED CONFIRMATION
export const getFirstOfTwoRatedConfirmations = async (client, player, opponent, format) => {
    console.log('getFirstOfTwoRatedConfirmations()')
    const guild = client.guilds.cache.get('414551319031054346')
    console.log('guild?.name rated.js 79', guild?.name)
    console.log('guild?.ownerId rated.js 79', guild?.ownerId)
    console.log('player.discordId', player.discordId)
    const member = await guild.members.fetch(player.discordId)
    if (!member) {
        console.log(`player ${player.name} is no longer a member of format library, so they cannot play rated`)
        return
    }

    const yourPool = await Pool.findOne({
        where: {
            playerId: player.id,
            formatId: format.id,
            status: 'pending'
        }
    })
    
    const opponentsPool = await Pool.findOne({
        where: {
            playerId: opponent.id,
            formatId: format.id,
            status: 'pending'
        }
    })

    await yourPool.update({ status: 'confirming' })
 
    const row = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
            .setCustomId(`YN-${yourPool.id}-${opponentsPool.id}-${guild.id}`)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Primary)
        )

        .addComponents(new ButtonBuilder()
            .setCustomId(`NN-${yourPool.id}-${opponentsPool.id}-${guild.id}`)
            .setLabel('No')
            .setStyle(ButtonStyle.Primary)
        )

    const message = await member.send({ content: `I've found a Rated ${format.name} Format ${format.emoji} opponent for you. Do you still wish to play?`, components: [row] })

    setTimeout(async () => {
        const unconfirmed = await Pool.count({
            where: {
                id: yourPool.id,
                status: 'confirming'
            }
        })

        if (unconfirmed) {
            await message.edit({ components: [] }).catch((err) => console.log(err))
            await yourPool.destroy()
            console.log(`removed ${yourPool.playerName} from the ${yourPool.formatName} rated pool`)
            await message.channel.send({ content: `Sorry, time's up! I've removed you from the ${format.name} Format ${format.emoji} rated pool.`})
        }
    }, 5 * 60 * 1000)
}

// GET FIRST PLAYER RATED CONFIRMATION  
export const getSecondOfTwoRatedConfirmations = async (client, player1PoolId, player2PoolId, guildId) => {
    console.log('getSecondOfTwoRatedConfirmations()')
    console.log('player1PoolId', player1PoolId)
    console.log('player2PoolId', player2PoolId)
    console.log('guildId rated.js 143', guildId)
    
    const player2Pool = await Pool.findOne({
        where: {
            id: Number(player2PoolId)
        },
        include: [Format, Player]
    })

    console.log('!!player2Pool', !!player2Pool)

    const player = player2Pool?.player
    const format = player2Pool?.format

    const guild = client.guilds.cache.get(guildId)
    console.log('guild?.name getSecondOfTwoRatedConfirmations()', guild?.name)
    
    const member = await guild.members.fetch(player?.discordId)
    if (!member) {
        console.log(`player ${player?.name} is no longer a member of ${guild.name}, so they cannot play rated`)
        return
    }

    await player2Pool.update({ status: 'confirming' })
 
    const row = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
            .setCustomId(`YY-${player1PoolId}-${player2PoolId}-${guild.id}`)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Primary)
        )

        .addComponents(new ButtonBuilder()
            .setCustomId(`NY-${player1PoolId}-${player2PoolId}-${guild.id}`)
            .setLabel('No')
            .setStyle(ButtonStyle.Primary)
        )

    const message = await member.send({ content: `I've found a Rated ${format?.name} Format ${format?.emoji} opponent for you. Do you still wish to play?`, components: [row] })

    setTimeout(async () => {
        const unconfirmed = await Pool.count({
            where: {
                id: Number(player2PoolId),
                status: 'confirming'
            }
        })

        if (unconfirmed) {
            await message.edit({ components: [] }).catch((err) => console.log(err))
            await player2Pool.destroy()
            console.log(`removed ${player?.name} from the ${format?.name} rated pool`)
            await message.channel.send({ content: `Sorry, time's up! I've removed you from the ${format?.name} Format ${format?.emoji} rated pool.`})
        }
    }, 5 * 60 * 1000)
}

// LOOK FOR POTENTIAL PAIRS
export const lookForPotentialPairs = async (interaction, pool, player, format, server, guild, channel) => {
    const yourStats = await Stats.findOne({ where: { formatId: format.id, playerId: player.id }})
    const yourElo = format.useSeasonalElo ? yourStats.seasonalElo : yourStats.elo
    const potentialPairs = await Pool.findAll({ 
        where: { 
            playerId: {[Op.not]: player.id },
            status: 'pending',
            formatId: format.id
        },
        include: [Player, Format],
        order: [['createdAt', 'ASC']]
    }) || []

    for (let i = 0; i < potentialPairs.length; i++) {
        const potentialPair = potentialPairs[i]
        
        const potentialPairStats = await Stats.findOne({ where: { formatId: format.id, playerId: potentialPair.playerId }})
        const potentialPairElo = format?.useSeasonalElo ? potentialPairStats?.seasonalElo : potentialPairStats?.elo
        // if (format.name === 'Forged in Chaos' && ((yourElo <= 430 && potentialPairElo > 500) || (yourElo > 500 && potentialPairElo <= 430))) {
        if (format.name === 'Forged in Chaos' && (
            yourElo <= 420 && potentialPairElo <= 420 ||
            yourElo > 420 && potentialPairElo > 420 ||
            Math.abs(yourElo - potentialPairElo) <= 80
        )) {
            console.log(`Acceptable pairing`)
        } else if (format.name === 'Forged in Chaos') {
            console.log(`<!> ${player.name} and ${potentialPair.playerName} are TOO FAR APART IN ELO. Look for another opponent.`)
            continue
        }
        
        // if (format.name === 'Forged in Chaos' && (Math.abs(yourElo - potentialPairElo) > 80)) {
        //     continue
        // }

        const twoMinutesAgo = new Date(Date.now() - (2 * 60 * 1000))
        const cutoff = new Date(new Date() - (15 * 60 * 1000))

        const mostRecentMatch = await Match.findOne({
            where: {
                [Op.or]: [
                    { winnerId: player.id, loserId: potentialPair.playerId },
                    { loserId: player.id, winnerId: potentialPair.playerId },
                ],
                formatId: format.id
            },
            order: [['createdAt', 'DESC']]
        })             

        if (mostRecentMatch && (cutoff < mostRecentMatch?.createdAt)) {   
            console.log(`<!> ${player.name} and ${potentialPair.playerName} are RECENT opponents. Match reported at ${mostRecentMatch?.createdAt}, cutoff is ${cutoff}. Look for another opponent <!>`)
            continue
        } else if ((potentialPair.updatedAt < twoMinutesAgo) || potentialPair.wasInactive) {
            console.log(`<!> ${player.name} and ${potentialPair.playerName} are NOT recent opponents. ${mostRecentMatch ? `Match reported at ${mostRecentMatch?.createdAt}, cutoff is ${cutoff}`: `They have never played`}. Getting confirmation from ${potentialPair.playerName} <!>`)
            const foundOpponent = await getRatedConfirmation(potentialPair.player, player, format, guild)
            if (foundOpponent) {
                return true
            } else {
                continue
            }
        } else {
            console.log(`<!> ${player.name} and ${potentialPair.playerName} are NOT recent opponents. ${mostRecentMatch ? `Match reported at ${mostRecentMatch?.createdAt}, cutoff is ${cutoff}`: `They have never played`}. Creating New Pairing <!>`)
            const playerDiscordName =  player.discordName
            const playerGlobalName = player.globalName
            const member = await guild.members.fetch(player.discordId)
            const opponent = potentialPair.player
            const opponentDiscordName =  opponent.discordName
            const opponentGlobalName = opponent.globalName
            const opposingMember = await guild.members.fetch(opponent.discordId)

            const twoMinutesAgo = new Date(Date.now() - (2 * 60 * 1000)) 

            const count1 = await Pairing.count({
                where: {
                    status: 'active',
                    [Op.or]: {
                        playerAId: player.id,
                        playerBId: player.id,
                    },
                    createdAt: {[Op.gte]: twoMinutesAgo}
                }
            })

            const count2 = await Pairing.count({
                where: {
                    status: 'active',
                    [Op.or]: {
                        playerAId: opponent.id,
                        playerBId: opponent.id,
                    },
                    createdAt: {[Op.gte]: twoMinutesAgo}
                }
            })

            if (count1 || count2) {
                console.log(`lookForPotentialPairs() <!> DO NOT PAIR <!>`)
                return
            }

            opposingMember.user.send(
                `New pairing for Rated ${format.name} Format ${format.emoji}!` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${channel.id}>` +
                `\nDiscord Name: ${playerGlobalName ? `${playerGlobalName} (${playerDiscordName})` : playerDiscordName}` +
                `\nDuelingbook Name: ${player.duelingBookName}`
            ).catch((err) => console.log(err))

            member.user.send(
                `New pairing for Rated ${format.name} Format ${format.emoji}!` + 
                `\nServer: ${server.name} ${server.logo}` + 
                `\nChannel: <#${channel.id}>` +
                `\nDiscord Name: ${opponentGlobalName ? `${opponentGlobalName} (${opponentDiscordName})` : opponentDiscordName}` +
                `\nDuelingbook Name: ${opponent.duelingBookName}`
            ).catch((err) => console.log(err))

            await Pairing.create({
                formatId: format.id,
                formatName: format.name,
                serverId: server.id,
                communityName: server.name,
                playerAName: pool.playerName,
                playerAId: pool.playerId,
                deckFileA: pool.deckFile,
                playerBName: potentialPair.playerName,
                playerBId: potentialPair.playerId,
                deckFileB: potentialPair.deckFile
            })
            
            await pool.destroy()
            await potentialPair.destroy()
            
            const poolsToDeactivate = await Pool.findAll({
                where: {
                    playerId: {[Op.or]: [player.id, opponent.id]}
                }
            }) || []

            for (let d = 0; d < poolsToDeactivate.length; d++) {
                const rPTD = poolsToDeactivate[d]
                await rPTD.update({ status: 'inactive', wasInactive: true })
            }

            const isSeasonal = format.useSeasonalElo
            const eloType = isSeasonal ? 'seasonalElo' : 'elo'
            const gamesType = isSeasonal ? 'seasonalGames' : 'games'

            const allStats = await Stats.findAll({ 
                where: {
                    formatId: format.id, 
                    [gamesType]: { [Op.gte]: 3 },
                    serverId: '414551319031054346',
                    '$player.isHidden$': false
                },
                include: [Player],
                order: [[eloType, 'DESC']] 
            }) || []


            const p1Index = allStats.findIndex((s) => s.playerId === player.id)
            const p1Rank = p1Index >= 0 ? `#${p1Index + 1} ` : ''
            const p2Index = allStats.findIndex((s) => s.playerId === opponent.id)
            const p2Rank = p2Index >= 0 ? `#${p2Index + 1} ` : ''

            const content = format.name === 'Forged in Chaos' ? `New Rated ${format.name} ${format.emoji} Match: ${p2Rank}<@${opponent.discordId}> (DB: ${opponent.duelingBookName}) vs. ${p1Rank}<@${player.discordId}> (DB: ${player.duelingBookName}). Good luck to both duelists.` :
                `New Rated ${format.name} Format ${format.emoji} Match: ${p2Rank}<@${opponent.discordId}> (DB: ${opponent.duelingBookName}) vs. ${p1Rank}<@${player.discordId}> (DB: ${player.duelingBookName}). Good luck to both duelists.`
            
            return channel.send({ content: content })   
        }
    }
}

// HANDLE RATED CONFIRMATION
export const handleRatedConfirmation = async (client, interaction, isConfirmed, yourPoolId, opponentsPoolId, guildId) => {
    try {
        const yourPool = await Pool.findOne({ where: { id: Number(yourPoolId) }, include: [Format, Player] })
        const format = yourPool.format
        const opponentsPool = await Pool.findOne({ where: { id: Number(opponentsPoolId), status: {[Op.not]: 'inactive'}}, include: Player })
        
        if (isConfirmed) {
            if (!opponentsPool) {
                await yourPool.update({ status: 'pending' })
                console.log(`Sorry, ${yourPool.playerName}, your potential opponent either found a match or left the pool. I'll put you back in the Rated ${format.name} Format ${format.emoji} Pool.`)
                return interaction.user.send(`Sorry, your potential opponent either found a match or left the pool. I'll put you back in the Rated ${format.name} Format ${format.emoji} Pool.`)
            }
    
            const server = await Server.findOne({ where: { id: guildId }})
            const channelId = format.channelId || format.categoryChannelId
            const guild = client.guilds.cache.get(guildId)
            const channel = guild.channels.cache.get(channelId)
            const player = yourPool.player
            const member = await guild.members.fetch(player.discordId)
            const playerDiscordName =  player.discordName
            const playerGlobalName = player.globalName
            const opponent = opponentsPool.player
            const opponentDiscordName =  opponent.discordName
            const opponentGlobalName = opponent.globalName
            const opposingMember = await guild.members.fetch(opponent.discordId)


            const twoMinutesAgo = new Date(Date.now() - (2 * 60 * 1000)) 

            const count1 = await Pairing.count({
                where: {
                    status: 'active',
                    [Op.or]: {
                        playerAId: yourPool.playerId,
                        playerBId: yourPool.playerId,
                    },
                    createdAt: {[Op.gte]: twoMinutesAgo}
                }
            })

            const count2 = await Pairing.count({
                where: {
                    status: 'active',
                    [Op.or]: {
                        playerAId: opponentsPool.playerId,
                        playerBId: opponentsPool.playerId,
                    },
                    createdAt: {[Op.gte]: twoMinutesAgo}
                }
            })

            if (count1 || count2) {
                console.log(`handleRatedConfirmation() <!> DO NOT PAIR <!>`)
                return
            }

            console.log(`handleRatedConfirmation() New Pairing!`)

            opposingMember.user.send(
                `New pairing for Rated ${format.name} Format ${format.emoji}!` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${channelId}>` +
                `\nDiscord Name: ${playerGlobalName ? `${playerGlobalName} (${playerDiscordName})` : playerDiscordName}` +
                `\n${`Duelingbook Name: ${player.duelingBookName}`}`
            ).catch((err) => console.log(err))
            
            member.user.send(
                `New pairing for Rated ${format.name} Format ${format.emoji}!` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${channelId}>` +
                `\nDiscord Name: ${opponentGlobalName ? `${opponentGlobalName} (${opponentDiscordName})` : opponentDiscordName}` +
                `\nDuelingbook Name: ${opponent.duelingBookName}`
            ).catch((err) => console.log(err))
     
            await Pairing.create({
                formatId: format.id,
                formatName: format.name,
                serverId: server.id,
                communityName: server.name,
                playerAName: yourPool.playerName,
                playerAId: yourPool.playerId,
                deckFileA: yourPool.deckFile,
                playerBName: opponentsPool.playerName,
                playerBId: opponentsPool.playerId,
                deckFileB: opponentsPool.deckFile
            })   
    
            await yourPool.destroy()
            await opponentsPool.destroy()
    
            const poolsToDeactivate = await Pool.findAll({
                where: {
                    playerId: {[Op.or]: [player.id, opponent.id]}
                }
            }) || []
    
            for (let d = 0; d < poolsToDeactivate.length; d++) {
                const rPTD = poolsToDeactivate[d]
                await rPTD.update({ status: 'inactive', wasInactive: true })
            }
    
            const isSeasonal = format.useSeasonalElo
            const eloType = isSeasonal ? 'seasonalElo' : 'elo'
            const gamesType = isSeasonal ? 'seasonalGames' : 'games'

            const allStats = await Stats.findAll({ 
                where: {
                    formatId: format.id, 
                    [gamesType]: { [Op.gte]: 3 },
                    serverId: '414551319031054346',
                    isActive: true,
                    '$player.isHidden$': false
                },
                include: [Player],
                order: [[eloType, 'DESC']] 
            }) || []
    
            const p1Index = allStats.findIndex((s) => s.playerId === player.id)
            const p1Rank = p1Index >= 0 ? `#${p1Index + 1} ` : ''
            const p2Index = allStats.findIndex((s) => s.playerId === opponent.id)
            const p2Rank = p2Index >= 0 ? `#${p2Index + 1} ` : ''
    
            
            const content = format.name === 'Forged in Chaos' ? `New Rated ${format.name} ${format.emoji} Match: ${p2Rank}<@${opponent.discordId}> (DB: ${opponent.duelingBookName}) vs. ${p1Rank}<@${player.discordId}> (DB: ${player.duelingBookName}). Good luck to both duelists.` :
                `New Rated ${format.name} Format ${format.emoji} Match: ${p2Rank}<@${opponent.discordId}> (DB: ${opponent.duelingBookName}) vs. ${p1Rank}<@${player.discordId}> (DB: ${player.duelingBookName}). Good luck to both duelists.`
            return channel.send({ content: content })
        } else {
            await yourPool.destroy()
            return interaction.user.send(`Not a problem. I've removed you from the Rated ${format.name} Format ${format.emoji} player pool.`)
        }
    } catch (err) {
        console.log(err)
    }
}

// GET DROP FORMATS
export const getDropFormats = async (interaction, pools) => {
    if (pools.length === 1) return pools
    const filter = m => m.author.id === interaction.user.id
    const message = await interaction.user.send({ content: `Which Rated Pool(s) do you want to leave?\n(1) - All\n${pools.map((p, index) => `(${index+2}) - ${p}`).join('\n')}`})
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000
    }).then(async (collected) => {
        const response = collected.first().content.toLowerCase()
        const digits = response.match(/\d/g).join('')
        const index = !isNaN(digits) ? digits - 1 : null
        const poolsToLeave = response.includes('all') || index === 0 ? pools : 
            index !== null ? [pools[index - 1]] :
            false

        return poolsToLeave
    }).catch((err) => {
        console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
    })
}

// GET RATED FORMAT
export const getRatedFormat = async (interaction) => {
    const filter = m => m.author.id === interaction.user.id
    const message = await interaction.user.send({ content: `What do you want to play?`})
    // console.log('message.createdAt', message.createdAt)
    // console.log('message.createdAt.getTimezoneOffset()', message.createdAt?.getTimezoneOffset())

    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 15000
    }).then(async (collected) => {
        // console.log('collected.createdAt', collected.createdAt)
        // console.log('collected?.createdAt?.getTimezoneOffset()', collected.createdAt?.getTimezoneOffset())
        const response = collected.first().content.toLowerCase()
        // console.log('response.createdAt', response.createdAt)
        // console.log('response?.createdAt?.getTimezoneOffset()', response.createdAt?.getTimezoneOffset())

        const format = await Format.findOne({
            where: {
                [Op.or]: [
                    { name: {[Op.iLike]: response } },
                    { abbreviation: {[Op.iLike]: response } }
                ]
            }
        }) || await Format.findOne({
            where: {
                cleanName: {[Op.iLike]: '%' + response + '%' },
            }
        })

        return format
    }).catch((err) => {
        console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
    })
}

//GET PREVIOUS RATED DECK
export const getPreviousRatedDeck = async (user, player, yourRatedDecks, format) => {   
    if (!yourRatedDecks || !yourRatedDecks.length) return false
    const options = yourRatedDecks.map((yRD, index) => `(${index + 1}) - ${yRD.name} - <https://formatlibrary.com/deck-builder/${yRD.id}>`)
    options.push(`(${options.length + 1}) - Submit and use a new deck`)
    if (yourRatedDecks.length) { 
        options.push(
            `(${options.length + 1}) - Replace an old deck and use the updated deck`,
            `(${options.length + 2}) - Delete an old deck`
        )
    }

    const filter = m => m.author.id === user.id
    const message = await user.send({ content: `Which of your ${format.name} Format ${format.emoji} Rated deck(s) would you like to use?\n${options.join('\n')}`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 5 * 60 * 1000
    }).then(async (collected) => {
        const response = collected.first().content.toLowerCase()
        const digits = response.match(/\d/g).join('')
        const index = !isNaN(digits) ? digits - 1 : null
        if (index === options.length - 3) {
            return await getNewRatedDeck(user, player, format)
        } else if (index === options.length - 2) {
            const deckToReplace = await getRatedDeckToReplace(user, yourRatedDecks, format)
            const newRatedDeck = await getNewRatedDeck(user, player, format, deckToReplace)
            return newRatedDeck
        } else if (index === options.length - 1) {
            yourRatedDecks = await deleteRatedDeck(user, yourRatedDecks, format)
            return getPreviousRatedDeck(user, player, yourRatedDecks, format)
        } else {
            let previousRatedDeck = index >= 0 && index < options.length - 3 ? yourRatedDecks[index] : false

            previousRatedDeck = await Deck.findOne({
                where: {
                    id: previousRatedDeck?.id
                }
            })

            return previousRatedDeck
        }
    }).catch((err) => {
        console.log(err)
        user.send({ content: `Sorry, time's up. Please try again.`}).catch((err) => console.log(err))
        return undefined
    })
}


//GET RATED DECK TO REPLACE
export const getRatedDeckToReplace = async (user, yourRatedDecks, format) => {   
    if (!yourRatedDecks || !yourRatedDecks.length) return false
    const options = yourRatedDecks.map((yRD, index) => `(${index + 1}) - ${yRD.name} - <https://formatlibrary.com/deck-builder/${yRD.id}>`)

    const filter = m => m.author.id === user.id
    const message = await user.send({ content: `Which of your ${format.name} Format ${format.emoji} Rated deck(s) would you like to replace?\n${options.join('\n')}`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 5 * 60 * 1000
    }).then(async (collected) => {
        const response = collected.first().content.toLowerCase()
        const digits = response.match(/\d/g).join('')
        const index = !isNaN(digits) ? digits - 1 : null
        let previousRatedDeck = index >= 0 ? yourRatedDecks[index] : false

        previousRatedDeck = await Deck.findOne({
            where: {
                id: previousRatedDeck?.id
            }
        })

        return previousRatedDeck
    }).catch((err) => {
        console.log(err)
        user.send({ content: `Sorry, time's up. Please try again.`}).catch((err) => console.log(err))
        return undefined
    })
}

//DELETE RATED DECK
export const deleteRatedDeck = async (user, yourRatedDecks, format) => {   
    if (!yourRatedDecks || !yourRatedDecks.length) return false
    const options = yourRatedDecks.map((yRD, index) => `(${index + 1}) - ${yRD.name} - <https://formatlibrary.com/deck-builder/${yRD.id}>`)

    const filter = m => m.author.id === user.id
    const message = await user.send({ content: `Which of your ${format.name} Format ${format.emoji} Rated deck(s) would you like to delete?\n${options.join('\n')}`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 5 * 60 * 1000
    }).then(async (collected) => {
        const response = collected.first().content.toLowerCase()
        const digits = response.match(/\d/g).join('')
        const index = !isNaN(digits) ? digits - 1 : null
        let previousRatedDeck = index >= 0 ? yourRatedDecks[index] : false

        if (previousRatedDeck) {
            await previousRatedDeck.destroy()
            yourRatedDecks.splice(index, 1)
            return yourRatedDecks
        } else {
            return yourRatedDecks
        }
    }).catch((err) => {
        console.log(err)
        user.send({ content: `Sorry, time's up. Please try again.`}).catch((err) => console.log(err))
        return undefined
    })
}

//GET NEW RATED DECK
export const getNewRatedDeck = async (user, player, format, deckToReplace) => {   
    const filter = m => m.author.id === user.id
    const message = await user.send({ content: `To submit a new deck, please either:\n- copy and paste a **__YDKe code__**\n- upload a **__YDK file__**`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 180000
    }).then(async (collected) => {
        const url = collected.first()?.attachments?.first()?.url
        const ydke = collected.first()?.content
        let ydk

        if (url) {
            const {data} = await axios.get(url)
            ydk = data
        } else {
            const {data} = await axios.put(`https://formatlibrary.com/api/decks/convert-ydke-to-ydk`, { ydke: ydke })
            ydk = data                
        }
        
        if (ydk) {
            const main = ydk.split('#main')[1].split('#extra')[0].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)
            const extra = ydk.split('#extra')[1].split('!side')[0].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)
            const side = ydk.split('!side')[1].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)    
            const minimum = format.category === 'Speed' ? 20 : 40

            if (main?.length < minimum) {
                user.send(`I'm sorry, your deck must contain at least ${minimum} cards.`).catch((err) => console.log(err))    
                return false 
            }

            const deckArr = [...main, ...extra, ...side,]

            let issues

            if (format.name === 'Forged in Chaos') {
                issues = await getForgedIssues(player, deckArr, format)
                if (!issues) return false
            } else {
                issues = await getIssues(deckArr, format)
                if (!issues) return false
            }

            const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards, zeroCopiesOwned, oneCopyOwned, twoCopiesOwned } = issues
            if (!illegalCards || !forbiddenCards || !limitedCards || !semiLimitedCards || !unrecognizedCards) return false
            
            if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length || zeroCopiesOwned?.length || oneCopyOwned?.length || twoCopiesOwned?.length) {
                let response = [`I'm sorry, ${user.username}, your deck is not legal. ${emojis.mad}`]
                if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
                if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
                if (limitedCards.length) response = [...response, `\nThe following cards are limited:`, ...limitedCards]
                if (semiLimitedCards.length) response = [...response, `\nThe following cards are semi-limited:`, ...semiLimitedCards]
                if (zeroCopiesOwned?.length) response = [...response, `\nYou own 0 copies of the following cards:`, ...zeroCopiesOwned]
                if (oneCopyOwned?.length) response = [...response, `\nYou only own 1 copy of the following cards:`, ...oneCopyOwned]
                if (twoCopiesOwned?.length) response = [...response, `\nYou only own 2 copies of the following cards:`, ...twoCopiesOwned]
            
                for (let i = 0; i < response.length; i += 50) {
                    if (response[i+50] && response[i+50].startsWith("\n")) {
                        user.send({ content: response.slice(i, i+51).join('\n').toString()}).catch((err) => console.log(err))
                        i++
                    } else {
                        user.send({ content: response.slice(i, i+50).join('\n').toString()}).catch((err) => console.log(err))
                    }
                }
            
                return false
            } else if (unrecognizedCards.length) {
                let response = `I'm sorry, ${user.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
                response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
                
                user.send({ content: response.toString() }).catch((err) => console.log(err))
                return false
             } else {
                user.send({ content: `Thanks, ${user.username}, your deck is perfectly legal. ${emojis.legend}`}).catch((err) => console.log(err))
                if (deckToReplace) {                    
                    await deckToReplace.update({
                        url: url,
                        ydk: ydk
                    })
    
                    return deckToReplace
                } else {
                    const deckName = await askForDeckName(user, player) || 'Unnamed Deck'
                    const newRatedDeck = await Deck.create({
                        builderName: player.name,
                        formatName: format.name,
                        formatId: format.id,
                        name: deckName,
                        url: url,
                        ydk: ydk,
                        origin: 'user',
                        builderId: player.id
                    })
    
                    return newRatedDeck
                }
            }
        } else {
            user.send({ content: "Sorry, I only accept **__YDK files__** or **__YDKe codes__**."}).catch((err) => console.log(err))    
            return undefined  
        }
    }).catch((err) => {
        console.log(err)
        user.send({ content: `Sorry, time's up. Please try again.`}).catch((err) => console.log(err))
        return undefined
    })
}

// CHECK PREVIOUS FORGED RATED DECK
export const checkPreviousForgedRatedDeck = async (user, player, ydk, format) => {
    const main = ydk.split('#main')[1].split('#extra')[0].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)
    const extra = ydk.split('#extra')[1].split('!side')[0].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)
    const side = ydk.split('!side')[1].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)    
    const minimum = format.category === 'Speed' ? 20 : 40

    if (main?.length < minimum) {
        user.send(`I'm sorry, your deck must contain at least ${minimum} cards.`).catch((err) => console.log(err))    
        return false 
    }

    const deckArr = [...main, ...extra, ...side,]

    const issues = await getForgedIssues(player, deckArr, format)

    const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards, zeroCopiesOwned, oneCopyOwned, twoCopiesOwned } = issues
    if (!illegalCards || !forbiddenCards || !limitedCards || !semiLimitedCards || !unrecognizedCards) return false
    
    if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length || zeroCopiesOwned?.length || oneCopyOwned?.length || twoCopiesOwned?.length) {
        let response = [`I'm sorry, ${user.username}, your deck is not legal. ${emojis.mad}`]
        if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
        if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
        if (limitedCards.length) response = [...response, `\nThe following cards are limited:`, ...limitedCards]
        if (semiLimitedCards.length) response = [...response, `\nThe following cards are semi-limited:`, ...semiLimitedCards]
        if (zeroCopiesOwned?.length) response = [...response, `\nYou own 0 copies of the following cards:`, ...zeroCopiesOwned]
        if (oneCopyOwned?.length) response = [...response, `\nYou only own 1 copy of the following cards:`, ...oneCopyOwned]
        if (twoCopiesOwned?.length) response = [...response, `\nYou only own 2 copies of the following cards:`, ...twoCopiesOwned]
    
        for (let i = 0; i < response.length; i += 50) {
            if (response[i+50] && response[i+50].startsWith("\n")) {
                user.send({ content: response.slice(i, i+51).join('\n').toString()}).catch((err) => console.log(err))
                i++
            } else {
                user.send({ content: response.slice(i, i+50).join('\n').toString()}).catch((err) => console.log(err))
            }
        }
    
        return false
    } else if (unrecognizedCards.length) {
        let response = `I'm sorry, ${user.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
        response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
        
        user.send({ content: response.toString() }).catch((err) => console.log(err))
        return false
     } else {
        return true
    }
}


//ASK FOR DECK NAME
export const askForDeckName = async (member, player, override = false) => {
    const filter = m => m.author.id === member.id || member.user.id
    const pronoun = override ? `${player.name}'s` : 'your'
    const message = await member.send({ content: `Please provide a nickname for ${pronoun} deck.` }).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
		max: 1,
        time: 15000
    }).then(async (collected) => {
        const response = collected.first().content
        return response
    }).catch((err) => {
        console.log(err)
        member.send({ content: `Okay, I'll save this as an "Unnamed Deck". You can always change it later.`}).catch((err) => console.log(err))
        return 'Unnamed Deck'
    })
}

// SEND RATED JOIN NOTIFICATIONS
export const sendRatedJoinNotifications = async (client, player, format, deck, isResubmission) => {
    try {
        if (!isResubmission) {
            const guild = client.guilds.cache.get('414551319031054346')
            const channel = guild.channels.cache.get(format.channelId || format.categoryChannelId)
            if (channel) await channel.send(`Somebody joined the ${format.name} ${format.emoji} Rated Pool! ${emojis.megaphone}`)
        }

        const user = await client.users.fetch(player.discordId)
        const deckAttachments = await drawDeck(deck.ydk) || []

        for (let i = 0; i < deckAttachments.length; i++) {
            const attachment = deckAttachments[i]
            if (i === 0) {
                if (!isResubmission) {
                    await user.send({ content: `You've joined the ${format.name} Rated Pool. ${format.emoji} You'll receive a DM when you're paired. FYI, this is the deck you submitted:`, files: [attachment] }).catch((err) => console.log(err))
                } else {
                    await user.send({ content: `You've resubmitted your deck for the ${format.name} Rated Pool. ${format.emoji} FYI, this is the deck you resubmitted:`, files: [attachment] }).catch((err) => console.log(err))
                }
            } else {
                await user.send({ files: [attachment] }).catch((err) => console.log(err))
            }
        }

        return
    } catch (err) {
        console.log(err)
    }
}

// SEND RATED PAIRING ANNOUNCEMENT
export const sendRatedPairingAnnouncement = async (client, player, opponent, format) => {
    try {
        const guild = client.guilds.cache.get('414551319031054346')
        const {user: user1} = await guild.members.fetch(player.discordId)
        const {user: user2} = await guild.members.fetch(opponent.discordId)
        const playerDiscordName = player.discordName
        const playerGlobalName = player.globalName
        const opponentDiscordName =  opponent.discordName
        const opponentGlobalName = opponent.globalName

        user1.send(
            `New pairing for Rated ${format.name} Format! ${format.emoji}` + 
            `\nServer: Format Library ${emojis.FL}` + 
            `\nChannel: <#${format.channelId || format.categoryChannelId}}>` +
            `\nDiscord Name: ${opponentGlobalName ? `${opponentGlobalName} (${opponentDiscordName})` : opponentDiscordName}` +
            `\nDuelingbook Name: ${opponent.duelingBookName}`
        ).catch((err) => console.log(err))
    
        user2.send(
            `New pairing for Rated ${format.name} Format! ${format.emoji}` +
            `\nServer: Format Library ${emojis.FL}` +
            `\nChannel: <#${format.channelId || format.categoryChannelId}>` +
            `\nDiscord Name: ${playerGlobalName ? `${playerGlobalName} (${playerDiscordName})` : playerDiscordName}` +
            `\nDuelingbook Name: ${player.duelingBookName}`
        ).catch((err) => console.log(err))  
    } catch (err) {
        console.log(err)
    }
}

// SEND RATED PAIRING NOTIFICATIONS
export const sendRatedPairingNotifications = async (client, player, opponent, format) => {
    try {
        const guild = client.guilds.cache.get('414551319031054346')
        const channel = guild.channels.cache.get(format.channelId || format.categoryChannelId)
    
        const now = new Date()
        const isSeasonal = format.seasonResetDate < now
        const eloType = isSeasonal ? 'seasonalElo' : 'elo'
        const gamesType = isSeasonal ? 'seasonalGames' : 'games'

        const allStats = await Stats.findAll({ 
            where: {
                formatId: format.id, 
                [gamesType]: { [Op.gte]: 3 },
                serverId: '414551319031054346',
                isActive: true,
                '$player.isHidden$': false
            },
            include: [Player],
            order: [[eloType, 'DESC']] 
        }) || []
    
        const p1Index = allStats.findIndex((s) => s.playerId === player.id)
        const p1Rank = p1Index >= 0 ? `#${p1Index + 1} ` : ''
        const p2Index = allStats.findIndex((s) => s.playerId === opponent.id)
        const p2Rank = p2Index >= 0 ? `#${p2Index + 1} ` : ''
        const content = format.name === 'Forged in Chaos' ? `New Rated ${format.name} ${format.emoji} Match: ${p2Rank}<@${opponent.discordId}> (DB: ${opponent.duelingBookName}) vs. ${p1Rank}<@${player.discordId}> (DB: ${player.duelingBookName}). Good luck to both duelists.` :
            `New Rated ${format.name} Format ${format.emoji} Match: ${p2Rank}<@${opponent.discordId}> (DB: ${opponent.duelingBookName}) vs. ${p1Rank}<@${player.discordId}> (DB: ${player.duelingBookName}). Good luck to both duelists.`
        return channel.send({ content: content })   
    } catch (err) {
        console.log(err)
    }
}

// GET ELO K-FACTOR
export const getKFactor = (games, bestElo) => {
    if (games < 20 && bestElo < 560) {
        return 24
    } else if (bestElo < 560) {
        return 16
    } else {
        return 8
    }
}

// GET ELO DELTA
export const getEloDelta = (kFactor, winnersElo, losersElo) => {
    return kFactor * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((winnersElo - losersElo) / 400))))))
}

// GET SEASON
export const getSeason = (month) => {
    return month === 11 || month < 2 ? '<:winter:1324163611131904093>' : month < 5 ? '<:spring:1324167225887817920>' : month < 8 ? '<:summer:1324167546303414324>' : '<:autumn:1324158718543269918>'
}

// UPDATE GENERAL STATS
export const updateGeneralStats = async (winnerStats, loserStats) => {
    const winnerKFactor = getKFactor(winnerStats.games, winnerStats.bestElo)
    const loserKFactor = getKFactor(loserStats.games, loserStats.bestElo)
    const winnerDelta = getEloDelta(winnerKFactor, winnerStats.elo, loserStats.elo)
    const loserDelta = getEloDelta(loserKFactor, winnerStats.elo, loserStats.elo)
    const classicDelta = getEloDelta(20, winnerStats.elo, loserStats.elo)
    
    await winnerStats.update({
        elo: winnerStats.elo + winnerDelta,
        backupElo: winnerStats.elo,
        bestElo: Math.max(winnerStats.elo + winnerDelta, winnerStats.bestElo),
        classicElo: winnerStats.classicElo + classicDelta,
        backupClassicElo: winnerStats.classicElo,
        wins: winnerStats.wins + 1,
        games: winnerStats.games + 1,
        currentStreak: winnerStats.currentStreak + 1,
        bestStreak: Math.max(winnerStats.currentStreak, winnerStats.bestStreak)
    })

    await loserStats.update({
        elo: loserStats.elo - loserDelta,
        backupElo: loserStats.elo,
        classicElo: loserStats.classicElo + classicDelta,
        backupClassicElo: loserStats.classicElo,
        losses: loserStats.losses + 1,
        games: loserStats.games + 1,
        currentStreak: 0
    })

    return [winnerDelta, loserDelta, classicDelta]
}

// UPDATE SEASONAL STATS
export const updateSeasonalStats = async (winnerStats, loserStats) => {
    const winnerKFactor = getKFactor(winnerStats.seasonalGames, winnerStats.bestSeasonalElo)
    const loserKFactor = getKFactor(loserStats.seasonalGames, loserStats.bestSeasonalElo)
    const winnerDelta = getEloDelta(winnerKFactor, winnerStats.seasonalElo, loserStats.seasonalElo)
    const loserDelta = getEloDelta(loserKFactor, winnerStats.seasonalElo, loserStats.seasonalElo)
    
    await winnerStats.update({
        seasonalElo: winnerStats.seasonalElo + winnerDelta,
        backupSeasonalElo: winnerStats.seasonalElo,
        bestSeasonalElo: Math.max(winnerStats.seasonalElo + winnerDelta, winnerStats.bestSeasonalElo),
        seasonalWins: winnerStats.seasonalWins + 1,
        seasonalGames: winnerStats.seasonalGames + 1
    })

    await loserStats.update({
        seasonalElo: loserStats.seasonalElo - loserDelta,
        backupSeasonalElo: loserStats.seasonalElo,
        seasonalLosses: loserStats.seasonalLosses + 1,
        seasonalGames: loserStats.seasonalGames + 1
    })
}