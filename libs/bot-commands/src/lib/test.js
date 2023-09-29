
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
            const data = await interaction.guild.invites.fetch()
            const arr = []

            for (const [, value] of data.entries()) {
                arr.push({inviterId: value.inviterId, timestamp: value.createdTimestamp, date: new Date(value.createdTimestamp)})
            }

            console.log(arr.sort((a, b) => b.timestamp - a.timestamp))
            await interaction.editReply(emojis.yellow)
        } else {
            await interaction.editReply('🧪')
        }
    }
}