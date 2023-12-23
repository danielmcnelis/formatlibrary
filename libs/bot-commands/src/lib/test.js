
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { updateAvatars, purgeBetaCards, shuffleArray, getMatches, getParticipants, calculateStandings, autoRegisterTopCut, isProgrammer, conductCensus, updateSets, downloadNewCards, updateMarketPrices } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { client } from '../client'
import { Tournament, Server, TriviaQuestion } from '@fl/models'
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
            await updateSets()
            await updateMarketPrices()
            return
        } else {
            await interaction.editReply('🧪')
        }
    }
}