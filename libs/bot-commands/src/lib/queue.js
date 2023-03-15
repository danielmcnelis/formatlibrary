
import { SlashCommandBuilder } from 'discord.js'
import { Format, Iron, Server } from '@fl/models'
import { hasFullAccess } from '@fl/bot-functions'
import { Op } from 'sequelize'
import { emojis } from '@fl/bot-emojis'

export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Post the iron queue. 🇬🇧'),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
        await Server.findOne({ where: { id: interaction.guildId }}) || 
        await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        if (!hasFullAccess(server)) return await interaction.reply({ content: `This feature is only available in Format Library. ${emojis.FL}`})
        
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
        
        if (!format && interaction.channel.name !== 'trivia') return await interaction.reply({ content: `Try using **/queue** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        
        const queue = format ? [...await Iron.findAll({ where: { format: format.name }})].map((i) => i.name) : [...await TriviaEntry.findAll()].map((entry) => entry.playerName)
        
        if (!queue.length) {
            if (format) {
                return await interaction.reply({ content: `The ${format.name} ${format.emoji} Iron queue is empty. ${emojis.iron}`})
            } else {
                return await interaction.reply({ content: `The Trivia queue is empty. 📚 🐛`})
            }
        } else {
            if (format) {
                return await interaction.reply({ content: `${format.name} ${server.emoji || format.emoji} Iron Queue:\n` + queue.join('\n').toString() })
            } else {
                return await interaction.reply({ content: `Trivia Queue:\n` + queue.join('\n').toString() })
            }
        }
    }
}
