
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { isProgrammer, runMonthlyTasks, runNightlyTasks } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { client } from '../client'
import { Match, Tournament, Server, TriviaQuestion } from '@fl/models'
import axios from 'axios'
// import { config } from '@fl/config'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Admin Only - Performs a test. 🧪')
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply()
        if (isProgrammer(interaction.member)) {
            await interaction.editReply(emojis.yellow)
            return await runMonthlyTasks(client)
        } else {
            await interaction.editReply('🧪')
        }
    }
}