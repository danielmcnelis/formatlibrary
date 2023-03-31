
import { SlashCommandBuilder } from 'discord.js'
import { isProgrammer, updateSets, downloadNewCards, updateMarketPrices } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
// import { client } from '../client'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Performs a test. 🧪'),
    async execute(interaction) {
        if (isProgrammer(interaction.member)) {
            updateMarketPrices()
            await interaction.reply(emojis.yellow)
        } else {
            await interaction.reply('🧪')
        }
    }
}