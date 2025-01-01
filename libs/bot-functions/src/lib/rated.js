
//RATED FUNCTIONS

//MODULE IMPORTS
import axios from 'axios'
import { Op } from 'sequelize'
import { Deck, Format, Match, Pairing, Player, Pool, Stats, Server } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { getIssues } from './deck'
import { drawDeck } from './utility'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

// GET RATED CONFIRMATION
export const getRatedConfirmation = async (client, player, opponent, format) => {
    console.log('getRatedConfirmation()')
    const guild = client.guilds.cache.get('414551319031054346')
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
            .setCustomId(`Y-${yourPool.id}-${opponentsPool.id}-414551319031054346`)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Primary)
        )

        .addComponents(new ButtonBuilder()
            .setCustomId(`N-${yourPool.id}-${opponentsPool.id}-414551319031054346`)
            .setLabel('No')
            .setStyle(ButtonStyle.Primary)
        )

    const message = await member.user.send({ content: `I've found a Rated ${format.name} Format ${format.emoji} opponent for you. Do you still wish to play?`, components: [row] })

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

// LOOK FOR POTENTIAL PAIRS
export const lookForPotentialPairs = async (client, interaction, poolEntry, player, format) => {
    const potentialPairs = await Pool.findAll({ 
        where: { 
            playerId: {[Op.not]: player.id },
            status: 'pending',
            formatId: format.id
        },
        include: Player,
        order: [['createdAt', 'ASC']]
    }) || []

    for (let i = 0; i < potentialPairs.length; i++) {
        const potentialPair = potentialPairs[i]
        const twoMinutesAgo = new Date(Date.now() - (2 * 60 * 1000))
        const tenMinutesAgo = new Date(Date.now() - (10 * 60 * 1000))

        const isRecentOpponent = await Match.count({
            where: {
                [Op.or]: {
                    [Op.and]: {
                        winnerId: player.id,
                        loserId: potentialPair.player.id
                    },
                    [Op.and]: {
                        winnerId: potentialPair.player.id,
                        loserId: player.id
                    },
                },
                formatId: format.id,
                createdAt: {[Op.gte]: tenMinutesAgo }
            }
        })

        if (isRecentOpponent) {
            continue
        } else if (potentialPair.updatedAt < twoMinutesAgo) {
            getRatedConfirmation(client, potentialPair.player, player, format)
            continue
        } else {
            const server = await Server.findOne({ where: { id: '414551319031054346' }})
            const channelId = format.channelId
            const guild = client.guilds.cache.get('414551319031054346')
            const channel = guild.channels.cache.get(channelId)
            const playerDiscordName =  player.discordName
            const playerGlobalName = player.globalName
            const opponent = potentialPair.player
            const opponentDiscordName =  opponent.discordName
            const opponentGlobalName = opponent.globalName
            const opposingMember = await guild.members.fetch(opponent.discordId)

            opposingMember.user.send(
                `New pairing for Rated ${format.name} Format ${format.emoji}!` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${channelId}>` +
                `\nDiscord Name: ${playerGlobalName ? `${playerGlobalName} (${playerDiscordName})` : playerDiscordName}` +
                `\nDuelingbook Name: ${player.duelingBookName}`
            ).catch((err) => console.log(err))

            interaction.user.send(
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
                playerAName: poolEntry.name,
                playerAId: poolEntry.playerId,
                deckFileA: poolEntry.deckFile,
                playerBName: potentialPair.name,
                playerBId: potentialPair.playerId,
                deckFileB: potentialPair.deckFile
            })
            
            await poolEntry.destroy()
            await potentialPair.destroy()
            
            const poolsToDeactivate = await Pool.findAll({
                where: {
                    playerId: {[Op.or]: [player.id, opponent.id]}
                }
            }) || []

            for (let d = 0; d < poolsToDeactivate.length; d++) {
                const rPTD = poolsToDeactivate[d]
                await rPTD.update({ status: 'inactive' })
            }

            const allStats = await Stats.findAll({ 
                where: {
                    formatId: format.id, 
                    games: { [Op.gte]: 3 },
                    serverId: '414551319031054346',
                    isActive: true,
                    '$player.isHidden$': false
                },
                include: [Player],
                order: [['elo', 'DESC']] 
            }) || []

            const p1Index = allStats.findIndex((s) => s.playerId === player.id)
            const p1Rank = p1Index >= 0 ? `#${p1Index + 1} ` : ''
            const p2Index = allStats.findIndex((s) => s.playerId === opponent.id)
            const p2Rank = p2Index >= 0 ? `#${p2Index + 1} ` : ''
            const content = `New Rated ${format.name} Format ${format.emoji} Match: ${p2Rank}<@${opponent.discordId}> (DB: ${opponent.duelingBookName}) vs. ${p1Rank}<@${player.discordId}> (DB: ${player.duelingBookName}). Good luck to both duelists.`
            console.log(`content`, content)
            return channel.send({ content: content })   
        }
    }
}

// HANDLE RATED CONFIRMATION
export const handleRatedConfirmation = async (client, interaction, isConfirmed, yourPoolId, opponentsPoolId, serverId) => {
    try {
        console.log('handleRatedConfirmation()')
        const yourPool = await Pool.findOne({ where: { id: yourPoolId }, include: [Format, Player] })
        const format = yourPool.format
        const opponentsPool = await Pool.findOne({ where: { id: opponentsPoolId, status: {[Op.not]: 'inactive'}}, include: Player })
        
        if (isConfirmed) {
            if (!opponentsPool) {
                await yourPool.update({ status: 'pending' })
                console.log(`Sorry, ${yourPool.playerName}, your potential opponent either found a match or left the pool while waiting for you to confirm. I'll put you back in the Rated ${format.name} Format ${format.emoji} Pool.`)
                return interaction.user.send(`Sorry, your potential opponent either found a match or left the pool while waiting for you to confirm. I'll put you back in the Rated ${format.name} Format ${format.emoji} Pool.`)
            }
    
            const server = await Server.findOne({ where: { id: '414551319031054346' }})
            const channelId = format.channelId
            const guild = client.guilds.cache.get(serverId)
            const channel = guild.channels.cache.get(channelId)
            const player = yourPool.player
            const playerDiscordName =  player.discordName
            const playerGlobalName = player.globalName
            const opponent = opponentsPool.player
            const opponentDiscordName =  opponent.discordName
            const opponentGlobalName = opponent.globalName
            const opposingMember = await guild.members.fetch(opponent.discordId)

            console.log(`New Pairing!`)

            opposingMember.user.send(
                `New pairing for Rated ${format.name} Format ${format.emoji}!` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${channelId}>` +
                `\nDiscord Name: ${playerGlobalName ? `${playerGlobalName} (${playerDiscordName})` : playerDiscordName}` +
                `\n${`Duelingbook Name: ${player.duelingBookName}`}`
            ).catch((err) => console.log(err))
            
            interaction.user.send(
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
                await rPTD.update({ status: 'inactive' })
            }
    
            const allStats = await Stats.findAll({ 
                where: {
                    formatId: format.id, 
                    games: { [Op.gte]: 3 },
                    serverId: '414551319031054346',
                    isActive: true,
                    '$player.isHidden$': false
                },
                include: [Player],
                order: [['elo', 'DESC']] 
            }) || []
    
            const p1Index = allStats.findIndex((s) => s.playerId === player.id)
            const p1Rank = p1Index >= 0 ? `#${p1Index + 1} ` : ''
            const p2Index = allStats.findIndex((s) => s.playerId === opponent.id)
            const p2Rank = p2Index >= 0 ? `#${p2Index + 1} ` : ''
    
            const content = `New Rated ${format.name} Format ${format.emoji} Match: ${p2Rank}<@${opponent.discordId}> (DB: ${opponent.duelingBookName}) vs. ${p1Rank}<@${player.discordId}> (DB: ${player.duelingBookName}). Good luck to both duelists.`
            console.log(`content:`, content)
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
        const index = !isNaN(parseInt(response)) ? parseInt(response) - 1 : null
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
    console.log('message.createdAt', message.createdAt)
    console.log('message.createdAt.getTimezoneOffset()', message.createdAt?.getTimezoneOffset())

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
                cleanName: {[Op.substring]: response },
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
export const getPreviousRatedDeck = async (user, yourRatedDecks, format) => {   
    if (!yourRatedDecks || !yourRatedDecks.length) return false
    const options = yourRatedDecks.map((yRD, index) => `(${index + 1}) - ${yRD.name} - <https://formatlibrary.com/deck-builder/${yRD.id}>`)
    options.push(`(${options.length + 1}) - Submit a New Deck`)

    const filter = m => m.author.id === user.id
    const message = await user.send({ content: `Which of your ${format.name} Format ${format.emoji} Rated deck(s) would you like to use?\n${options.join('\n')}`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 5 * 60 * 1000
    }).then(async (collected) => {
        const response = collected.first().content
        const index = !isNaN(parseInt(response)) ? parseInt(response) - 1 : null
        const previousRatedDeck = response.includes('new') || index === options.length ? false : 
            index >= 0 ? yourRatedDecks[index] :
            false

        return previousRatedDeck
    }).catch((err) => {
        console.log(err)
        user.send({ content: `Sorry, time's up. Please try again.`}).catch((err) => console.log(err))
        return false
    })
}

//GET NEW RATED DECK
export const getNewRatedDeck = async (user, player, format) => {   
    const filter = m => m.author.id === user.id
    const message = await user.send({ content: `Please provide a **__YDK File__** for your Rated Deck.`}).catch((err) => console.log(err))
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
            const issues = await getIssues(deckArr, format)
            if (!issues) return false

            const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards } = issues
            if (!illegalCards || !forbiddenCards || !limitedCards || !semiLimitedCards || !unrecognizedCards) return false
            
            if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length) {
                let response = [`I'm sorry, ${user.username}, your deck is not legal. ${emojis.mad}`]
                if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
                if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
                if (limitedCards.length) response = [...response, `\nThe following cards are limited:`, ...limitedCards]
                if (semiLimitedCards.length) response = [...response, `\nThe following cards are semi-limited:`, ...semiLimitedCards]
            
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
        } else {
            user.send({ content: "Sorry, I only accept YDK Files or YDKe Codes."}).catch((err) => console.log(err))    
            return false  
        }
    }).catch((err) => {
        console.log(err)
        user.send({ content: `Sorry, time's up. Please try again.`}).catch((err) => console.log(err))
        return false
    })
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
            const channel = guild.channels.cache.get(format.channelId)
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
            `\nChannel: <#${format.channelId}}>` +
            `\nDiscord Name: ${opponentGlobalName ? `${opponentGlobalName} (${opponentDiscordName})` : opponentDiscordName}` +
            `\nDuelingbook Name: ${opponent.duelingBookName}`
        ).catch((err) => console.log(err))
    
        user2.send(
            `New pairing for Rated ${format.name} Format! ${format.emoji}` +
            `\nServer: Format Library ${emojis.FL}` +
            `\nChannel: <#${format.channelId}>` +
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
        const channel = guild.channels.cache.get(format.channelId)
    
        const allStats = await Stats.findAll({ 
            where: {
                formatId: format.id, 
                games: { [Op.gte]: 3 },
                serverId: '414551319031054346',
                isActive: true,
                '$player.isHidden$': false
            },
            include: [Player],
            order: [['elo', 'DESC']] 
        }) || []
    
        const p1Index = allStats.findIndex((s) => s.playerId === player.id)
        const p1Rank = p1Index >= 0 ? `#${p1Index + 1} ` : ''
        const p2Index = allStats.findIndex((s) => s.playerId === opponent.id)
        const p2Rank = p2Index >= 0 ? `#${p2Index + 1} ` : ''
        const content = `New Rated ${format.name} Format ${format.emoji} Match: ${p2Rank}<@${opponent.discordId}> (DB: ${opponent.duelingBookName}) vs. ${p1Rank}<@${player.discordId}> (DB: ${player.duelingBookName}). Good luck to both duelists.`
        console.log(`content`, content)
        return channel.send({ content: content })   
    } catch (err) {
        console.log(err)
    }
}

// GET ELO K-FACTOR
export const getEloKFactor = (games, bestElo) => {
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

// UPDATE GENERAL STATS
export const updateGeneralStats = async (winnerStats, loserStats) => {
    const winnerKFactor = getEloKFactor(winnerStats.games, winnerStats.bestElo)
    const loserKFactor = getEloKFactor(loserStats.games, loserStats.bestElo)
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
    const winnerKFactor = getEloKFactor(winnerStats.seasonalGames, winnerStats.bestSeasonalElo)
    const loserKFactor = getEloKFactor(loserStats.seasonalGames, loserStats.bestSeasonalElo)
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