
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
            // conductCensus(client)
            // updateMarketPrices(client)
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            const tournament = await Tournament.findOne({
                where: { 
                    id: '13191851'
                }
            })
            
            const topCutTournament = await Tournament.findOne({
                where: { 
                    id: '13285197'
                }
            })
            
            const matches = await getMatches(server, tournament.id)
            const participants = await getParticipants(server, tournament.id)
            const standings = await calculateStandings(matches, participants)
            const {errors, size} = await autoRegisterTopCut(server, tournament, topCutTournament, standings)
            if (errors.length > 1) {
                interaction.channel.send({ content: errors })
            } else {
                interaction.channel.send({ content: `Successfully registered the Top ${size} players in the new bracket! Please review the bracket and type **/start** if everything looks good. ${emojis.mlday}` })
            }

            await interaction.editReply(emojis.yellow)
        } else {
            await interaction.editReply('🧪')
        }
    }
}