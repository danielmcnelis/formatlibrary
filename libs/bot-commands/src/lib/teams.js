
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Server, Team, Tournament } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { hasPartnerAccess, shuffleArray } from '@fl/bot-functions'

export default {
    data: new SlashCommandBuilder()
        .setName('teams')
        .setDescription('View list of teams. 📋'),
    async execute(interaction) {
        // return interaction.reply(emojis.yellow)
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)

        const tournament = format ? await Tournament.findOne({
            where: {
                isTeamTournament: true,
                formatId: format.id,
                serverId: server.id
            }
        }) : await Tournament.findOne({
            where: {
                isTeamTournament: true,
                serverId: server.id
            }
        })

        if (!tournament) return interaction.editReply({ content: `There is no active team tournament.`})

        const teams = await Team.findAll({
            where: {
                tournamentId: tournament.id
            },
            order: [['createdAt', 'ASC']]
        })

        const results = []

        for (let i = 0; i < teams.length; i++) {
            const team = teams[i]
            if (i > 0) results.push('‎')
            results.push(`**${team.name}**`)
            const captain = await Player.findOne({ where: { id: team.captainId }})
            const playerA = await Player.findOne({ where: { id: team.playerAId }})
            const playerB = await Player.findOne({ where: { id: team.playerBId }})
            const playerC = await Player.findOne({ where: { id: team.playerCId }})

            let players = []
            // const players = [playerA, playerB, playerC]

            if (captain.id !== playerA.id) players.push(playerA)
            if (captain.id !== playerB.id) players.push(playerB)
            if (captain.id !== playerC.id) players.push(playerC)

            players = shuffleArray(players)
            players.unshift(captain)

            for (let j = 0; j < players.length; j++) {
                const slot = j === 0 ? 'A' : j === 1 ? 'B' : 'C'
                const player = players[j]
                const isRegistered = await Entry.count({
                    where: {
                        tournamentId: tournament.id,
                        participantId: team.participantId,
                        playerId: player.id
                    }
                })

                const isCaptain = player.id === captain.id

                results.push(`Player ${slot}: ${player.globalName} ${isCaptain ? '(Captain) ' : ' '}${isRegistered ? emojis.check : emojis.nope}`)
            }
        }

        results.push('‎')
        results.push('**Free Agents**')
        const freeAgents = await Entry.findAll({
            where: {
                tournamentId: tournament.id,
                teamId: null
            },
            order: [["createdAt", "ASC"]]
        })

        if (!freeAgents.length) results.push('N/A')
        freeAgents.forEach((freeAgent) => results.push(freeAgent.playerName))

        await interaction.editReply({ content: `${tournament.name} ${tournament.logo} - Teams ${tournament.emoji}`}) 
        for (let i = 0; i < results.length; i += 30) interaction.channel.send({ content: results.slice(i, i + 30).join('\n').toString() })
        return    
    }
}
