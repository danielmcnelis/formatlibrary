
import { SlashCommandBuilder } from 'discord.js'
import { isProgrammer } from '@fl/bot-functions'
// import { updateDeckTypes } from '@fl/bot-functions'
import { testSeed } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
// import { client } from '../client'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Performs a test. 🧪'),
    async execute(interaction) {
        if (isProgrammer(interaction.member)) {
            console.log('WTF')
            testSeed()
            await interaction.reply(emojis.yellow)
        } else {
            await interaction.reply('🧪')
        }
    }
}