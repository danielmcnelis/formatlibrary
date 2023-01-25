
import { SlashCommandBuilder } from 'discord.js'    
import { hasAffiliateAccess, getMedal } from '../functions/utility'
import { emojis } from '../emojis/emojis'
import { Format, Player, Server, Stats } from '@fl/models'
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
        ),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasAffiliateAccess(server)) return interaction.reply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

        if (!format) return interaction.reply({ content: `Try using **/stats** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const user = interaction.options.getUser('player') || interaction.user
        const discordId = user.id	
        const player = await Player.findOne({ where: { discordId: discordId } })
        if (!player) return interaction.reply({ content: "That user is not in the database."})
        const serverId = server.internalLadder ? server.id : '414551319031054346'

        const stats = await Stats.findOne({ 
            where: { 
                playerId: player.id, 
                format: {[Op.iLike]: format.name}, 
                [Op.or]: [
                    { wins: { [Op.not]: null } }, 
                    { losses: { [Op.not]: null } }, 
                ],
                serverId: serverId
            } 
        })

        const allStats = await Stats.findAll({ 
            where: {
                format: { [Op.iLike]: format.name }, 
                games: { [Op.gte]: 3 },
                serverId: serverId,
                inactive: false,
                '$player.hidden$': false
            },
            include: [Player],
            order: [['elo', 'DESC']] 
        })

        const index = allStats.length ? allStats.findIndex((s) => s.playerId === player.id) : null
        const rank = stats && index >= 0 ? `#${index + 1} out of ${allStats.length}` : `N/A`
        const elo = stats ? stats.elo.toFixed(2) : `500.00`
        const medal = getMedal(elo, true)
        const wins = stats ? stats.wins : 0
        const losses = stats ? stats.losses : 0
        const winrate = wins || losses ? `${(100 * wins / (wins + losses)).toFixed(2)}%` : 'N/A'		

        return interaction.reply({ content: 
            `${server.emoji || format.emoji} --- ${format.name} Stats --- ${server.emoji || format.emoji}`
            + `${server.internalLadder ? `\nServer: ${server.name}` : ''}`
            + `\nName: ${player.name}`
            + `\nMedal: ${medal}`
            + `\nRanking: ${rank}`
            + `\nElo Rating: ${elo}`
            + `\nWins: ${wins}, Losses: ${losses}`
            + `\nWin Rate: ${winrate}`
        })
    }
}