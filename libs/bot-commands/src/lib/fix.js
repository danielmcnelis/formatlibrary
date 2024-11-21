
import { SlashCommandBuilder } from 'discord.js'
import { isProgrammer } from '@fl/bot-functions'
import { Alius, Deck, DeckType, Event, Format, Match, Matchup, Player, Replay, Server, Team, Tournament } from '@fl/models'
import { getMatches, getParticipants, composeBlogPost, calculateStandings, generateMatchupData, fixPlacements, updateSingleAvatar } from '@fl/bot-functions'
import { Op } from 'sequelize'
import axios from 'axios'
import { getParticipants } from '../../../bot-functions/src'

export default {
    data: new SlashCommandBuilder()
        .setName('fix')
        .setDescription('Admin Only - Fix an issue. 🛠️')
		.addStringOption(str =>
            str
                .setName('tournament')
                .setDescription('Enter tournament name or abbreviation.')
                .setRequired(false)
        )
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Tag a user.')
                .setRequired(false)
        )
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply()
        if (isProgrammer(interaction.member)) {
            // const user = interaction.options.getUser('user')   
            // await updateSingleAvatar(user)
            // return await interaction.editReply(`Updated ${user?.username}'s avatar.`)

            const input = interaction.options.getString('tournament')    
            let b = 0
            let e = 0
            console.log('input', input)
            const event = await Event.findOne({
                where: { 
                    [Op.or]: {
                        name: input,
                        abbreviation: input
                    }
                },
                include: [Format, { model: {Player, as: 'winner'} }, Tournament]
            })

            const topCutTournament = await Tournament.findOne({ where: {
                id: event.topCutTournamentId
            }})

            if (!event) return await interaction.editReply('No event found.')

            const server = await Server.findOne({
                where: {
                    id: event.tournament?.serverId
                }
            })

            const matches = await getMatches(server, event.primaryTournamentId)
            const participants = await getParticipants(server, event.primaryTournamentId)
            const standings = await calculateStandings(event.tournament, matches, participants, topCutTournament)

            for (let i = 0; i < standings.length; i++) {
                try {
                    const standing = standings[i] 
                    const player = await Player.findOne({
                        where: {
                            [Op.or]: {
                                name: standing.name,
                                globalName: standing.name,
                                discordName: standing.name,
                            }
                        }
                    })
    
                    if (!player) {
                        console.log(`no player found: ${standing.name}`)
                        continue
                    }
    
                    const deck = await Deck.findOne({
                        where: {
                            eventId: event.id,
                            playerId: player?.id
                        }
                    })
    
                    if (!deck) {
                        console.log(`no deck found: ${player.name}`)
                        continue
                    } else if (deck.display === true) {
                        console.log(`deck topped: ${player.name}`)
                        continue
                    }
    
                    const placement = standing && standing.rank ? parseInt(standing.rank.replace(/^\D+/g, '')) :
                        participant.final_rank ? parseInt(participant.final_rank) :
                        null
                    
                    if (!placement) {
                        console.log(`no placement found: ${player.name}`)
                        continue
                    } else if (placement === deck.placement) {
                        console.log(`${player.name}'s deck already has the correct placement (${placement})`)
                    }
    
                    console.log(`updating deck placement: ${deck.placement} -> ${placement}`)
                    await deck.update({ placement })
                    b++
                } catch (err) {
                    e++
                    console.log(err)
                }
            }
            
            console.log(`updated placements for ${b} decks; encountered ${e} errors`)
            return await interaction.editReply(`Updated placements for ${b} decks associated with ${event.name}.`)

            
        // const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            // const tournamentId = interaction.options.getString('tournament')
           
            // const { data: tournamentData } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournamentId}.json?api_key=${server.challongeAPIKey}`)
            // console.log('tournamentData?.tournament?.id', tournamentData?.tournament?.id)
            // let tournament = await Tournament.findOne({ 
            //     where: {
            //         id: tournamentData.tournament.id.toString()
            //     }
            // })

            // console.log('!!tournament', !!tournament)

            // if (!tournament) {
            //     tournament = await Tournament.create({
            //         id: tournamentData.tournament.id.toString(),
            //         name: tournamentData.tournament.name,
            //         abbreviation: tournamentData.tournament.name,
            //         url: tournamentData.tournament.url,
            //         type: tournamentData.tournament.tournament_type,
            //         formatName: 'Goat',
            //         formatId: 8,
            //         createdAt: tournamentData.tournament.created_at,
            //         community: 'GoatFormat.com',
            //         serverId: '459826576536764426',
            //         state: 'complete'
            //     })

            //     console.log('!!tournament', !!tournament)
            // }
        
            // const { data: participants } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournamentId}/participants.json?api_key=${server.challongeAPIKey}`)
            // const { data: matches } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournamentId}/matches.json?api_key=${server.challongeAPIKey}`)
            // const participantMap = {}
            // let b = 0
            // let c = 0
            // let d = 0

            // for (let i = 0; i < participants.length; i++) {
            //     const { participant } = participants[i]
            //     const [discordName,] = participant.name.split('#')
            //     let players = await Player.findAll({
            //         where: {
            //             [Op.or]: {
            //                 discordName: {[Op.iLike]: discordName},
            //                 globalName: {[Op.iLike]: discordName}
            //             }
            //         }
            //     })

            //     if (!players.length) {
            //         players = [...await Alius.findAll({
            //             where: {
            //                 formerName: {[Op.iLike]: discordName}
            //             },
            //             include: Player
            //         })].map((a) => a.player)
            //     }
        
            //     if (!players.length) {
            //         return interaction.editReply(`Cannot find player matching participant: ${participant.name} (${participant.id})`)
            //     } else if (players.length > 1) {
            //         return interaction.editReply(`Found multiple players matching participant: ${participant.name} (${participant.id}):\n${players.map((p) => `- ${p.discordName} (${p.discordId})`).join('\n')}`)
            //     } else {
            //         participantMap[participant.id] = players[0].dataValues
            //     }
            // }

            // if (Object.entries(participantMap).length < tournamentData.tournament.participants_count) {
            //     const count = tournamentData.tournament.participants_count
            //     const difference = count - Object.entries(participantMap).length
            //     return interaction.editReply(`Missing ${difference} out of ${count} participants`)
            // } else {
            //     for (let i = 0; i < matches.length; i++) {
            //         const { match } = matches[i]
            //         const retrobotMatch = await Match.findOne({ where: { challongeMatchId: match.id }})
            
            //         if (retrobotMatch) {     
            //             d++  
            //             console.log(`match ${match.id} has already been recorded`)
            //             continue
            //         } else if (!retrobotMatch && match.forfeited) {     
            //             c++  
            //             console.log(`match ${match.id} appears to be forfeited from ${tournament.name}`)
            //             continue
            //         } else if (!retrobotMatch && !match.forfeited) {
            //             console.log('creating match for challongeMatchId:', match.id)
            //             try {
            //                 await Match.create({
            //                     formatName: 'Goat',
            //                     formatId: 8,
            //                     challongeMatchId: match.id,
            //                     winnerName: participantMap[match.winner_id].name,
            //                     loserName: participantMap[match.loser_id].name,
            //                     winnerId: participantMap[match.winner_id].id,
            //                     loserId: participantMap[match.loser_id].id,
            //                     isTournament: true,
            //                     serverId: '414551319031054346',
            //                     createdAt: match.completed_at,
            //                     round: match.round,
            //                     tournamentId: tournament.id
            //                 })
            //                 b++ 
            //             } catch (err) {
            //                 console.log(err)
            //                 console.log(participantMap[match.winner_id]?.name, '>', participantMap[match.loser_id]?.name )
            //             }
            //         }
            //     }
            // }

            // return await interaction.editReply(`Generated new matches for ${b} matches from ${tournament?.name}.${d ? ` ${d} matches were already recorded.` : ''}${c ? ` ${c} matches appear to have been forfeited.` : ''} ${b + d + c} out of ${matches.length} matches are now accounted for.`)
        } else {
            return await interaction.editReply('🛠️')
        }
    }
}