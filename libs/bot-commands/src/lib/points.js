
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server, Tournament } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { Op } from 'sequelize'
import { isMod, hasPartnerAccess } from '@fl/bot-functions'

export default {
    data: new SlashCommandBuilder()
        .setName('points')
        .setDescription('Mod Only - Edit tournament points system. 👔')
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
                    formatId: format?.id,
                    serverId: server?.id
                },
                limit: 5,
                order: [["createdAt", "DESC"]]
            })

		await interaction.respond(
			tournaments.map(t => ({ name: t.name, value: t.id })),
		)
    },      
    async execute(interaction) {
        await interaction.deferReply()
        const tournamentId = interaction.options.getString('tournament')
        const tournament = await Tournament.findOne({ where: { id: tournamentId }})
        if (!tournament) return await interaction.editReply({ content: `Error: Could not find tournamentId ${tournamentId}.`})	
        if (tournament.type !== 'swiss') return await interaction.editReply({ content: `The points system can only be edited for Swiss tournaments.`})	

        const placeholder1 = tournament.pointsPerMatchWin || '1.0'
        const placeholder2 = tournament.pointsPerMatchTie || '0.0'
        const placeholder3 = tournament.pointsPerBye || '1.0'

		const modal = new ModalBuilder()
            .setCustomId(tournamentId)
            .setTitle('Edit Points System')

            const pointsPerMatchWin = new TextInputBuilder()
                .setCustomId('ppwin')
                .setLabel('Points per match win?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(placeholder1)
                .setRequired(true)

            const pointsPerMatchTie = new TextInputBuilder()
                .setCustomId('pptie')
                .setLabel('Points per match tie?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(placeholder2)
                .setRequired(true)
            
            const pointsPerBye = new TextInputBuilder()
                .setCustomId('ppbye')
                .setLabel('Points per bye?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(placeholder3)
                .setRequired(true)

            const ppmw = new ActionRowBuilder().addComponents(pointsPerMatchWin)
            const ppmt = new ActionRowBuilder().addComponents(pointsPerMatchTie)
            const ppb = new ActionRowBuilder().addComponents(pointsPerBye)
            modal.addComponents(ppmw, ppmt, ppb)
    
        return await interaction.showModal(modal)        
    }
}