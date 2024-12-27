
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { recalculateStats, lookForAllPotentialPairs, cleanUpPools, manageSubscriptions, updateGlobalNames, updateMarketPrices, conductCensus, calculateStandings, updateAvatars, updateDeckThumbs, updateDeckTypes, updateDecks, updateBlogPosts, isProgrammer, runMonthlyTasks, runNightlyTasks, updateServers, runHourlyTasks } from '@fl/bot-functions'
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
            // return await manageSubscriptions(client)
            // await updateMarketPrices()
            // return await conductCensus(client)
            // await updateAvatars(client)
            // await updateDeckThumbs()
            // await updateDeckTypes()
            // await updateDecks()
            // await updateReplays()
            // await updateMatchups()
            // return updateGlobalNames()
            return recalculateStats()
            // return runNightlyTasks(client)
            // return runMonthlyTasks(client)
        } else {
            await interaction.editReply('🧪')
        }
    }
}