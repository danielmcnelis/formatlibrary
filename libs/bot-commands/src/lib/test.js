
import { SlashCommandBuilder } from 'discord.js'
import { shuffleArray, getMatches, getParticipants, calculateStandings, autoRegisterTopCut, isProgrammer, conductCensus, updateSets, downloadNewCards, updateMarketPrices } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { client } from '../client'
import { Player, Tournament, Server, TriviaQuestion } from '@fl/models'
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
                const player = await Player.findOne({
                    where: {
                        discordId: value.inviterId
                    }
                })

                arr.push({inviterName: player?.name, inviterId: value.inviterId, uses: value.uses, createdAt: value.createdTimestamp, expiresAt: value._expiresTimestamp, expirationDate: new Date(value._expiresTimestamp), creationDate: new Date(value.createdTimestamp)})
            }

            console.dir(arr.sort((a, b) => a.createdAt - b.createdAt), {'maxArrayLength': null})
            await interaction.editReply(emojis.yellow)
        } else {
            await interaction.editReply('🧪')
        }
    }
}