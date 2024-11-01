
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server, Tournament } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { Op } from 'sequelize'
import { isMod, hasPartnerAccess } from '@fl/bot-functions'

export default {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Mod Only - Edit general tournament settings. ⚙️')
		.addStringOption(option =>
			option.setName('tournament')
				.setDescription('Enter tournament name or abbreviation')
				.setAutocomplete(true)
                .setRequired(true)
        )
        .setDMPermission(false),    
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return await interaction.editReply({ content: 'You do not have permission to do that.'})

        const tournaments = await Tournament.findAll({
                where: {
                    [Op.or]: {
                        name: {[Op.substring]: focusedValue},
                        abbreviation: {[Op.substring]: focusedValue}
                    },
                    state: {[Op.not]: 'complete'},
                    formatId: format?.id || null,
                    serverId: server?.id || null
                },
                limit: 5,
                order: [["createdAt", "DESC"]]
            })

		await interaction.respond(
			tournaments.map(t => ({ name: t.name, value: t.id })),
		)
    },      
    async execute(interaction) {
        const tournamentId = interaction.options.getString('tournament')
        const tournament = await Tournament.findOne({ where: { id: tournamentId }})
        if (!tournament) return await interaction.reply({ content: `Error: Could not find tournamentId ${tournamentId}.`})	

		const modal = new ModalBuilder()
            .setCustomId(`settings-${tournamentId}`)
            .setTitle('Edit Tournament Settings')

        const name = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('Full name of the tournament?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(tournament.name)
            .setRequired(false)

        const url = new TextInputBuilder()
            .setCustomId('url')
            .setLabel('Challonge URL for the tournament?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(tournament.url)
            .setRequired(false)

        const tournamentType = new TextInputBuilder()
            .setCustomId('type')
            .setLabel('Tournament type? (SW, SE, DE, RR)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(tournament.type)
            .setRequired(false)

        const duration = new TextInputBuilder()
            .setCustomId('ranked')
            .setLabel('Live or Multi-Day? (L, M)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(tournament.isLive ? 'live' : 'multi-day')
            .setRequired(false)

        const ranked = new TextInputBuilder()
            .setCustomId('ranked')
            .setLabel('Ranked or Unranked? (R, U)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(tournament.isUnranked ? 'unranked' : 'ranked')
            .setRequired(false)
        
        const nameRow = new ActionRowBuilder().addComponents(name)
        const urlRow = new ActionRowBuilder().addComponents(url)
        const durationRow = new ActionRowBuilder().addComponents(duration)
        
        if (tournament.state === 'underway') {
            modal.addComponents(nameRow, urlRow)
        } else {
            const tournamentTypeRow = new ActionRowBuilder().addComponents(tournamentType)
            const rankedRow = new ActionRowBuilder().addComponents(ranked)
            modal.addComponents(nameRow, urlRow, tournamentTypeRow, durationRow, rankedRow)
        }

        return await interaction.showModal(modal)        
    }
}