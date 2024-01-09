
import { SlashCommandBuilder } from 'discord.js'
import { Deck, Match, Membership, OPCard, OPDeck, Pairing, Player, Pool, Server, Stats } from '@fl/models'
import { Op } from 'sequelize'
import { getRatedFormat, getNewRatedDeck, getNewOPRatedDeck, getRatedConfirmation, getPreviousRatedDeck } from '@fl/bot-functions'
import { getIssues } from '@fl/bot-functions'
import { askForSimName } from '@fl/bot-functions'
import { drawDeck, drawOPDeck } from '@fl/bot-functions'
import axios from 'axios'
import { client } from '../client'
import { emojis } from '@fl/bot-emojis'

const getRatedInformation = async (interaction, player) => {
    const format = await getRatedFormat(interaction)
    if (!format) return await interaction.user.send({ content: `Please specify a valid format.`})
    const access = format.channel ? 'full' : 'partner'

    const yourServers = [...await Membership.findAll({ 
        where: { 
            playerId: player.id,
            active: true,
            '$server.access$': access,
            '$server.internalLadder$': false,
            '$server.format$': {[Op.or]: [format.name, null]}
        }, 
        include: Server,
        order: [[Server, 'createdAt', 'ASC']] 
    })].map((m) => m.server) || []
    
    const yourGuildIds = yourServers.map((s) => s.id) || []

    if (!yourGuildIds.length) return await interaction.user.send(`Sorry, you are not a member of a server that supports rated play for ${format.name} Format. ${format.emoji}`)
    const simName = format.category === 'OP' ? player.opTcgSim || await askForSimName(interaction.user, player, 'OPTCGSim') :
        player.duelingBook || await askForSimName(interaction.user, player, 'DuelingBook')

    if (!simName) return

    const yourRatedDecks = await Deck.findAll({
        where: {
            formatName: format.name,
            playerId: player.id,
            origin: 'user'
        },
        order: [['updatedAt', 'DESC']],
        limit: 20
    }) || []

    let ratedDeck
    ratedDeck = await getPreviousRatedDeck(interaction.user, yourRatedDecks, format)
    
    if (!ratedDeck) {
        if (format.category !== 'OP') {
            ratedDeck = await getNewRatedDeck(interaction.user, player, format)
        } else {
            ratedDeck = await getNewOPRatedDeck(interaction.user, player, format)
        }
    }
    
    if (!ratedDeck || (!ratedDeck.ydk && !ratedDeck.opdk)) return
    const deckAttachments = format.category === 'OP' ? await drawOPDeck(ratedDeck.opdk) || [] : await drawDeck(ratedDeck.ydk) || []

    deckAttachments.forEach((attachment, index) => {
        if (index === 0) {
            interaction.user.send({ content: `Okay, ${interaction.user.username}, you will be using this deck if you are paired:`, files: [attachment] }).catch((err) => console.log(err))
        } else {
            interaction.user.send({ files: [attachment] }).catch((err) => console.log(err))
        }
    })
    
    const count = await Pool.count({
        where: {
            formatId: format.id,
            playerId: player.id
        }
    })

    const pool = count ? await Pool.findOne({
        where: {
            formatId: format.id,
            playerId: player.id
        }
    }) : await Pool.create({
        name: player.globalName || player.discordName,
        formatName: format.name,
        formatId: format.id,
        status: 'pending',
        playerId: player.id,
        deckFile: ratedDeck.ydk || ratedDeck.opdk
    })

    try {
        const potentialPairs = await Pool.findAll({ 
            where: { 
                playerId: {[Op.not]: player.id },
                status: 'pending',
                formatId: format.id
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
                    channel.send(`Somebody joined the ${format.name} ${format.emoji} Rated Pool! ${emojis.megaphone}`)
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
            const access = format.channel ? 'full' : 'partner'
            const opponentsGuildIds = [...await Membership.findAll({ 
                where: { 
                    playerId: ppid,
                    active: true,
                    '$server.access$': access,
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
            const tenMinutesAgo = new Date(now - (10 * 60 * 1000))

            const yourRecentOpponents = [...await Match.findAll({
                where: {
                    [Op.or]: {
                        winnerId: player.id,
                        loserId: player.id
                    },
                    formatName: format.name,
                    createdAt: {[Op.gte]: tenMinutesAgo }
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
                getRatedConfirmation(client, potentialPair.player, player, format)
                continue
            } else {
                const commonServer = await Server.findOne({ where: { id: commonGuildId }})
                const channelId = commonServer.ratedChannel || format.channel
                const guild = client.guilds.cache.get(commonGuildId)
                const channel = guild.channels.cache.get(channelId)
                const playerDiscordUsername =  player.discriminator === '0' ? player.discordName : `${player.discordName}#${player.discriminator}`
                const opponent = potentialPair.player
                const opponentDiscordUsername =  opponent.discriminator === '0' ? opponent.discordName : `${opponent.discordName}#${opponent.discriminator}`
                const opposingMember = await guild.members.fetch(opponent.discordId)

                opposingMember.user.send(
                    `New pairing for Rated ${format.name}${format.category !== 'OP' ? ' Format' : ''} ${format.emoji}!` +
                    `\nServer: ${commonServer.name} ${commonServer.logo}` +
                    `\nChannel: <#${channelId}>` +
                    `\nDiscord: ${player.globalName ? `${player.globalName} (${playerDiscordUsername})` : playerDiscordUsername}` +
                    `\n${format.category !== 'OP' ? `DuelingBook: ${player.duelingBook}` : `OPTCGSim: ${player.opTcgSim}`}`
                ).catch((err) => console.log(err))

                interaction.user.send(
                    `New pairing for Rated ${format.name}${format.category !== 'OP' ? ' Format' : ''} ${format.emoji}!` + 
                    `\nServer: ${commonServer.name} ${commonServer.logo}` + 
                    `\nChannel: <#${channelId}>` +
                    `\nDiscord: ${opponent.globalName ? `${opponent.globalName} (${opponentDiscordUsername})` : opponentDiscordUsername}` +
                    `\n${format.category !== 'OP' ? `DuelingBook: ${opponent.duelingBook}` : `OPTCGSim: ${opponent.opTcgSim}`}`
                ).catch((err) => console.log(err))

                await Pairing.create({
                    formatId: format.id,
                    formatName: format.name,
                    serverId: commonServer.id,
                    serverName: commonServer.name,
                    playerAName: pool.name,
                    playerAId: pool.playerId,
                    deckFileA: pool.deckFile,
                    playerBName: potentialPair.name,
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
                    await rPTD.update({ status: 'inactive' })
                }
    
                const allStats = await Stats.findAll({ 
                    where: {
                        format: { [Op.iLike]: format.name }, 
                        games: { [Op.gte]: 3 },
                        serverId: '414551319031054346',
                        inactive: false,
                        '$player.hidden$': false
                    },
                    include: [Player],
                    order: [['elo', 'DESC']] 
                }) || []
    
                const p1Index = allStats.findIndex((s) => s.playerId === player.id)
                const p1Rank = p1Index >= 0 ? `#${p1Index + 1} ` : ''
                const p2Index = allStats.findIndex((s) => s.playerId === opponent.id)
                const p2Rank = p2Index >= 0 ? `#${p2Index + 1} ` : ''
                const content = format.category === 'OP' ? `New Rated ${format.name} ${format.emoji} Match: ${p2Rank}<@${opponent.discordId}> (OPTCGSim: ${opponent.opTcgSim}) vs. ${p1Rank}<@${player.discordId}> (OPTCGSim: ${player.opTcgSim}). Good luck to both players.` :
                    `New Rated ${format.name} Format ${format.emoji} Match: ${p2Rank}<@${opponent.discordId}> (DB: ${opponent.duelingBook}) vs. ${p1Rank}<@${player.discordId}> (DB: ${player.duelingBook}). Good luck to both duelists.`
    
                return channel.send({ content: content })   
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
                channel.send(`Somebody joined the ${format.name} ${format.emoji} Rated Pool! ${emojis.megaphone}`)
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
        // return await interaction.reply(`All rated pools are currently disabled while DuelingBook fixes an exploit. We will be back soon!`)
        const player = await Player.findOne({ where: { discordId: interaction.user.id } })
        if (player.hidden) return await interaction.reply(`You are not allowed to play rated at this time.`)
        if (!player) return await interaction.reply(`You are not in the database. Please join the Format Library Discord server to register.`)
        interaction.reply('🥸')
        return getRatedInformation(interaction, player)
    }
}
