
import { SlashCommandBuilder } from 'discord.js'
import { shuffleArray, getMatches, getParticipants, calculateStandings, autoRegisterTopCut, isProgrammer, conductCensus, updateSets, downloadNewCards, updateMarketPrices } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { client } from '../client'
import { Tournament, Server, TriviaQuestion } from '@fl/models'
import axios from 'axios'
// import { config } from '@fl/config'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Admin Only - Performs a test. 🧪'),
    async execute(interaction) {
        await interaction.deferReply()
        if (isProgrammer(interaction.member)) {
            console.log(`all questions have been asked!`)
            let askedQuestions = await TriviaQuestion.findAll()

            const shuffledQuestions = shuffleArray(askedQuestions)

            for (let i = 0; i < shuffledQuestions.length; i++) {
                const q = shuffledQuestions[i]
                await q.update({
                    order: i + 1,
                    askedRecently: false
                })
            }

            await interaction.editReply(emojis.yellow)
        } else {
            await interaction.editReply('🧪')
        }
    }
}