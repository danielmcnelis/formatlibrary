
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server, Tournament } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { Op } from 'sequelize'
import { isMod, hasPartnerAccess } from '@fl/bot-functions'

export default {
    data: new SlashCommandBuilder()
        .setName('tiebreakers')
        .setDescription('Mod Only - Edit tournament tie-breakers. 👔')
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
        if (tournament.type !== 'swiss') return await interaction.reply({ content: `Tie-breakers can only be edited for Swiss tournaments.`})	

        const placeholder1 = tournament.tieBreakerOne === 'median buchholz' ? 'Median-Buchholz (MB)' :
            tournament.tieBreakerOne === 'wins vs tied participants' ? 'Wins vs Tied Participants (WVT)' :
            tournament.tieBreakerOne === 'points difference' ? 'Points Difference (PD)' :
            tournament.tieBreakerOne === 'opponents win percentage' ? `Opponent's Win Percentage (OWP)` :
            tournament.tieBreakerOne === 'opponents opponent win percentage' ? `Opponent's Opponent Win Percentage (OOWP)` :
            'Median-Buchholz (MB)'

        const placeholder2 = tournament.tieBreakerTwo === 'median buchholz' ? 'Median-Buchholz (MB)' :
            tournament.tieBreakerTwo === 'wins vs tied participants' ? 'Wins vs Tied Participants (WVT)' :
            tournament.tieBreakerTwo === 'points difference' ? 'Points Difference (PD)' :
            tournament.tieBreakerTwo === 'opponents win percentage' ? `Opponent's Win Percentage (OWP)` :
            tournament.tieBreakerTwo === 'opponents opponent win percentage' ? `Opponent's Opponent Win Percentage (OOWP)` :
            'Wins vs Tied Participants (WVT)'

        const placeholder3 = tournament.tieBreakerThree === 'median buchholz' ? 'Median-Buchholz (MB)' :
            tournament.tieBreakerThree === 'wins vs tied participants' ? 'Wins vs Tied Participants (WVT)' :
            tournament.tieBreakerThree === 'points difference' ? 'Points Difference (PD)' :
            tournament.tieBreakerThree === 'opponents win percentage' ? `Opponent's Win Percentage (OWP)` :
            tournament.tieBreakerThree === 'opponents opponent win percentage' ? `Opponent's Opponent Win Percentage (OOWP)` :
            'None (NONE)'

		const modal = new ModalBuilder()
            .setCustomId(`tiebreakers-${tournamentId}`)
            .setTitle('Edit Tie-Breakers')

            const tieBreakerOne = new TextInputBuilder()
                .setCustomId('tb1')
                .setLabel('Tie breaker #1? (MB, WVT, PD, OWP, OOWP)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(placeholder1)
                .setRequired(false)

            const tieBreakerTwo = new TextInputBuilder()
                .setCustomId('tb2')
                .setLabel('Tie breaker #2? (MB, WVT, PD, OWP, OOWP)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(placeholder2)
                .setRequired(false)

            const tieBreakerThree = new TextInputBuilder()
                .setCustomId('tb3')
                .setLabel('Tie breaker #3? (MB, WVT, NONE, PD, OWP, OOWP)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(placeholder3)
                .setRequired(false)
            
            const tb1Row = new ActionRowBuilder().addComponents(tieBreakerOne)
            const tb2Row = new ActionRowBuilder().addComponents(tieBreakerTwo)
            const tb3Row = new ActionRowBuilder().addComponents(tieBreakerThree)
            modal.addComponents(tb1Row, tb2Row, tb3Row)
    
        return await interaction.showModal(modal)        
    }
}