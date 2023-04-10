
import { SlashCommandBuilder } from 'discord.js'
import { conductCensus, isProgrammer, downloadCardArtworks } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { client } from '../client'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Performs a test. 🧪'),
    async execute(interaction) {
        if (isProgrammer(interaction.member)) {
            conductCensus(client)
            await interaction.reply(emojis.yellow)
        } else {
            await interaction.reply('🧪')
        }
    }
}