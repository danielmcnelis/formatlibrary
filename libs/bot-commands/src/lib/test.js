
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { updateGlobalNames, updateMarketPrices, conductCensus, updateAvatars, updateDeckThumbs, updateDeckTypes, updateDecks, updateReplays, updateMatchups, updateBlogPosts, isProgrammer, runMonthlyTasks, runNightlyTasks, updateServers } from '@fl/bot-functions'
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
            // await updateMarketPrices()
            // await conductCensus(client)
            // await updateAvatars(client)
            // await updateDeckThumbs()
            // await updateDeckTypes()
            // await updateDecks()
            // await updateReplays()
            // await updateMatchups()
            // return updateGlobalNames()
            return runNightlyTasks(client)
            // return runMonthlyTasks(client)
        } else {
            await interaction.editReply('🧪')
        }
    }
}