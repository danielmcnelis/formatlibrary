
import { SlashCommandBuilder } from 'discord.js'
import { Deck, Match, Membership, Pairing, Player, Pool, Server, Stats } from '@fl/models'
import { Op } from 'sequelize'
import { lookForPotentialPairs, getRatedFormat, getNewRatedDeck, getRatedConfirmation, getPreviousRatedDeck } from '@fl/bot-functions'
import { getIssues } from '@fl/bot-functions'
import { askForSimName } from '@fl/bot-functions'
import { drawDeck } from '@fl/bot-functions'
import axios from 'axios'
import { client } from '../client'
import { emojis } from '@fl/bot-emojis'

const getRatedInformation = async (interaction, player) => {
    try {
        const format = await getRatedFormat(interaction)
        if (!format) return await interaction.user.send({ content: `Please specify a valid format.`})
        const access = format.channelId ? 'full' : 'partner'

        const yourServers = [...await Membership.findAll({ 
            where: { 
                playerId: player.id,
                isActive: true,
                '$server.access$': access,
                '$server.hasInternalLadder$': false,
                '$server.formatName$': {[Op.or]: [format.name, null]}
            }, 
            include: Server,
            order: [[Server, 'createdAt', 'ASC']] 
        })].map((m) => m.server) || []
        
        const yourGuildIds = yourServers.map((s) => s.id) || []

        if (!yourGuildIds.length) return await interaction.user.send(`Sorry, you are not a member of a server that supports rated play for ${format.name} Format. ${format.emoji}`)
        const simName = player.duelingBookName || await askForSimName(interaction.user, player, 'DuelingBook')
        if (!simName) return

        const yourRatedDecks = await Deck.findAll({
            where: {
                formatName: format.name,
                builderId: player.id,
                origin: 'user'
            },
            order: [['updatedAt', 'DESC']],
            limit: 20
        }) || []

        let ratedDeck
        ratedDeck = await getPreviousRatedDeck(interaction.user, yourRatedDecks, format)
        
        if (!ratedDeck) {
            ratedDeck = await getNewRatedDeck(interaction.user, player, format)
        }
        
        if (!ratedDeck || !ratedDeck.ydk) return
        const deckAttachments = await drawDeck(ratedDeck.ydk) || []

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
            playerName: player.name,
            formatName: format.name,
            formatId: format.id,
            status: 'pending',
            playerId: player.id,
            deckFile: ratedDeck.ydk || ratedDeck.opdk
        })

        lookForPotentialPairs(client, interaction, pool, player, format)
        
        if (!count) {
            try {
                const guild = client.guilds.cache.get('414551319031054346')
                const channel = guild.channels.cache.get(format.channelId)
                channel.send(`Somebody joined the ${format.name} ${format.emoji} Rated Pool! ${emojis.megaphone}`)
            } catch (err) {
                console.log(err)
            }

            return await interaction.user.send(`You've joined the ${format.name} Rated Pool. ${format.emoji} You'll receive a DM when you're paired.`)
        } else {
            return await interaction.user.send(`You've resubmitted your deck for the ${format.name} Rated Pool. ${format.emoji} You'll receive a DM when you're paired.`)
        }
    } catch (err) {
        console.log(err)
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName('rated')
        .setDescription('Join the rated pool for any format. 🎮'),
    async execute(interaction) {
        try {
            if (interaction.guildId) return await interaction.reply(`Try using **/rated** by DM'ing it to me.`)
            const player = await Player.findOne({ where: { discordId: interaction.user.id } })
            if (!player) return await interaction.reply(`You are not in the database. Please join the Format Library Discord server to register.`)
            if (player.isHidden) return await interaction.reply(`You are not allowed is not allowed to play in the Format Library rated system.`)
            interaction.reply('🥸')
            return getRatedInformation(interaction, player)
        } catch (err) {
            console.log(err)
        }
    }
}
