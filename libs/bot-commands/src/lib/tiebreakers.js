
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server, Tournament } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { Op } from 'sequelize'
import { isModerator, hasPartnerAccess } from '@fl/bot-functions'

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
        try {
            const focusedValue = interaction.options.getFocused()
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            const format = await Format.findByServerOrChannelId(server, interaction.channelId)
            if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            if (!isModerator(server, interaction.member)) return await interaction.editReply({ content: 'You do not have permission to do that.'})

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
        } catch (err) {
            console.log(err)
        }
    },      
    async execute(interaction) {
        try {
            const tournamentId = interaction.options.getString('tournament')
            const tournament = await Tournament.findOne({ where: { id: tournamentId }})
            if (!tournament) return await interaction.reply({ content: `Error: Could not find tournamentId ${tournamentId}.`})	
            if (tournament.type !== 'swiss') return await interaction.reply({ content: `Tie-breakers can only be edited for Swiss tournaments.`})	

            const placeholder1 = tournament.tieBreaker1 === 'median buchholz' ? 'Median-Buchholz (MB)' :
                tournament.tieBreaker1 === 'match wins vs tied' ? 'Wins vs Tied Participants (WVT)' :
                tournament.tieBreaker1 === 'points difference' ? 'Points Difference (PD)' :
                tournament.tieBreaker1 === 'opponents win percentage' ? `Opponents' Win Percentage (OWP)` :
                tournament.tieBreaker1 === 'opponents opponents win percentage' ? `Opponents' Opponents' Win Percentage (OOWP)` :
                `Opponents' Win Percentage (OWP)`

            const placeholder2 = tournament.tieBreaker2 === 'median buchholz' ? 'Median-Buchholz (MB)' :
                tournament.tieBreaker2 === 'match wins vs tied' ? 'Wins vs Tied Participants (WVT)' :
                tournament.tieBreaker2 === 'points difference' ? 'Points Difference (PD)' :
                tournament.tieBreaker2 === 'opponents win percentage' ? `Opponents' Win Percentage (OWP)` :
                tournament.tieBreaker2 === 'opponents opponents win percentage' ? `Opponents' Opponents' Win Percentage (OOWP)` :
                `Opponents' Opponents' Win Percentage (OOWP)`

            const placeholder3 = tournament.tieBreaker3 === 'median buchholz' ? 'Median-Buchholz (MB)' :
                tournament.tieBreaker3 === 'match wins vs tied' ? 'Wins vs Tied Participants (WVT)' :
                tournament.tieBreaker3 === 'points difference' ? 'Points Difference (PD)' :
                tournament.tieBreaker3 === 'opponents win percentage' ? `Opponents' Win Percentage (OWP)` :
                tournament.tieBreaker3 === 'opponents opponents win percentage' ? `Opponents' Opponents' Win Percentage (OOWP)` :
                'None (N/A)'

            const modal = new ModalBuilder()
                .setCustomId(`tiebreakers-${tournamentId}`)
                .setTitle('Edit Tie-Breakers')

                const tieBreakerOne = new TextInputBuilder()
                    .setCustomId('tb1')
                    .setLabel('Tie breaker #1? (OWP, OOWP, MB, WVT, PD)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(placeholder1)
                    .setRequired(false)

                const tieBreakerTwo = new TextInputBuilder()
                    .setCustomId('tb2')
                    .setLabel('Tie breaker #2? (OWP, OOWP, MB, WVT, PD)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(placeholder2)
                    .setRequired(false)

                const tieBreakerThree = new TextInputBuilder()
                    .setCustomId('tb3')
                    .setLabel('Tie breaker #3? (OWP, OOWP, MB, WVT, PD, N/A)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(placeholder3)
                    .setRequired(false)
                
                const tb1Row = new ActionRowBuilder().addComponents(tieBreakerOne)
                const tb2Row = new ActionRowBuilder().addComponents(tieBreakerTwo)
                const tb3Row = new ActionRowBuilder().addComponents(tieBreakerThree)
                modal.addComponents(tb1Row, tb2Row, tb3Row)
        
            return await interaction.showModal(modal)    
        } catch (err) {
            console.log(err)
        }    
    }
}