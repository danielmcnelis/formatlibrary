
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Server, Team, Tournament } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { hasPartnerAccess, shuffleArray } from '@fl/bot-functions'
import { Op } from 'sequelize'

export default {
    data: new SlashCommandBuilder()
        .setName('teams')
        .setDescription('View list of teams. 📋'),
    async execute(interaction) {
        await interaction.deferReply()

        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})

        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

        const tournament = await Tournament.findOne({
            where: {
                isTeamTournament: true,
                formatId: format.id,
                serverId: server.id
            }
        }) || await Tournament.findOne({
            where: {
                isTeamTournament: true,
                serverId: server.id
            }
        })

        if (!tournament) return interaction.editReply({ content: `There is no active team tournament.`})

        const teams = await Team.findAll({
            where: {
                tournamentId: tournament.id
            }
        })

        const results = []

        for (let i = 0; i < teams.length; i++) {
            const team = teams[i]
            let players = []
            results.push(`\nTeam: ${team.name}`)
            const captain = await Player.findOne({ where: { id: team.captainId }})
            const playerA = await Player.findOne({ where: { id: team.playerAId }})
            const playerB = await Player.findOne({ where: { id: team.playerBId }})
            const playerC = await Player.findOne({ where: { id: team.playerCId }})

            if (captain.id !== playerA.id) players.push(playerA)
            if (captain.id !== playerB.id) players.push(playerB)
            if (captain.id !== playerC.id) players.push(playerC)

            players = shuffleArray(players)
            players.unshift(captain)

            for (let j = 0; j < players.length; j++) {
                const player = players[j]
                const isRegistered = await Entry.count({
                    where: {
                        tournamentId: tournament.id,
                        participantId: team.participantId,
                        playerId: player.id
                    }
                })

                results.push(`${j === 0 ? 'Captain' : 'Player'}: ${player.name} - Reg. ${isRegistered ? emojis.check : emojis.nope}`)
            }
        }

        await interaction.editReply({ content: `${tournament.name} ${tournament.logo} - Teams ${tournament.emoji}`}) 
        for (let i = 0; i < results.length; i += 30) interaction.channel.send(results.slice(i, i + 30))
        return    
    }
}
