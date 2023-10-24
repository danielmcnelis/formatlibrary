
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
        const { id: tournamentId, url } = tournament
		const unregistered = await Entry.findAll({ where: { participantId: null, tournamentId } })
		const entryCount = await Entry.count({ where: { tournamentId } })

        if (unregistered.length) {
            const names = unregistered.map((e) => e.playerName)
            return await interaction.editReply({ content: `Error: The following player(s) are not properly registered with the bot:\n${names.join('\n')}`})
        }

		if (!entryCount) {
            return await interaction.editReply({ content: `Error: No entrants found.`})
        } else if (entryCount < 2) {https://www.google.com/url?sa=i&url=https%3A%2F%2Ftwitter.com%2Fujiidow%2Fstatus%2F1597390575460061185&psig=AOvVaw2MlEcQzdKXfc_N5Ox08hse&ust=1698244410622000&source=images&cd=vfe&opi=89978449&ved=0CBAQjRxqFwoTCKjTu8jzjoIDFQAAAAAdAAAAABAE
            return await interaction.editReply({ content: `At least 2 players are required to start a tournament.`})
        }

        if (tournament?.type?.toLowerCase() === 'swiss') {
            try {            
                const [rounds, topCut] = entryCount <= 2 ? [1, null] :
                    entryCount >= 3 && entryCount <= 4 ? [2, null] :
                    entryCount >= 5 && entryCount <= 7 ? [3, null] :
                    entryCount === 8 ? [3, 4] :
                    entryCount >= 9 && entryCount <= 12 ? [4, 4] :
                    entryCount >= 13 && entryCount <= 21 ? [5, 4] :
                    entryCount >= 22 && entryCount <= 32 ? [5, 8] :
                    entryCount >= 33 && entryCount <= 64 ? [6, 8] :
                    entryCount >= 65 && entryCount <= 96 ? [7, 8] :
                    entryCount >= 97 && entryCount <= 128 ? [7, 16] :
                    entryCount >= 129 && entryCount <= 256 ? [8, 16] :
                    [9, 16]
    
                await tournament.update({ rounds, topCut })
    
                await axios({
                    method: 'put',
                    url: `https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`,
                    data: {
                        tournament: {
                            swiss_rounds: rounds,
                        }
                    }
                })
            } catch (err) {
                console.log(err)
                return await interaction.channel.send({ content: `Error connecting to Challonge.`})
            }
        }

        try {
            const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`)
        
            if (data?.tournament?.state === 'underway') {
                await tournament.update({ state: 'underway' })
                interaction.editReply({ content: `Let's go! Your tournament is starting now: https://challonge.com/${url} ${tournament.emoji}`})
                
                if (tournament.isTeamTournament) {
                    return sendTeamPairings(interaction.guild, server, tournament, format, false)
                } else {
                    return sendPairings(interaction.guild, server, tournament, false)
                }
            } else {
                const row = new ActionRowBuilder()
                    .addComponents(new ButtonBuilder()
                        .setCustomId(`Y-${interaction.user?.id}-${tournamentId}`)
                        .setLabel('Yes')
                        .setStyle(ButtonStyle.Primary)
                    )
    
                    .addComponents(new ButtonBuilder()
                        .setCustomId(`N-${interaction.user?.id}-${tournamentId}`)
                        .setLabel('No')
                        .setStyle(ButtonStyle.Primary)
                    )
    
                    .addComponents(new ButtonBuilder()
                        .setCustomId(`S-${interaction.user?.id}-${tournamentId}`)
                        .setLabel('Shuffle')
                        .setStyle(ButtonStyle.Primary)
                    )
    
                await interaction.editReply({ content: `Should this tournament be seeded by Format Library ${emojis.FL} rankings?`, components: [row] })
            }
        } catch (err) {
            console.log(err)
            return await interaction.channel.send({ content: `Error connecting to Challonge.`})
        }

    }
}
