
import { SlashCommandBuilder } from 'discord.js'
import { Deck, Format, Match, Membership, Pairing, Player, Pool, Server, Stats } from '@fl/models'
import { Op } from 'sequelize'
import { askForSimName, drawDeck, lookForPotentialPairs, getRatedFormat, getNewRatedDeck, getPreviousRatedDeck } from '@fl/bot-functions'
// import axios from 'axios'
import { client } from '../client'
import { emojis } from '@fl/bot-emojis'

const getRatedInformation = async (interaction, player, format) => {
    try {
        const access = format.hostedOnFl ? 'full' : 'partner'

        const membership = await Membership.findOne({ 
            where: { 
                playerId: player.id,
                isActive: true,
                '$server.access$': access,
                '$server.hasInternalLadder$': false,
                [Op.or]: {
                    '$server.access$': 'full',
                    '$server.formatName$': format.name
                }
            },
            include: Server
        })

        const server = membership?.server
        if (!membership || !server) return await interaction.user.send(`Sorry, you are not a member of a server that supports rated play for ${format.name} Format. ${format.emoji}`)
        const guild = client.guilds.cache.get(server?.id)
        const channel = guild.channels.cache.get(format.channelId) || guild.channels.cache.get(format.categoryChannelId)
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
        ratedDeck = await getPreviousRatedDeck(interaction.user, player, yourRatedDecks, format)
        
        if (!yourRatedDecks.length) {
            ratedDeck = await getNewRatedDeck(interaction.user, player, format)
        } else if (!ratedDeck || !ratedDeck.ydk) {
            return
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

        await pool.update({ wasInactive: false })
        lookForPotentialPairs(interaction, pool, player, format, server, guild, channel)
        
        if (!count) {
            try {
                channel.send(`Somebody joined the ${format.name} ${format.emoji} Rated Pool! ${emojis.megaphone}`)
            } catch (err) {
                console.log(err)
            }

            return await interaction.user.send(`You've joined the ${format.name} Rated Pool. ${format.emoji} You'll receive a DM when you're paired.`)
        } else {
            return await interaction.user.send(`You've resubmitted your deck for the ${format.name} Rated Pool. ${format.emoji} You'll receive a DM when you're paired.`)
        }
    } catch (err) {
        return console.log(err)
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName('rated')
        .setDescription('Join the rated pool for any format. 🎮')
		.addStringOption(option =>
			option.setName('format')
				.setDescription('Enter format name')
				.setAutocomplete(true)
                .setRequired(true)
        ),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused()
        const formats = await Format.findAll({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: focusedValue + '%'},
                    abbreviation: {[Op.iLike]: focusedValue + '%'}
                },
                category: {[Op.notIn]: ['discontinued', 'multiple']},
                isHighlander: false
            },
            limit: 4,
            order: [["useSeasonalElo", "DESC"], ["sortPriority", "ASC"], ["isSpotlight", "DESC"], ["name", "ASC"]]
        }) 
        await interaction.respond(
            formats.map(f => ({ name: f.name, value: f.name })),
        )
    },
    async execute(interaction) {
        try {
            await interaction.deferReply()
            if (interaction.guildId) return await interaction.editReply(`Try using **/rated** by DM'ing it to me.`)
            const player = await Player.findOne({ where: { discordId: interaction.user.id } })
            if (!player) return await interaction.editReply(`You are not in the database. Please join the Format Library Discord server to register.`)
            if (player.isHidden) return await interaction.editReply(`You are not allowed is not allowed to play in the Format Library rated system.`)
            const formatName = interaction.options.getString('format')

            const format = await Format.findOne({
                where: {
                    name: {[Op.iLike]: formatName + '%'}
                },
                order: [["useSeasonalElo", "DESC"], ["isPopular", "DESC"], ["isSpotlight", "DESC"], ["name", "ASC"]]
            })

            if (!format) {
                if (formatName) {
                    await interaction.editReply(`Hmm... I could not find a format called "${formatName}".`)
                    return getRatedFormat(interaction)
                } else {
                    return getRatedFormat(interaction)
                }
            } else {
                await interaction.editReply(`So, you want to play ${format.name} Format. ${format.emoji}`)
                return getRatedInformation(interaction, player, format)
            }
        } catch (err) {
            console.log(err)
        }
    }
}
