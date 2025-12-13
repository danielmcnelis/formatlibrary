
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Server, Team, Tournament } from '@fl/models'
import { startChallongeBracket, initiateEndTournament, selectTournament, sendPairings, sendTeamPairings, postParticipant } from '@fl/bot-functions'
import { isModerator, hasPartnerAccess, shuffleArray } from '@fl/bot-functions'
import { Op } from 'sequelize'
import axios from 'axios'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Mod Only - Start a tournament. 🏎️')
        .setDMPermission(false),
	async execute(interaction) {
        try {
            await interaction.deferReply()
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            if (!isModerator(server, interaction.member)) return await interaction.editReply({ content: 'You do not have permission to do that. Please type **/join** instead.'})   
            const format = await Format.findByServerOrChannelId(server, interaction.channelId)
            const tournaments = await Tournament.findByState({[Op.or]: ['pending', 'standby']}, format, interaction.guildId, 'ASC')
            const tournament = await selectTournament(interaction, tournaments)
            if (!tournament) return

            const unregistered = await Entry.findAll({ where: { participantId: null, tournamentId: tournament.id } })
            if (unregistered.length) {
                const names = unregistered.map((e) => e.playerName)
                return await interaction.editReply({ content: `Error: The following player(s) are not properly registered with RetroBot:\n${names.join('\n')}`})
            }

            const entryCount = await Entry.count({ where: { tournamentId: tournament.id } })
            if (!entryCount) {
                return await interaction.editReply({ content: `Error: No tournament entrants found.`})
            } else if (entryCount < 2) {
                return await interaction.editReply({ content: `Error: At least 2 players are required to start a tournament.`})
            }

            if (tournament.isTeamTournament) {
                let freeAgents = await Entry.findAll({
                    where: {
                        tournamentId: tournament.id,
                        teamId: null,
                    },
                    include: Player,
                    order: [['createdAt', 'ASC']]
                })

                const removedEntries = []

                while (freeAgents.length % 3 !== 0) {
                    removedEntries.push(freeAgents.pop())                
                }

                freeAgents = shuffleArray(freeAgents)

                for (let i = 0; i < (freeAgents.length / 3); i++) {
                    const freeAgentA = freeAgents[i*3]
                    const freeAgentB = freeAgents[i*3+1]
                    const freeAgentC = freeAgents[i*3+2]
                    const teamName = `Free Agents ${i+1}`
                    
                    const data = await postParticipant(server, tournament, teamName)
                    if (!data) return await interaction.editReply({ content: `Error: Unable to register ${teamName} on Challonge for ${tournament.name}. ${tournament.logo}`})
                    
                    const team = await Team.create({
                        name: teamName,
                        captainId: freeAgentA.playerId,
                        tournamentId: tournament.id,
                        participantId: data.participant.id,
                        playerAId: freeAgentA.playerId,
                        playerBId: freeAgentB.playerId,
                        playerCId: freeAgentC.playerId,
                    })

                    await freeAgentA.update({ slot: 'A', teamId: team.id, participantId: team.participantId })
                    await freeAgentB.update({ slot: 'B', teamId: team.id, participantId: team.participantId })
                    await freeAgentC.update({ slot: 'C', teamId: team.id, participantId: team.participantId })   
                    await interaction.channel.send(`Registered new free agent team: ${teamName}\nCaptain: <@${freeAgentA.player?.discordId}>\nPlayer 1: <@${freeAgentB.player?.discordId}>\nPlayer 2: <@${freeAgentC.player?.discordId}>`) 
                }
            }

            if (tournament?.type?.toLowerCase() === 'swiss') {
                try {            
                    const [rounds, topCutSize] = entryCount <= 2 ? [1, null] :
                        entryCount >= 3 && entryCount <= 4 ? [2, null] :
                        entryCount >= 5 && entryCount <= 7 ? [3, null] :
                        entryCount === 8 ? [3, 4] :
                        entryCount >= 9 && entryCount <= 12 ? [4, 4] :
                        entryCount >= 13 && entryCount <= 21 ? [5, 4] :
                        entryCount >= 22 && entryCount <= 32 ? [5, 8] :
                        entryCount >= 33 && entryCount <= 64 ? [6, 8] :
                        entryCount >= 65 && entryCount <= 96 ? [7, 8] :f
                        entryCount >= 97 && entryCount <= 128 ? [7, 16] :
                        entryCount >= 129 && entryCount <= 256 ? [8, 16] :
                        [9, 16]
        
                    await tournament.update({ rounds, topCutSize })
        
                    await axios({
                        method: 'put',
                        url: `https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`,
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

            if (tournament.isTopCutTournament) {
                await initiateEndTournament(interaction, tournament.id)
            }

            try {
                const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`)
            
                if (data?.tournament?.state === 'underway') {
                    await tournament.update({ state: 'underway' })
                    interaction.editReply({ content: `Let's go! Your tournament is starting now: https://challonge.com/${tournament.url} ${tournament.emoji}`})
                    await tournament.update({ startedAt: data?.tournament?.started_at })

                    if (tournament.isTeamTournament) {
                        return sendTeamPairings(interaction.guild, server, tournament, false)
                    } else {
                        return sendPairings(interaction.guild, server, tournament, false)
                    }
                } else if (tournament.isTopCutTournament) {
                    return startChallongeBracket(interaction, tournament.id)
                } else {
                    const row = new ActionRowBuilder()
                        .addComponents(new ButtonBuilder()
                            .setCustomId(`Y-${interaction.user?.id}-${tournament.id}`)
                            .setLabel('Yes')
                            .setStyle(ButtonStyle.Primary)
                        )
        
                        .addComponents(new ButtonBuilder()
                            .setCustomId(`N-${interaction.user?.id}-${tournament.id}`)
                            .setLabel('No')
                            .setStyle(ButtonStyle.Primary)
                        )
        
                        .addComponents(new ButtonBuilder()
                            .setCustomId(`S-${interaction.user?.id}-${tournament.id}`)
                            .setLabel('Shuffle')
                            .setStyle(ButtonStyle.Primary)
                        )
        
                    await interaction.editReply({ content: `Should this tournament be seeded by Format Library ${emojis.FL} rankings?`, components: [row] })
                }
            } catch (err) {
                console.log(err)
                return await interaction.channel.send({ content: `Error connecting to Challonge.`})
            }
        } catch (err) {
            console.log(err)
        }
    }
}
