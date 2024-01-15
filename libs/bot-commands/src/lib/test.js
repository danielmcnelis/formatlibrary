
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
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply()
        if (isProgrammer(interaction.member)) {
            await interaction.editReply(emojis.yellow)
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            const tournament = await Tournament.findOne({ where: { id: '13970812' }})
            const matches = await Match.findAll({ where: { tournamentId: '13970812' }})

            const {data: tournamentData} = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`).catch((err) => console.log(err))
            
            for (let i = 0; i < matches.length;i++) {
                const match = matches[i]
                const {data: challongeMatch} = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/matches/${match.challongeMatchId}.json?api_key=${server.challongeAPIKey}`).catch((err) => console.log(err))
                if (!challongeMatch) return await interaction.editReply({ content: `Error: Challonge match not found.`})	
                let roundName
                const round = challongeMatch?.match?.round
                if (tournament.type === 'swiss' || tournament.type === 'round robin') {
                    roundName = `Round ${challongeMatch?.match?.round}`
                } else if (tournament.type === 'single elimination') {
                    const rounds = Math.ceil(Math.log2(tournamentData.participants_count))
                    console.log('rounds', rounds, 'round', round)
                    roundName = rounds - round === 0 ? 'Finals' :
                        rounds - round === 1 ? 'Semi Finals' :
                        rounds - round === 2 ? 'Quarter Finals' :
                        rounds - round === 3 ? 'Round of 16' :
                        rounds - round === 4 ? 'Round of 32' :
                        rounds - round === 5 ? 'Round of 64' :
                        rounds - round === 6 ? 'Round of 128' :
                        rounds - round === 7 ? 'Round of 256' :
                        null
                } else if (tournament.type === 'double elimination') {
                    const rounds = Math.ceil(Math.log2(tournamentData.participants_count))
                    console.log('rounds', rounds, 'round', round)
                    if (round > 0) {
                        roundName = rounds - round < 0 ? 'Grand Finals' :
                            rounds - round === 0 ? 'Grand Finals' :
                            rounds - round === 1 ? `Winner's Finals` :
                            rounds - round === 2 ? `Winner's Semi Finals` :
                            rounds - round === 3 ? `Winner's Quarter Finals` :
                            `Winner's Round ${round}`
                    } else {
                        roundName = rounds - Math.abs(round) === -1 ? `Loser's Finals` :
                            rounds - Math.abs(round) === 0 ? `Loser's Semi Finals` :
                            rounds - Math.abs(round) === 1 ? `Loser's Quarter Finals` :
                            `Loser's Round ${Math.abs(round)}`
                    }
                } else {
                    roundName = `${challongeMatch?.match?.round}`
                }
                console.log(`${match.winner} > ${match.loser}`, 'roundName', roundName)
            }
            return
        } else {
            await interaction.editReply('🧪')
        }
    }
}