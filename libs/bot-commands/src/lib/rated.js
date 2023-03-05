
import { SlashCommandBuilder } from 'discord.js'
import { Deck, Match, Membership, Player, Pool, Server, Stats } from '@fl/models'
import { Op } from 'sequelize'
import { getRatedFormat, getNewRatedDeck, getPotentialPairConfirmation, getPreviousRatedDeck } from '@fl/bot-functions'
import { getIssues } from '@fl/bot-functions'
import { askForDBName } from '@fl/bot-functions'
import { drawDeck } from '@fl/bot-functions'
import axios from 'axios'
import { client } from '../client'
import { emojis } from '@fl/bot-emojis'

const getRatedInformation = async (interaction, player) => {
    const format = await getRatedFormat(interaction)
    if (!format) return await interaction.user.send({ content: `Please specify a valid format.`})
    
    const yourServers = [...await Membership.findAll({ 
        where: { 
            playerId: player.id,
            active: true,
            '$server.access$': {[Op.or]: ['full', 'partner', 'affiliate']},
            '$server.internalLadder$': false,
            '$server.format$': {[Op.or]: [format.name, null]}
        }, 
        include: Server,
        order: [[Server, 'createdAt', 'ASC']] 
    })].map((m) => m.server) || []
    
    const yourGuildIds = yourServers.map((s) => s.id) || []

    if (!yourGuildIds.length) return await interaction.user.send(`Sorry, you are not a member of a server that supports rated play for ${format.name} Format. ${server.emoji || format.emoji}`)
    const dbName = player.duelingBook ? player.duelingBook : await askForDBName(interaction.user, player)
    if (!dbName) return

    const yourRatedDecks = await Deck.findAll({
        where: {
            formatName: format.name,
            playerId: player.id,
            url: {[Op.not]: null}
        },
        order: [['updatedAt', 'DESC']],
        limit: 20
    }) || []

    let ratedDeck = await getPreviousRatedDeck(interaction.user, yourRatedDecks, format)
    if (ratedDeck) {
        try {
            const id = ratedDeck.url.slice(ratedDeck.url.indexOf('?id=') + 4)
            const {data} = await axios.get(`https://www.duelingbook.com/php-scripts/load-deck.php/deck?id=${id}`)
            if (data) {
                const main = data.main.map((e) => e.serial_number)
                const side = data.side.map((e) => e.serial_number)
                const extra = data.extra.map((e) => e.serial_number)
                const deckArr = [...main, ...side, ...extra]
                const issues = await getIssues(deckArr, format)
                const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards } = issues
                if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length) {      
                    let response = [`I'm sorry, ${interaction.user.username}, your deck is not legal for ${format.name} Format. ${format.emoji}`]
                    if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
                    if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
                    if (limitedCards.length) response = [...response, `\nThe following cards are limited:`, ...limitedCards]
                    if (semiLimitedCards.length) response = [...response, `\nThe following cards are semi-limited:`, ...semiLimitedCards]
                    
                    for (let i = 0; i < response.length; i += 50) {
                        if (response[i+50] && response[i+50].startsWith("\n")) {
                            interaction.user.send({ content: response.slice(i, i+51).join('\n').toString()}).catch((err) => console.log(err))
                            i++
                        } else {
                            interaction.user.send({ content: response.slice(i, i+50).join('\n').toString()}).catch((err) => console.log(err))
                        }
                    }

                    return
                } else if (unrecognizedCards.length) {
                    let response = `I'm sorry, ${interaction.user.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
                    response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
                    return await interaction.user.send({ content: response.toString() }).catch((err) => console.log(err))
                } else {
                    const ydk = ['created by...', '#main', ...main, '#extra', ...extra, '!side', ...side, ''].join('\n')
                    ratedDeck.ydk = ydk
                    await ratedDeck.save()
                }
            }
        } catch (err) {
            console.log(err)
            return await interaction.user.send(`Unable to process deck list. Please try again.`)
        }
    } else {
        ratedDeck = await getNewRatedDeck(interaction.user, player, format)
    }
    
    if (!ratedDeck || !ratedDeck.ydk) return
    const deckAttachments = await drawDeck(ratedDeck.ydk) || []
    interaction.user.send({content: `Okay, ${interaction.user.username}, you will be using this deck if you are paired:` , files: [...deckAttachments] })
    
    const count = await Pool.count({
        where: {
            name: player.name,
            format: format.name,
            playerId: player.id
        }
    })

    const pool = count ? await Pool.findOne({
        where: {
            name: player.name,
            format: format.name,
            playerId: player.id
        }
    }) : await Pool.create({
        name: player.name,
        format: format.name,
        status: 'pending',
        playerId: player.id
    })

    try {
        const potentialPairs = await Pool.findAll({ 
            where: { 
                playerId: {[Op.not]: player.id },
                status: 'pending',
                format: format.name
            },
            include: Player,
            order: [['createdAt', 'ASC']]
        }) || []

        if (!potentialPairs.length && !count) {
            for (let y = 0; y < yourServers.length; y++) {
                try {
                    const server = yourServers[y]
                    const guild = client.guilds.cache.get(server.id)
                    const channelId = server.id === '414551319031054346' ? format.channel : server.ratedChannel
                    const channel = guild.channels.cache.get(channelId)
                    if (!channel) continue
                    const tag = server.id === '414551319031054346' ? `<@&${format.grinders}> ` : ''
                    channel.send(`${tag}Somebody joined the ${format.name} Format ${format.emoji} Rated Pool! ${emojis.megaphone}`)
                } catch (err) {
                    console.log(err)
                }
            }

            return await interaction.user.send(`You've joined the ${format.name} Rated Pool. ${format.emoji} You'll receive a DM when you're paired.`)
        } else if (!potentialPairs.length && count) {
            return await interaction.user.send(`You've resubmitted your deck for the ${format.name} Rated Pool. ${format.emoji} You'll receive a DM when you're paired.`)
        }

        for (let i = 0; i < potentialPairs.length; i++) {
            const potentialPair = potentialPairs[i]
            const ppid = potentialPair.playerId
            const opponentsGuildIds = [...await Membership.findAll({ 
                where: { 
                    playerId: ppid,
                    active: true,
                    '$server.access$': {[Op.or]: ['full', 'partner', 'affiliate']},
                    '$server.internalLadder$': false,
                    '$server.format$': {[Op.or]: [format.name, null]}
                },
                include: Server,
                order: [[Server, 'createdAt', 'ASC']]
            })].map((m) => m.serverId) || []

            let commonGuildId
            for (let j = 0; j < opponentsGuildIds.length; j++) {
                const guildId = opponentsGuildIds[j]
                if (yourGuildIds.includes(guildId)) {
                    commonGuildId = guildId
                    break
                }
            }

            if (!commonGuildId) continue
            const now = new Date()
            const twoMinutesAgo = new Date(now - (2 * 60 * 1000))
            const oneHourAgo = new Date(now - (60 * 60 * 1000))

            const yourRecentOpponents = [...await Match.findAll({
                where: {
                    [Op.or]: {
                        winnerId: player.id,
                        loserId: player.id
                    },
                    formatName: format.name,
                    createdAt: {[Op.gte]: oneHourAgo }
                }
            })].map((m) => {
                if (player.id === m.winnerId) {
                    return m.loserId
                } else {
                    return m.winnerId
                }
            }) || []

            if (yourRecentOpponents.includes(potentialPair.playerId)) {
                continue
            } else if (potentialPair.updatedAt < twoMinutesAgo) {
                getPotentialPairConfirmation(client, format, potentialPair, pool, commonGuildId)
                continue
            } else {
                const commonServer = await Server.findOne({ where: { id: commonGuildId }})
                const channelId = commonServer.ratedChannel || format.channel
                const guild = client.guilds.cache.get(commonGuildId)
                const channel = guild.channels.cache.get(channelId)
                const opponent = potentialPair.player
                const opposingMember = await guild.members.fetch(opponent.discordId)

                opposingMember.user.send(
                    `New pairing for Rated ${format.name} Format ${format.emoji}!` +
                    `\nServer: ${commonServer.name} ${commonServer.logo}` +
                    `\nChannel: <#${channelId}>` +
                    `\nDiscord: ${player.discordName}#${player.discriminator}` +
                    `\nDuelingBook: ${player.duelingBook}`
                ).catch((err) => console.log(err))

                interaction.user.send(
                    `New pairing for Rated ${format.name} Format ${format.emoji}!` + 
                    `\nServer: ${commonServer.name} ${commonServer.logo}` + 
                    `\nChannel: <#${channelId}>` +
                    `\nDiscord: ${opponent.discordName}#${opponent.discriminator}` +
                    `\nDuelingBook: ${opponent.duelingBook}`
                ).catch((err) => console.log(err))
                
                await potentialPair.destroy()
                await pool.destroy()

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
                        format: { [Op.iLike]: format.name }, 
                        games: { [Op.gte]: 3 },
                        serverId: '414551319031054346',
                        '$player.hidden$': false
                    },
                    include: [Player],
                    order: [['elo', 'DESC']] 
                }) || []
    
                const p1Index = allStats.findIndex((s) => s.playerId === player.id)
                const p1Rank = p1Index >= 0 ? `#${p1Index + 1} ` : ''
                const p2Index = allStats.findIndex((s) => s.playerId === opponent.id)
                const p2Rank = p2Index >= 0 ? `#${p2Index + 1} ` : ''
    
                return channel.send({ content: `New Rated ${format.name} Format ${format.emoji} Match: ${p2Rank}<@${opponent.discordId}> (DB: ${opponent.duelingBook}) vs. ${p1Rank}<@${player.discordId}> (DB: ${player.duelingBook}). Good luck to both duelists.`})   
            }
        }
    } catch (err) {
        console.log(err)            
    }

    if (!count) {
        for (let y = 0; y < yourServers.length; y++) {
            try {
                const server = yourServers[y]
                const guild = client.guilds.cache.get(server.id)
                const channelId = server.id === '414551319031054346' ? format.channel : server.ratedChannel
                const channel = guild.channels.cache.get(channelId)
                const tag = server.id === '414551319031054346' ? `<@&${format.grinders}> ` : ''
                channel.send(`${tag}Somebody joined the ${format.name} Format ${format.emoji} Rated Pool! ${emojis.megaphone}`)
            } catch (err) {
                console.log(err)
            }
        }

        return await interaction.user.send(`You've joined the ${format.name} Rated Pool. ${format.emoji} You'll receive a DM when you're paired.`)
    } else {
        return await interaction.user.send(`You've resubmitted your deck for the ${format.name} Rated Pool. ${format.emoji} You'll receive a DM when you're paired.`)
    }
    
}

export default {
    data: new SlashCommandBuilder()
        .setName('rated')
        .setDescription('Join the rated pool for any format. 🎮'),
    async execute(interaction) {
        if (interaction.guildId) return await interaction.reply(`Try using **/rated** by DM'ing it to me.`)
        const player = await Player.findOne({ where: { discordId: interaction.user.id } })
        if (!player) return await interaction.reply(`You are not in the database. Please join the Format Library Discord server to register.`)
        interaction.reply('🥸')
        return getRatedInformation(interaction, player)
    }
}
