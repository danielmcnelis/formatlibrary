
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { updateGlobalNames, updateMarketPrices, conductCensus, calculateStandings, updateAvatars, updateDeckThumbs, updateDeckTypes, updateDecks, updateBlogPosts, isProgrammer, runMonthlyTasks, runNightlyTasks, updateServers } from '@fl/bot-functions'
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
            // return await conductCensus(client)
            const tournament = await Tournament.findOne({ where: { id: '15458395'}})
            console.log('interaction.guildId', interaction.guildId)
            const server = await Server.findOne({ where: { id: interaction.guildId }})
            const { data: matches } = await axios.get(`https://api.challonge.com/v1/tournaments/15390013/matches.json?api_key=${server.challongeApiKey}`)
            const { data: participants } = await axios.get(`https://api.challonge.com/v1/tournaments/15390013/participants.json?api_key=${server.challongeApiKey}`)
            const {participant} = participants[5]
            const standings = await calculateStandings(tournament, matches, participants)                
            console.log('standings', standings)
            console.log('participant', participant)
            console.log('participant.id', participant.id)
            console.log('participant.id === 247112168', participant.id === 247112168)
            const standing = standings?.find((s) => s.participantId === 247112168)
            console.log('standing', standing)
            console.log('standing && standing.rank', standing && standing.rank)
            console.log(`parseInt(standing.rank.replace(/^D+/g, ''))`, parseInt(standing?.rank?.replace(/^\D+/g, '')))
            console.log('participant.final_rank', participant?.final_rank)
            const placement = standing && standing.rank ? parseInt(standing.rank.replace(/^\D+/g, '')) :
                participant.final_rank ? parseInt(participant.final_rank) :
                null
            return console.log('placement', placement)
            // await updateAvatars(client)
            // await updateDeckThumbs()
            // await updateDeckTypes()
            // await updateDecks()
            // await updateReplays()
            // await updateMatchups()
            // return updateGlobalNames()
            // return runNightlyTasks(client)
            // return runMonthlyTasks(client)
        } else {
            await interaction.editReply('🧪')
        }
    }
}