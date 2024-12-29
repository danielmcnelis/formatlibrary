
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { Deck, Entry, Event, Format, Player, Server, Team, Tournament } from '@fl/models'
import { selectTournament } from '@fl/bot-functions'
import { capitalize, createDecks, isModerator, hasPartnerAccess, getMatches, getParticipants, calculateStandings, createTopCut, autoRegisterTopCut } from '@fl/bot-functions'
import { Op } from 'sequelize'
import axios from 'axios'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('end')
		.setDescription('Mod Only - End a tournament. 🏎️')
        .addStringOption(str =>
            str
                .setName('tournament')
                .setDescription('Enter the tournament name or abbreviation.')
                .setRequired(false)
        )
        .setDMPermission(false),
	async execute(interaction) {
        try {
            await interaction.deferReply()
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            if (!isModerator(server, interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that. Please type **/join** instead.`})   
            const name = interaction.options.getString('tournament')        
            const format = await Format.findByServerOrChannelId(server, interaction.channelId)
            const tournaments = await Tournament.findByState('underway', format, interaction.guildId, 'DESC') 

            const tournament = await Tournament.findOne({ 
                where: { 
                    [Op.or]: { 
                        name: { [Op.iLike]: name }, 
                        abbreviation: { [Op.iLike]: name }, 
                        url: { [Op.iLike]: name }
                    },
                    serverId: interaction.guildId
                }
            }) || await selectTournament(interaction, tournaments)
            if (!tournament) return
            
            if (tournament.state === 'pending' || tournament.state === 'standby') return await interaction.editReply({ content: `This tournament has not begun.`})
            if (tournament.state === 'complete' || tournament.state === 'topcut') return await interaction.editReply({ content: `This tournament has already ended.`})
            const tournamentId = tournament.id

            // Finalize tournament on Challonge.com if not yet finalized
            try {
                const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`)
                if (data.tournament.state !== 'complete') {
                    const { status } = await axios({
                        method: 'post',
                        url: `https://api.challonge.com/v1/tournaments/${tournament.id}/finalize.json?api_key=${server.challongeApiKey}`
                    })
        
                    if (status === 200) {   
                        interaction.channel.send({ content: `Congrats! The results of ${tournament.name} ${tournament.logo} have been finalized on Challonge.com.`})
                    } else {
                        return await interaction.editReply({ content: `Unable to finalize ${tournament.name} ${tournament.logo} on Challonge.com.`})
                    }
                }
            } catch (err) {
                console.log(err)
                return await interaction.editReply({ content: `Unable to finalize ${tournament.name} ${tournament.logo} on Challonge.com.`})
            }

            if (tournament.type === 'swiss' && !tournament.associatedTournamentId) {
                // If tournament is Swiss and no top cut tournament has been created, ask to create a top cut tournament
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

                return await interaction.editReply({ content: `Do you wish to create a top cut for this tournament?`, components: [row] })
            } else if (!tournament.isTopCutTournament) {
                // If tournament is not a top cut tournament, find or create an event
                let event = await Event.findOne({ where: { primaryTournamentId: tournament.id }})

                if (!event) {
                    event = await Event.create({
                        name: tournament.name,
                        abbreviation: tournament.abbreviation,
                        formatName: tournament.formatName,
                        formatId: tournament.formatId,
                        referenceUrl: `https://challonge.com/${tournament.url}`,
                        display: false,
                        primaryTournamentId: tournament.id,
                        topCutTournamentId: tournament.associatedTournamentId,
                        type: tournament.type,
                        isTeamEvent: tournament.isTeamTournament,
                        communityName: tournament.communityName,
                        serverId: tournament.serverId
                    })
                }
        
                // If nobody is marked as a winner, find and mark a winner
                if (event && !event.winnerId) {
                    try {
                        const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeApiKey}`)
                        let winnerParticipantId = null
                        for (let i = 0; i < data.length; i++) {
                            const participant = data[i].participant
                            if (participant.final_rank === 1) {
                                winnerParticipantId = participant.id
                                break
                            }
                        }
        
                        if (event.isTeamEvent) {
                            const winningTeam = await Team.findOne({ where: { participantId: parseInt(winnerParticipantId) }})
                            await event.update({ winningTeamName: winningTeam.name })
                            console.log(`Marked ${winningTeam.name} as the winner of ${event.name}.`)
                        } else {
                            const winningEntry = await Entry.findOne({ where: { participantId: parseInt(winnerParticipantId) }})
                            await event.update({
                                winnerName: winningEntry.playerName,
                                winnerId: winningEntry.playerId
                            })

                            console.log(`Marked ${winningEntry.playerName} as the winner of ${event.name}.`)
                        }
                    } catch (err) {
                        console.log(err)
                    }
                }
        
                // If event information is incomplete, get and save that information
                if (event && (!event.size || !event.startDate || !event.endDate)) {
                    try {
                        const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`)
                        const size = event.size || data.tournament.participants_count
                        const startDate = data.tournament.started_at ? `${data.tournament.started_at.slice(0, 10)} ${data.tournament.started_at.slice(11, 26)}` : ''
                        const endDate = data.tournament.completed_at ? `${data.tournament.completed_at.slice(0, 10)} ${data.tournament.completed_at.slice(11, 26)}` : ''
        
                        await event.update({
                            size,
                            startDate,
                            endDate
                        })
        
                        console.log(`Recorded size, start date, and end date for ${event.name}`)
                    } catch (err) {
                        console.log(err)
                    }
                }
        
                // If the number of decks saved for the event is less than the size of the event, create the remaining decks:
                let count = await Deck.count({ where: { eventId: event.id }})
                if (event && event.size > 0 && ((!event.isTeamEvent && event.size !== count) || (event.isTeamEvent && (event.size * 3) !== count))) {
                    try {
                        const { data: matches } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/matches.json?api_key=${server.challongeApiKey}`)
                        const { data: participants } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeApiKey}`)
                        const standings = await calculateStandings(tournament, matches, participants)   
                        const success = await createDecks(event, participants, standings)

                        if (!success) {
                            return await interaction.editReply(`Failed to save all decks.`)
                        } else {
                            count = !event.isTeamEvent ? event.size : event.size * 3
                        }
                    } catch (err) {
                        console.log(err)
                        return await interaction.editReply(`Failed to save all decks.`)
                    }
                }
                
                // If the number of decks saved for the event is equal to the size of the event:
                // (1) delete all of this tournament's participant entries saved in the database
                // (2) remove tournament roles if user is not in another tournament on server
                // (3) mark tournament as complete in the database
                if (event && event.size > 0 && ((!event.isTeamEvent && event.size === count) || (event.isTeamEvent && (event.size * 3) === count))) {
                    const entries = await Entry.findAll({ where: { tournamentId: tournament.id }, include: Player })
            
                    for (let i = 0; i < entries.length; i++) {
                        try {
                            const entry = entries[i]
                            const playerName = entry.playerName
                            const playerId = entry.playerId
                            const discordId = entry.player.discordId	
                            console.log(`Deleting ${entry.playerName}'s entry for ${event.name}.`)
                            await entry.destroy()
        
                            const count = await Entry.count({ 
                                where: {
                                    playerId: playerId,
                                    isActive: true,
                                    '$tournament.serverId$': server.id
                                },
                                include: Tournament,
                            })
        
                            if (!count) {
                                const member = await interaction.guild?.members.fetch(discordId)
                                if (!member) continue
                                console.log(`Removing ${playerName}'s tournament role on ${server.name}.`)
                                member.roles.remove(server.tournamentRoleId)
                            }
                        } catch (err) {
                            console.log(err)
                        }
                    }
        
                    await tournament.update({ state: 'complete' })
                    return await interaction.editReply({ content: `Congrats! The results of ${tournament.name} ${tournament.logo} have been finalized.`})
                }
            } else if (tournament.isTopCutTournament) {
                // If tournament is a top cut tournament, find or create an event
                const primaryTournament = await Tournament.findOne({ where: { id: tournament.associatedTournamentId }})
                let event = await Event.findOne({ where: { primaryTournamentId: primaryTournament.id }})

                if (!event) {
                    event = await Event.create({
                        name: primaryTournament.name,
                        abbreviation: primaryTournament.abbreviation,
                        formatName: tournament.formatName,
                        formatId: tournament.formatId,
                        referenceUrl: `https://challonge.com/${primaryTournament.url}`,
                        display: false,
                        primaryTournamentId: primaryTournament.id,
                        topCutTournamentId: tournament.id,
                        type: primaryTournament.type,
                        isTeamEvent: primaryTournament.isTeamTournament,
                        communityName: tournament.communityName,
                        serverId: tournament.serverId
                    })
                }
        
                // Update winner
                if (event) {
                    try {
                        const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeApiKey}`)
                        let winnerParticipantId = null
                        for (let i = 0; i < data.length; i++) {
                            const participant = data[i].participant
                            if (participant.final_rank === 1) {
                                winnerParticipantId = participant.id
                                break
                            }
                        }
        
                        if (event.isTeamEvent) {
                            const winningTeam = await Team.findOne({ where: { participantId: parseInt(winnerParticipantId) }})
                            await event.update({ 
                                winningTeamName: winningTeam.name,
                                winningTeamId:winningTeam.id
                            })
                            console.log(`Marked ${winningTeam.name} as the winner of ${event.name}.`)
                        } else {
                            const winningEntry = await Entry.findOne({ where: { participantId: parseInt(winnerParticipantId) }})
                            await event.update({
                                winnerName: winningEntry.playerName,
                                winnerId: winningEntry.playerId
                            })

                            console.log(`Marked ${winningEntry.playerName} as the winner of ${event.name}.`)
                        }
                    } catch (err) {
                        console.log(err)
                    }
                }
        
                // Update event information
                if (event) {
                    try {
                        const { data: primaryTournamentData } = await axios.get(`https://api.challonge.com/v1/tournaments/${primaryTournament.id}.json?api_key=${server.challongeApiKey}`)
                        const { data: topCutTournamentData } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`)
                        const size = primaryTournamentData.tournament.participants_count || event.size
                        const startDate = primaryTournamentData.tournament.started_at ? `${primaryTournamentData.tournament.started_at.slice(0, 10)} ${primaryTournamentData.tournament.started_at.slice(11, 26)}` : ''
                        const endDate = topCutTournamentData.tournament.completed_at ? `${topCutTournamentData.tournament.completed_at.slice(0, 10)} ${topCutTournamentData.tournament.completed_at.slice(11, 26)}` : ''
        
                        await event.update({
                            size,
                            startDate,
                            endDate
                        })
        
                        console.log(`Recorded size, start date, and end date for ${event.name}`)
                    } catch (err) {
                        console.log(err)
                    }
                }
                
                // If the number of decks saved for the event is less than the size of the event, create the remaining decks:
                let count = await Deck.count({ where: { eventId: event.id }})
                if (event && event.size > 0 && ((!event.isTeamEvent && event.size !== count) || (event.isTeamEvent && (event.size * 3) !== count))) {
                    try {                    
                        const { data: matches } = await axios.get(`https://api.challonge.com/v1/tournaments/${primaryTournament.id}/matches.json?api_key=${server.challongeApiKey}`)
                        const { data: participants } = await axios.get(`https://api.challonge.com/v1/tournaments/${primaryTournament.id}/participants.json?api_key=${server.challongeApiKey}`)
                        const standings = await calculateStandings(primaryTournament, matches, participants)                
                        const success = await createDecks(event, participants, standings, tournament.size, tournament.id, server.challongeApiKey)

                        if (!success) {
                            return await interaction.editReply(`Failed to save all decks.`)
                        } else {
                            count = event.size
                        }
                    } catch (err) {
                        console.log(err)
                        return await interaction.editReply(`Failed to save all decks.`)
                    }
                }
                
                // If the number of decks saved for the event is equal to the size of the event:
                // (1) delete all of this tournament's participant entries saved in the database
                // (2) remove tournament roles if user is not in another tournament on server
                // (3) mark tournament as complete in the database
                if (event && event.size > 0 && ((!event.isTeamEvent && event.size === count) || (event.isTeamEvent && (event.size * 3) === count))) {
                    try {      
                        const topCutEntries = await Entry.findAll({ where: { tournamentId: tournament.id }, include: Player })
                        const { data: participants } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeApiKey}`)

                        for (let i = 0; i < topCutEntries.length; i++) {
                            const entry = topCutEntries[i]
                            const participant = participants.map((p) => p.participant).find((p) => p.id === entry.participantId)
                            const placement = participant?.final_rank
                            const deck = await Deck.findOne({ where: { eventId: event.id, builderId: entry.playerId }})
                            await deck.update({ placement: placement })
                        }
                    } catch (err) {
                        console.log(err)
                        return await interaction.editReply(`Failed to update placements of top cut participants.`)
                    }
                    
                    const entries = await Entry.findAll({ where: { tournamentId: {[Op.or]: [tournament.id, primaryTournament.id] }}, include: Player })
            
                    for (let i = 0; i < entries.length; i++) {
                        try {    
                            const entry = entries[i]
                            const playerName = entry.playerName
                            const playerId = entry.playerId
                            const discordId = entry.player.discordId	
                            console.log(`Deleting ${entry.playerName}'s entry for ${tournament.name}.`)
                            await entry.destroy()
        
                            const count = await Entry.count({ 
                                where: {
                                    playerId: playerId,
                                    isActive: true,
                                    '$tournament.serverId$': server.id
                                },
                                include: Tournament,
                            })
        
                            if (!count) {
                                const member = await interaction.guild?.members.fetch(discordId)
                                if (!member) continue
                                console.log(`Removing ${playerName}'s tournament role on ${server.name}.`)
                                member.roles.remove(server.tournamentRoleId)
                            }
                        } catch (err) {
                            console.log(err)
                        }
                    }
        
                    await tournament.update({ state: 'complete' })
                    await primaryTournament.update({ state: 'complete' })
                    return await interaction.editReply({ content: `Congrats! The results of ${event.name} ${primaryTournament.logo} have been finalized.`})
                }
            }
        } catch (err) {
            console.log(err)
        }
    }
}

