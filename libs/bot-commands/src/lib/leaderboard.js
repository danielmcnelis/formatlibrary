
import { SlashCommandBuilder } from 'discord.js'    
import { hasPartnerAccess, getMedal, urlize, getSeason} from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Format, Player, Server, Stats } from '@fl/models'
import { Op } from 'sequelize'

export default {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription(`Post the leaderboard. 🪜`)
        .setDMPermission(false),
    async execute(interaction) {
        try {
            const now = new Date()
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            const format = await Format.findByServerOrChannelId(server, interaction.channelId)
            if (!format) return await interaction.reply({ content: `Try using **/leaderboard** in channels like: <#414575168174948372> or <#629464112749084673>.`})
            const serverId = server.hasInternalLadder ? server.id : '414551319031054346'

            const season = getSeason(now.getMonth())
            const [eloType, gamesType, statsType] = !server.hasInternalLadder && format.useSeasonalElo && format.seasonResetDate < now ? 
                ['seasonalElo', 'seasonalGames', `Seasonal ${season} `] : 
                ['elo', 'games', '']

            const stats = await Stats.findAll({ 
                where: {
                    formatId: format.id, 
                    [gamesType]: { [Op.gte]: 3 },
                    serverId: serverId,
                    isActive: true,
                    '$player.isHidden$': false
                },
                include: Player,
                limit: 10,
                order: [[eloType, 'DESC']] 
            })

            
            if (!stats.length) return await interaction.reply({ content: `I'm sorry, we don't have any ${statsType}${format.name} players.`})
            const results = []
            stats.length === 1 ? results[0] = `${format.emoji} --- The Best ${server.hasInternalLadder ? 'Internal ' : statsType}${format.name} Player --- ${format.emoji}`
                : results[0] = `${format.emoji} --- Top ${stats.length} ${server.hasInternalLadder ? 'Internal ' : statsType}${format.name} Players --- ${format.emoji}`
            
            for (let i = 0; i < stats.length; i++) {
                results[i+1] = `${(i+1)}. ${getMedal(stats[i][eloType])} ${stats[i].playerName}`
            }
            
            if ((!server.hasInternalLadder && format.useSeasonalElo && format.seasonResetDate < now)) {
                if (!server.hasInternalLadder) results.push(`\nFull Leaderboard: https://formatlibrary.com/leaderboards/${urlize(format.name)}?type=seasonal`)
            } else {
                if (!server.hasInternalLadder) results.push(`\nFull Leaderboard: https://formatlibrary.com/leaderboards/${urlize(format.name)}?type=all-time`)
            }
            await interaction.reply({ content: results.join('\n') })
        } catch (err) {
            console.log(err)
        }
    }
}

    