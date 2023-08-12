
import { SlashCommandBuilder } from 'discord.js'
import { getMatches, getParticipants, calculateStandings, autoRegisterTopCut, isProgrammer, conductCensus, updateSets, downloadNewCards, updateMarketPrices } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { client } from '../client'
import { Tournament, Server } from '@fl/models'
// import axios from 'axios'
// import { config } from '@fl/config'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Admin Only - Performs a test. 🧪'),
    async execute(interaction) {
        await interaction.deferReply()
        if (isProgrammer(interaction.member)) {
            updateMarketPrices(client)
            await interaction.editReply(emojis.yellow)
        } else {
            await interaction.editReply('🧪')
        }
    }
}