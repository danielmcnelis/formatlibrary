
import { SlashCommandBuilder } from 'discord.js'    
import { hasPartnerAccess, getMedal, getSeason } from '@fl/bot-functions'
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
        try {
            const now = new Date()
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            const user = interaction.options.getUser('player') || interaction.user
            const player = await Player.findOne({ where: { discordId: user?.id } })
            if (!player) return await interaction.reply({ content: `That user is not in the database.`})
            if (player.isHidden) return await interaction.reply({ content: `That user's stats are not available at this time.`})
            const serverId = server.hasInternalLadder ? server.id : '414551319031054346'

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
                    + `\nName: ${player.name}`
                    + `\nRanking: ${rank}`
                    + `\nTrivia Wins: ${player.triviaWins} ${emojis.award}`
                    + `\nCorrectly Answered: ${smarts} ${emojis.stoned}`
                })
            } else {
                const format = await Format.findByServerOrChannelId(server, interaction.channelId)
                if (!format) return await interaction.reply({ content: `Try using **/stats** in channels like: <#414575168174948372> or <#629464112749084673>.`})
                
                const [eloType, winsType, lossesType, gamesType, statsType] = !server.hasInternalLadder && format.useSeasonalElo && format.seasonResetDate < now ? 
                    ['seasonalElo', 'seasonalWins', 'seasonalLosses', 'seasonalGames', `Seasonal ${season} `] : 
                    ['elo', 'wins', 'losses', 'games', '']

                const stats = Stats.findOne({ 
                    where: { 
                        playerId: player.id, 
                        formatId: format.id, 
                        serverId: serverId
                    } 
                }) || {}

                const season = getSeason(now.getMonth())
                    
                console.log(`[eloType, elo, wins, losses, games, statsType]`, [eloType, stats[eloType], stats[winsType], stats[lossesType], stats[gamesType], statsType])

                const allStats = await Stats.findAll({ 
                    where: {
                        formatId: format.id, 
                        [gamesType]: { [Op.gte]: 3 },
                        serverId: serverId,
                        '$player.isHidden$': false
                    },
                    include: [Player],
                    order: [[eloType, 'DESC']] 
                })

                const index = allStats.findIndex((s) => s.playerId === player.id)
                const rank = stats.id && index >= 0 ? `#${index + 1} out of ${allStats.length}` : `N/A`
                const medal = getMedal(stats[eloType], true)
                const winrate = stats[winsType] || stats[lossesType] ? `${(100 * stats?.[winsType] / (stats[winsType] + stats[lossesType])).toFixed(2)}%` : 'N/A'		

                return await interaction.reply({ content: 
                    `${format.emoji} --- ${statsType}${format.name} Stats --- ${format.emoji}`
                    + `${server.hasInternalLadder ? `\nServer: ${server.name}` : ''}`
                    + `\nName: ${stats.playerName}`
                    + `\nMedal: ${medal}`
                    + `\nRanking: ${rank}`
                    + `\nElo Rating: ${stats[eloType].toFixed(2) || '500.00'}`
                    + `\nWins: ${stats[winsType]}, Losses: ${stats[lossesType]}`
                    + `\nWin Rate: ${winrate}`
                })
            }
        } catch (err) {
            console.log(err)
        }
    }
}