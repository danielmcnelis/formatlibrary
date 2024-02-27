
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { selectMatch, assignTourRoles, refreshExpiredTokens, updateAvatars, purgeBetaCards, shuffleArray, getMatches, getParticipants, calculateStandings, autoRegisterTopCut, isProgrammer, conductCensus, updateSets, downloadNewCards, updateMarketPrices } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { client } from '../client'
import { Match, Tournament, Server, TriviaQuestion } from '@fl/models'
import axios from 'axios'
// import { config } from '@fl/config'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Admin Only - Performs a test. 🧪')
        .setDMPermission(false)
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to remove.')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply()
        if (isProgrammer(interaction.member)) {
            try {
                const user = interaction.options.getUser('player')
                console.log('user', user)
            } catch (err) {
                console.log(err)
            }
            
            try {
                const member = await interaction.guild?.members.fetch(user?.id)
                console.log('member', member)
            } catch (err) {
                console.log(err)
            }

            // downloadNewCards()
            // updateSets()
            // updateMarketPrices()
            return await interaction.editReply(emojis.yellow)
        } else {
            await interaction.editReply('🧪')
        }
    }
}