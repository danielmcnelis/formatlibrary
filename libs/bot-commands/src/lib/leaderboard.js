
import { SlashCommandBuilder } from 'discord.js'    
import { hasPartnerAccess, getMedal, urlize } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Format, Player, Server, Stats } from '@fl/models'
import { Op } from 'sequelize'

export default {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription(`Post the leaderboard. 🪜`),
    async execute(interaction) {
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        if (!format) return await interaction.reply({ content: `Try using **/leaderboard** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const serverId = server.internalLadder ? server.id : '414551319031054346'

        const stats = await Stats.findAll({ 
            where: {
                format: { [Op.iLike]: format.name }, 
                games: { [Op.gte]: 3 },
                serverId: serverId,
                inactive: false,
                '$player.hidden$': false
            },
            include: Player,
            limit: 10,
            order: [['elo', 'DESC']] 
        })
        
        if (!stats.length) return await interaction.reply({ content: `I'm sorry, we don't have any ${format.name} players.`})
        const results = []
        stats.length === 1 ? results[0] = `${server.emoji || format.emoji} --- The Best ${server.internalLadder ? 'Internal ' : ''}${format.name} Player --- ${server.emoji || format.emoji}`
            : results[0] = `${server.emoji || format.emoji} --- Top ${stats.length} ${server.internalLadder ? 'Internal ' : ''}${format.name} Players --- ${server.emoji || format.emoji}`
        
        for (let i = 0; i < stats.length; i++) {
            results[i+1] = `${(i+1)}. ${getMedal(stats[i].elo)} ${stats[i].player.globalName || stats[i].player.discordName}`
        }
        
        if (!server.internalLadder) results.push(`\nFull Leaderboard: https://formatlibrary.com/leaderboards/${urlize(format.name)}`)
        await interaction.reply({ content: results.join('\n') })
    }
}

    