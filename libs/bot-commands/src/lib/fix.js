
import { SlashCommandBuilder } from 'discord.js'
import { isProgrammer } from '@fl/bot-functions'
import { Alius, Deck, DeckType, Event, Format, Match, Matchup, Player, Replay, Server, Tournament } from '@fl/models'
import { calculateStandings, generateMatchupData, fixPlacements } from '@fl/bot-functions'
import { Op } from 'sequelize'
import axios from 'axios'

export default {
    data: new SlashCommandBuilder()
        .setName('fix')
        .setDescription('Admin Only - Fix an issue. 🛠️')
		.addStringOption(str =>
            str
                .setName('tournament')
                .setDescription('Enter tournament name or abbreviation.')
                .setRequired(true)
        )
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply()
        if (isProgrammer(interaction.member)) {
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            const tournamentId = interaction.options.getString('tournament')
           
            const { data: tournamentData } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournamentId}.json?api_key=${server.challongeAPIKey}`)
            console.log('tournamentData?.tournament?.id', tournamentData?.tournament?.id)
            let tournament = await Tournament.findOne({ 
                where: {
                    id: tournamentData.tournament.id.toString()
                }
            })

            console.log('!!tournament', !!tournament)

            if (!tournament) {
                tournament = await Tournament.create({
                    id: tournamentData.tournament.id.toString(),
                    name: tournamentData.tournament.name,
                    abbreviation: tournamentData.tournament.name,
                    url: tournamentData.tournament.url,
                    type: tournamentData.tournament.tournament_type,
                    formatName: 'Goat',
                    formatId: 8,
                    createdAt: tournamentData.tournament.created_at,
                    community: 'GoatFormat.com',
                    serverId: '459826576536764426',
                    state: 'complete'
                })

                console.log('!!tournament', !!tournament)
            }
        
            const { data: participants } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournamentId}/participants.json?api_key=${server.challongeAPIKey}`)
            const { data: matches } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournamentId}/matches.json?api_key=${server.challongeAPIKey}`)
            const participantMap = {}
            let b = 0
            let c = 0
            let d = 0

            for (let i = 0; i < participants.length; i++) {
                const { participant } = participants[i]
                const [discordName,] = participant.name.split('#')
                let players = await Player.findAll({
                    where: {
                        [Op.or]: {
                            discordName: {[Op.iLike]: discordName},
                            globalName: {[Op.iLike]: discordName}
                        }
                    }
                })

                if (!players.length) {
                    players = [...await Alius.findAll({
                        where: {
                            formerName: {[Op.iLike]: discordName}
                        },
                        include: Player
                    })].map((a) => a.player)
                }
        
                if (!players.length) {
                    return interaction.editReply(`Cannot find player matching participant: ${participant.name} (${participant.id})`)
                } else if (players.length > 1) {
                    return interaction.editReply(`Found multiple players matching participant: ${participant.name} (${participant.id}):\n${players.map((p) => `- ${p.discordName} (${p.discordId})`).join('\n')}`)
                } else {
                    participantMap[participant.id] = players[0].dataValues
                }
            }

            if (Object.entries(participantMap).length < tournamentData.tournament.participants_count) {
                const count = tournamentData.tournament.participants_count
                const difference = count - Object.entries(participantMap).length
                return interaction.editReply(`Missing ${difference} out of ${count} participants`)
            } else {
                for (let i = 0; i < matches.length; i++) {
                    const { match } = matches[i]
                    const retrobotMatch = await Match.findOne({ where: { challongeMatchId: match.id }})
            
                    if (retrobotMatch) {     
                        d++  
                        console.log(`match ${match.id} has already been recorded`)
                        continue
                    } else if (!retrobotMatch && match.forfeited) {     
                        c++  
                        console.log(`match ${match.id} appears to be forfeited from ${tournament.name}`)
                        continue
                    } else if (!retrobotMatch && !match.forfeited) {
                        console.log('creating match for challongeMatchId:', match.id)
                        try {
                            await Match.create({
                                formatName: 'Goat',
                                formatId: 8,
                                challongeMatchId: match.id,
                                winner: participantMap[match.winner_id].name,
                                loser: participantMap[match.loser_id].name,
                                winnerId: participantMap[match.winner_id].id,
                                loserId: participantMap[match.loser_id].id,
                                isTournament: true,
                                serverId: '414551319031054346',
                                createdAt: match.completed_at,
                                round: match.round,
                                tournamentId: tournament.id
                            })
                            b++ 
                        } catch (err) {
                            console.log(err)
                            console.log(participantMap[match.winner_id]?.name, '>', participantMap[match.loser_id]?.name )
                        }
                    }
                }
            }

            return await interaction.editReply(`Generated new matches for ${b} matches from ${tournament?.name}.${d ? ` ${d} matches were already recorded.` : ''}${c ? ` ${c} matches appear to have been forfeited.` : ''} ${b + d + c} out of ${matches.length} matches are now accounted for.`)
        } else {
            return await interaction.editReply('🛠️')
        }
    }
}