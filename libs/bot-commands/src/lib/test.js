
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { downloadOriginalArtworks, downloadAltArtworks, downloadCardArtworks, updateDeckThumbs, updateDeckTypes, updateServers, markInactives, purgeEntries, purgeTourRoles, purgeLocalsAndInternalDecks, updateDecks, updateMatchups, updateReplays, selectMatch, assignTourRoles, refreshExpiredTokens, updateAvatars, purgeBetaCards, shuffleArray, getMatches, getParticipants, calculateStandings, autoRegisterTopCut, isProgrammer, conductCensus, updateSets, downloadNewCards, updateMarketPrices, updateSingleAvatar } from '@fl/bot-functions'
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
            // await refreshExpiredTokens()
            // await purgeEntries()
            // await purgeTourRoles(client)
            // await purgeLocalsAndInternalDecks(client)
            // await assignTourRoles(client)
            // await markInactives()
            // await updateServers(client)
            // await updateSets()
            // await downloadNewCards()
            // await downloadAltArtworks()
            // await updateMarketPrices()
            // await conductCensus(client)
            // await updateAvatars(client)
            // await updateDeckThumbs()
            // await updateDeckTypes()
            // await updateDecks()
            // await updateReplays()
            // await updateMatchups()
            return await interaction.editReply(emojis.yellow)
        } else {
            await interaction.editReply('🧪')
        }
    }
}