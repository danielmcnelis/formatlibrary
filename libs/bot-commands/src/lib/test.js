
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { downloadOriginalArtworks, downloadAltArtworks, downloadCardArtworks, updateDeckTypes, updateServers, markInactives, purgeEntries, purgeTourRoles, purgeLocalsAndInternalDecks, updateDecks, updateMatchups, updateReplays, selectMatch, assignTourRoles, refreshExpiredTokens, updateAvatars, purgeBetaCards, shuffleArray, getMatches, getParticipants, calculateStandings, autoRegisterTopCut, isProgrammer, conductCensus, updateSets, downloadNewCards, updateMarketPrices } from '@fl/bot-functions'
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
            downloadOriginalArtworks()
            // downloadAltArtworks()
            // downloadCardArtworks()
            // downloadNewCards()
            // setTimeout(() => refreshExpiredTokens())
            // setTimeout(() => purgeEntries(), (0.1 * 60 * 1000))
            // setTimeout(() => purgeTourRoles(client), (0.2 * 60 * 1000))
            // setTimeout(() => purgeLocalsAndInternalDecks(client), (0.3 * 60 * 1000))
            // setTimeout(() => assignTourRoles(client), (0.4 * 60 * 1000))
            // setTimeout(() => markInactives(), (0.6 * 60 * 1000))
            // setTimeout(() => updateServers(client), (0.8 * 60 * 1000))
            // setTimeout(() => updateSets(), (1 * 60 * 1000))
            // setTimeout(() => downloadNewCards(), (2 * 60 * 1000))
            // setTimeout(() => downloadAltArtworks(), midnightCountdown + (2.5 * 60 * 1000))
            // setTimeout(() => updateMarketPrices(), (3 * 60 * 1000))
            // setTimeout(() => conductCensus(client), (4 * 60 * 1000))
            // setTimeout(() => updateAvatars(client), (11 * 60 * 1000))
            // setTimeout(() => updateDeckTypes(client), (13 * 60 * 1000))
            // setTimeout(() => updateDecks(), (14 * 60 * 1000))
            // setTimeout(() => updateReplays(), (15 * 60 * 1000))
            // setTimeout(() => updateMatchups(), (16 * 60 * 1000))
            return await interaction.editReply(emojis.yellow)
        } else {
            await interaction.editReply('🧪')
        }
    }
}