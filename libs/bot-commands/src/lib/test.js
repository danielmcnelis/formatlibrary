
import { SlashCommandBuilder } from 'discord.js'
import { isProgrammer, updateSets, downloadNewCards } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
// import { client } from '../client'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Performs a test. 🧪'),
    async execute(interaction) {
        if (isProgrammer(interaction.member)) {
            updateSets()
            setTimeout(() => downloadNewCards(), 1 * 60 * 1000)
            await interaction.reply(emojis.yellow)
        } else {
            await interaction.reply('🧪')
        }
    }
}