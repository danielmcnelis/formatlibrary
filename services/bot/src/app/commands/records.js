
import { SlashCommandBuilder } from 'discord.js'
import { Format, Match, Player, Server } from '@fl/models'
import { hasAffiliateAccess } from '../functions/utility'
import { Op } from 'sequelize'
import { emojis } from '../emojis/emojis'

export default {
    data: new SlashCommandBuilder()
        .setName('records')
        .setDescription(`View a player's match records. 📘`)
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
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

        if (!format) return interaction.reply({ content: `Try using **/history** in channels like: <#414575168174948372> or <#629464112749084673>.`})  

        let x = 50
        if (x > 250) return interaction.reply({ content: "Please provide a number less than or equal to 250."})
        
        const user = interaction.options.getUser('player') || interaction.user    
        const discordId = user.id
        const player = await Player.findOne({ where: { discordId: discordId } })
        if (!player) return interaction.reply({ content: "That user is not in the database."})
        const records = [`__**${format.name} Format ${format.emoji} - Last ${x} Match Records**__`]
        const serverId = server.internalLadder ? server.id : '414551319031054346'

        const matches = await Match.findAll({
            where: {
                format: format.name,
                [Op.or]: [
                    { winnerId: player.id }, 
                    { loserId: player.id }
                ],
                limit: x,
                serverId: serverId
            },
            order: [['createdAt', 'DESC']]
        })

        const now = Date.now()

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i]
            const delta = Math.round(match.delta)
            const sign = match.winnerId === player.id ? '+' : '-'
            const outcome = match.winnerId === player.id ? 'Win' : 'Loss'
            const opponent = match.winnerId === player.id ? match.loser : match.winner
            const emoji = match.winnerId === player.id ? emojis.legend : emojis.mad
            const difference = now - match.createdAt
            const timeAgo = difference < 1000 * 60 * 60 ?  `${Math.round(difference / (1000 * 60))} minute(s)` :
                difference >= 1000 * 60 * 60 && difference < 1000 * 60 * 60 * 24 ? `${Math.round(difference / (1000 * 60 * 60))} hour(s)` :
                difference >= 1000 * 60 * 60 * 24 && difference < 1000 * 60 * 60 * 24 * 30 ? `${Math.round(difference / (1000 * 60 * 60 * 24))} day(s)` :
                difference >= 1000 * 60 * 60 * 24 * 30 && difference < 1000 * 60 * 60 * 24 * 365 ? `${Math.round(difference / (1000 * 60 * 60 * 24 * 30))} month(s)` :
                `${Math.round(difference / (1000 * 60 * 60 * 24 * 365))} year(s)`

            const record = `${outcome} ${emoji} vs ${opponent} (${sign}${delta}) - ${timeAgo}`
            records.push(record)
        }

        for (let i = 0; i < records.length; i+=30) {
            interaction.member.send(records.slice(i, i+30).join('\n'))
        }

        return interaction.reply(`Please check your DMs.`)
    }
}
