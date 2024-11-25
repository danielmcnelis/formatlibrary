
import { SlashCommandBuilder } from 'discord.js'
import { TriviaEntry } from '@fl/models'

export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Post the queue. 🇬🇧')
        .setDMPermission(false),
    async execute(interaction) {
        if (interaction.channel.name !== 'trivia') return await interaction.reply({ content: `Try using **/queue** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const queue = [...await TriviaEntry.findAll()].map((entry) => entry.playerName)
        
        if (!queue.length) {
            return await interaction.reply({ content: `The Trivia queue is empty. 📚 🐛`})
        } else {
            return await interaction.reply({ content: `Trivia Queue:\n` + queue.join('\n').toString() })
        }
    }
}
