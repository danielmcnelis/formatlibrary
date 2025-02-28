
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { purgeDuplicatePrices, assignSeasonalLadderRoles, downloadOriginalArtworks, purgeBetaCards, downloadMissingCardImages, recalculateStats, downloadNewCards, lookForAllPotentialPairs, cleanUpPools, manageSubscriptions, updateGlobalNames, updateMarketPrices, conductCensus, calculateStandings, updateAvatars, updateDeckThumbs, updateDeckType, updateDecks, updateBlogPosts, isProgrammer, runMonthlyTasks, runNightlyTasks, updateServers, runFrequentTasks } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { client } from '../client'
import { Match, Tournament, Server, TriviaQuestion } from '@fl/models'
import axios from 'axios'
import { assignTournamentRoles, recalculateAllStats } from '../../../bot-functions/src'
import { Stats } from '../../../models/src'
// import { config } from '@fl/config'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Admin Only - Performs a test. 🧪')
        .setDMPermission(false),
    async execute(interaction) {
        try {
            await interaction.deferReply()
            if (isProgrammer(interaction.member)) {
                await interaction.editReply(emojis.yellow)
                // await runNightlyTasks(client)
                await manageSubscriptions(client)
                await updateAvatars(client)
                await updateMarketPrices()
                // await purgeDuplicatePrices()
                // return await conductCensus(client)
                // await updateDeckType()
                // await updateDecks()
                // await downloadNewCards(client)
                // await updateMatchups()
                // await purgeBetaCards(client)
                // return await downloadOriginalArtworks(client)
                // return downloadMissingCardImages()
                // return lookForAllPotentialPairs(client)
                // return runMonthlyTasks(client)
                // await manageSubscriptions(client)
                // await assignTournamentRoles(client)
                // return assignSeasonalLadderRoles(client)
            } else {
                await interaction.editReply('🧪')
            }
        } catch (err) {
            console.log(err)
        }
    }
}