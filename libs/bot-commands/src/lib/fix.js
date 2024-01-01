
import { SlashCommandBuilder } from 'discord.js'
import { isProgrammer } from '@fl/bot-functions'
import { Deck, DeckType, Event, Format, Match, Matchup, Player, Server, Tournament } from '@fl/models'
import { calculateStandings, generateMatchupData, fixPlacements } from '@fl/bot-functions'
import { Op } from 'sequelize'
import axios from 'axios'

export default {
    data: new SlashCommandBuilder()
        .setName('fix')
        .setDescription('Admin Only - Fix an issue. 🛠️')
		.addStringOption(str =>
            str
                .setName('tournament')
                .setDescription('Enter tournament name or abbreviation.')
                .setRequired(true)
        )
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply()
        if (isProgrammer(interaction.member)) {
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            const [input, topCut] = interaction.options.getString('tournament').split('_')
            const event = await Event.findOne({ 
                where: { 
                    [Op.or]: {
                        name: input,
                        abbreviation: input
                    }
                },
                include: [Format, Player, Tournament]
            })

            if (!event) return await interaction.editReply({ content: `No event found.` })

            const {data: participants} = await axios.get(`https://api.challonge.com/v1/tournaments/${event?.tournament?.id}/participants.json?api_key=${server.challongeAPIKey}`).catch((err) => console.log(err))
            const {data: matches} = await axios.get(`https://api.challonge.com/v1/tournaments/${event?.tournament?.id}/matches.json?api_key=${server.challongeAPIKey}`).catch((err) => console.log(err))
            const standings = await calculateStandings(event?.tournament, matches, participants)
            await fixPlacements(event, participants, standings)
        } else {
            return await interaction.editReply('🛠️')
        }
    }
}