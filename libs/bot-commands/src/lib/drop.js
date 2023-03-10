
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Match, Player, Server, Team, Tournament } from '@fl/models'
import { removeParticipant, removeTeam, selectTournament } from '@fl/bot-functions'
import { hasPartnerAccess } from '@fl/bot-functions'
import { Op } from 'sequelize'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('drop')
		.setDescription('Drop from a tournament. 💧'),
	async execute(interaction) {
        await interaction.deferReply()
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})

        const player = await Player.findOne({ where: { discordId: interaction.user.id }})
        if (!player) return await interaction.editReply({ content: `You are not in the database.`})

        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
                
        const tournaments = [
            ...await Entry.findAll({ 
                where: { 
                    '$player.discordId$': interaction.user.id,
                    '$tournament.formatName$': format ? format.name : { [Op.not]: null },
                    '$tournament.serverId$': interaction.guild.id
                }, 
                include: [Player, Tournament]
            })
        ].map((e) => e.tournament)

        if (!tournaments.length) return await interaction.editReply({ content: `You are not in an active ${format ? `${format.name} tournament` : 'tournament'}.`})
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        if (tournament.isTeamTournament && (tournament.state === 'pending' || tournament.state === 'standby')) {
            const entry = await Entry.findOne({ 
                where: { 
                    '$player.discordId$': interaction.user.id, 
                    tournamentId: tournament.id
                },
                include: [Player, Team]
            })

            if (entry.team.captainId !== entry.playerId) return await interaction.editReply({ content: `Only the team captain can drop the team from a team tournament.`})

            const entries = await Entry.findAll({
                where: {
                    teamId: entry.team.id,
                    tournamentId: tournament.id
                }
            })

            return removeTeam(server, interaction, entry.team, entries, tournament, true)
        } else {
            let success = (tournament.state === 'pending' || tournament.state === 'standby')
            if (!success) {
                const matches = await Match.findAll({ 
                    where: { 
                        isTournament: true
                    },
                    limit: 5,
                    order: [["createdAt", "DESC"]] 
                })
    
                matches.forEach((match) => {
                    if (match.winnerId === player.id || match.loserId === player.id) success = true 
                })
    
                if (!success) return await interaction.editReply({ content: `If you played a match, please report the result before dropping. Otherwise ask a Moderator to remove you.`})
            }
    
            const entry = await Entry.findOne({ 
                where: { 
                    '$player.discordId$': interaction.user.id, 
                    tournamentId: tournament.id
                },
                include: Player
            })
    
            return removeParticipant(server, interaction, interaction.member, entry, tournament, true)
        }
    }
}


