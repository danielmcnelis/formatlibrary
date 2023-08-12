
import { SlashCommandBuilder } from 'discord.js'
import { getMatches, getParticipants, calculateStandings, autoRegisterTopCut, isProgrammer, conductCensus, updateSets, downloadNewCards, updateMarketPrices } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { client } from '../client'
import { Tournament, Server } from '@fl/models'
import axios from 'axios'
import parse from 'html-react-parser'
// import { config } from '@fl/config'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Admin Only - Performs a test. 🧪'),
    async execute(interaction) {
        await interaction.deferReply()
        if (isProgrammer(interaction.member)) {
            const {data} = await axios.get('https://www.duelingbook.com/replay?id=5213728')
            console.log('data', data)
            const html = parse(data)
            console.log('html', html)
            console.log('html.player1', html.player1)
            console.log('html.player2', html.player2)
            await interaction.editReply(emojis.yellow)
        } else {
            await interaction.editReply('🧪')
        }
    }
}