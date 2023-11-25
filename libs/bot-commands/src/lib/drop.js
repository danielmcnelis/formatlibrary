
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Match, Player, Server, Team, Tournament } from '@fl/models'
import { removeParticipant, removeTeam, selectTournament } from '@fl/bot-functions'
import { hasPartnerAccess } from '@fl/bot-functions'
import { Op } from 'sequelize'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('drop')
		.setDescription('Drop from a tournament. 💧')
        .setDMPermission(false),
	async execute(interaction) {
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const player = await Player.findByDiscordId(interaction.user.id)
        if (!player) return await interaction.editReply({ content: `You are not in the database.`})
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
                
        const tournaments = [
            ...await Entry.findAll({ 
                where: { 
                    '$player.discordId$': interaction.user.id,
                    '$tournament.formatId$': format?.id || { [Op.not]: null },
                    '$tournament.serverId$': interaction.guildId
                }, 
                include: [Player, Tournament]
            })
        ].map((e) => e.tournament)

        if (!tournaments.length) {
            const team = await Team.findOne({
                where: {
                    captainId: player.id
                },
                include: Tournament
            }) 

            if (team) tournaments.push(team.tournament)
        }

        if (!tournaments.length) return await interaction.editReply({ content: `You are not in an active ${format ? `${format.name} tournament` : 'tournament'}.`})
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        if (tournament.isTeamTournament) {            
            const isCaptain = await Team.count({
                where: {
                    captainId: player.id, 
                    tournamentId: tournament.id
                }
            })

            if (isCaptain) {
                const team = await Team.findOne({ 
                    where: { 
                        captainId: player.id, 
                        tournamentId: tournament.id
                    }
                })

                const entries = await Entry.findAll({
                    where: {
                        teamId: team.id,
                        tournamentId: tournament.id
                    }
                })

                return removeTeam(server, interaction, team, entries, tournament, false)
            } else {
                const isOnTeam = await Team.count({
                    where: {
                        tournamentId: tournament.id,
                        [Op.or]: {
                            playerAId: player.id,
                            playerBId: player.id,
                            playerCId: player.id
                        }
                    }
                })

                if (isOnTeam) {
                    return await interaction.editReply({ content: `Only the team captain can drop a team from a team tournament.`})
                } else {
                    const entry = await Entry.findByPlayerIdAndTournamentId(player.id, tournament.id)
            
                    if (!entry) {
                        return await interaction.editReply({ content: `Hmm... I don't see you in the participants list for ${tournament.name}. ${tournament.emoji}`})
                    } else {
                        await entry.destroy()
                        return await interaction.editReply({ content: `I removed you from ${tournament.name}. ${tournament.emoji}`})
                    }
                }
            }
         } else {
            let success = (tournament.state === 'pending' || tournament.state === 'standby')
            if (!success) {
                const matches = await Match.findAll({ 
                    where: {
                        isTournament: true,
                        tournamentId: tournament.id
                    },
                    limit: 5,
                    order: [["createdAt", "DESC"]] 
                })
    
                matches.forEach((match) => {
                    if (match.winnerId === player.id || match.loserId === player.id) success = true 
                })
    
                if (!success) return await interaction.editReply({ content: `If you played a match, please report the result before dropping. Otherwise ask a Moderator to **remove** you.`})
            }
    
            const entry = await Entry.findByPlayerIdAndTournamentId(player.id, tournament.id)
            return removeParticipant(server, interaction, interaction.member, entry, tournament, true)
        }
    }
}


