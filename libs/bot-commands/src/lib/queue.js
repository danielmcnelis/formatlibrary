
import { SlashCommandBuilder } from 'discord.js'
import { Format, Iron, Server, TriviaEntry } from '@fl/models'
import { emojis } from '@fl/bot-emojis'

export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Post the iron queue. 🇬🇧'),
    async execute(interaction) {
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
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
