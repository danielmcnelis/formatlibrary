
import { SlashCommandBuilder } from 'discord.js'
import { isProgrammer } from '@fl/bot-functions'
import { Deck, DeckType, Event, Format, Match, Matchup, Player, Replay, Server, Tournament } from '@fl/models'
import { calculateStandings, generateMatchupData, fixPlacements } from '@fl/bot-functions'
import { Op } from 'sequelize'
import axios from 'axios'

export default {
    data: new SlashCommandBuilder()
        .setName('fix')
        .setDescription('Admin Only - Fix an issue. 🛠️')
		// .addStringOption(str =>
        //     str
        //         .setName('tournament')
        //         .setDescription('Enter tournament name or abbreviation.')
        //         .setRequired(true)
        // )
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply()
        if (isProgrammer(interaction.member)) {
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            // const [input, topCut] = interaction.options.getString('tournament').split('_')
            const replays = await Replay.findAll({ 
                where: { 
                    suggestedOrder: null,
                    matchId: {[Op.not]: null}
                },
                include: Match
            })

            const data = {}
            let b = 0
            let e = 0

            for (let i = 0; i < replays.length; i++) {
                try {
                    const replay = replays[i]
                    if (!data[replay.tournamentId]) {
                        const {data: allMatches} = await axios.get(`https://api.challonge.com/v1/tournaments/${replay.tournamentId}/matches.json?api_key=${server.challongeAPIKey}`).catch((err) => console.log(err))
                        data[replay.tournamentId] = allMatches
                    }
                    
                    if (Array.isArray(data[replay.tournamentId])) {
                        const index = data[replay.tournamentId].findIndex((m) => m.match?.id === replay?.match?.challongeMatchId)
                        if (Number.isInteger(index)) {
                            const suggestedOrder = index + 1
                            await replay.update({ suggestedOrder })
                            b++
                        }
                    }
                } catch (err) {
                    console.log(err)
                    e++
                }
            }

            return await interaction.editReply(`Fixed ${b} out of ${replays.length} replays. Encounted ${e} errors.`)
        } else {
            return await interaction.editReply('🛠️')
        }
    }
}