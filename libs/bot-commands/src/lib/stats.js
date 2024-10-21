
import { SlashCommandBuilder } from 'discord.js'    
import { hasPartnerAccess, getMedal } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Format, Player, Server, Stats, TriviaKnowledge } from '@fl/models'
import { Op } from 'sequelize'

export default {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription(`Post a player's stats. 🏅`)
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to check.')
                .setRequired(false)
        )
        .setDMPermission(false),
    async execute(interaction) {
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const user = interaction.options.getUser('player') || interaction.user
        const player = await Player.findOne({ where: { discordId: user?.id } })
        if (!player) return await interaction.reply({ content: `That user is not in the database.`})
        if (player.hidden) return await interaction.reply({ content: `That user's stats are not available at this time.`})
        const serverId = server.internalLadder ? server.id : '414551319031054346'

        if (interaction.channel?.name === 'trivia') {
            const smarts = await TriviaKnowledge.count({ where: { playerId: player.id } })
            const allKnowledge = await TriviaKnowledge.findAll({ include: Player })
            const data = {}

            for (let i = 0; i < allKnowledge.length; i++) {
                const knowledge = allKnowledge[i]
                const playerId = knowledge.playerId
                if (data[playerId]) {
                    data[playerId].smarts++
                } else {
                    data[playerId] = {
                        smarts: 1,
                        wins: knowledge?.player?.triviaWins
                    }
                }
            }

            const triviaRankings = Object.entries(data)
                .sort((a, b) => b[1].smarts - a[1].smarts)
                .sort((a, b) => b[1].wins - a[1].wins)
            
            const index = triviaRankings.length ? triviaRankings.findIndex((k) => k[0] === player.id) : null
            const rank = index !== null ? `#${index + 1} out of ${triviaRankings.length}` : `N/A`
            
            return await interaction.reply({ content: 
                `${emojis.no} --- Trivia Stats --- ${emojis.yes}`
                + `\nName: ${player.globalName || player.discordName}`
                + `\nRanking: ${rank}`
                + `\nTrivia Wins: ${player.triviaWins} ${emojis.award}`
                + `\nCorrectly Answered: ${smarts} ${emojis.stoned}`
            })
        } else {
            const format = await Format.findByServerOrChannelId(server, interaction.channelId)
            if (!format) return await interaction.reply({ content: `Try using **/stats** in channels like: <#414575168174948372> or <#629464112749084673>.`})
            
            const stats = await Stats.findOne({ 
                where: { 
                    playerId: player.id, 
                    formatId: format.id, 
                    [Op.or]: [
                        { wins: { [Op.not]: null } }, 
                        { losses: { [Op.not]: null } }, 
                    ],
                    serverId: serverId
                } 
            })

            const allStats = await Stats.findAll({ 
                    where: {
                        formatId: format.id, 
                        games: { [Op.gte]: 3 },
                        serverId: serverId,
                        inactive: false,
                        '$player.hidden$': false
                    },
                    include: [Player],
                    order: [['elo', 'DESC']] 
                })


            const index = allStats.findIndex((s) => s.playerId === player.id)
            const rank = stats && index >= 0 ? `#${index + 1} out of ${allStats.length}` : `N/A`
            const elo = stats ? stats.elo.toFixed(2) : `500.00`
            const medal = getMedal(elo, true)
            const wins = stats ? stats.wins : 0
            const losses = stats ? stats.losses : 0
            const winrate = wins || losses ? `${(100 * wins / (wins + losses)).toFixed(2)}%` : 'N/A'		

            return await interaction.reply({ content: 
                `${server.emoji || format.emoji} --- ${format.name} Stats --- ${server.emoji || format.emoji}`
                + `${server.internalLadder ? `\nServer: ${server.name}` : ''}`
                + `\nName: ${player.globalName || player.discordName}`
                + `\nMedal: ${medal}`
                + `\nRanking: ${rank}`
                + `\nElo Rating: ${elo}`
                + `${stats?.tournamentPoints ? `\nTournament Points: ${stats?.tournamentPoints}` : ''}`
                + `\nWins: ${wins}, Losses: ${losses}`
                + `\nWin Rate: ${winrate}`
            })
        }
    }
}