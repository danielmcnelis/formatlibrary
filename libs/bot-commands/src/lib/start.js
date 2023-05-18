
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Server, Tournament } from '@fl/models'
import { selectTournament, sendPairings, sendTeamPairings } from '@fl/bot-functions'
import { isMod, hasPartnerAccess } from '@fl/bot-functions'
import { Op } from 'sequelize'
import axios from 'axios'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Mod Only - Start a tournament. 🏎️'),
	async execute(interaction) {
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return await interaction.editReply({ content: 'You do not have permission to do that. Please type **/join** instead.'})   
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const tournaments = await Tournament.findByStateAndFormatAndServerId({[Op.or]: ['pending', 'standby']}, format, interaction.guildId)
		const tournament = await selectTournament(interaction, tournaments)
		if (!tournament) return
        const { id, url } = tournament

		const unregCount = await Entry.count({ where: { participantId: null, tournamentId: id } })
        if (unregCount) return await interaction.editReply({ content: 'Error: One or more players is not registered with Challonge.'})

		const entryCount = await Entry.count({ where: { tournamentId: id } })
		if (!entryCount) return await interaction.editReply({ content: `Error: No entrants found.`})

        const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`)
        
        if (data.tournament.state === 'underway') {
			await tournament.update({ state: 'underway' })
            interaction.editReply({ content: `Let's go! Your tournament is starting now: https://challonge.com/${url} ${tournament.emoji}`})
            if (tournament.isTeamTournament) {
                return sendTeamPairings(interaction.guild, server, tournament, false)
            } else {
                return sendPairings(interaction.guild, server, tournament, false)
            }
        } else {
		    const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Y${tournament.id}`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`N${tournament.id}`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`S${tournament.id}`)
                    .setLabel('Shuffle')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.editReply({ content: `Should this tournament be seeded by Format Library ${emojis.FL} rankings?`, components: [row] })
        }
    }
}
