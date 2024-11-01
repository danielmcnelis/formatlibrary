
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { updateBlogPosts, isProgrammer, runMonthlyTasks, runNightlyTasks, updateAvatars, updateServers } from '@fl/bot-functions'
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
            const guilds = [...client.guilds.cache.values()]
            console.log('guilds', guilds)
            await updateServers(client)
            // await updateDecks()
            // await updateReplays()
            // await updateMatchups()
            await updateBlogPosts()
            return await updateBlogPosts()

            // return runNightlyTasks(client)
            // return runMonthlyTasks(client)
        } else {
            await interaction.editReply('🧪')
        }
    }
}