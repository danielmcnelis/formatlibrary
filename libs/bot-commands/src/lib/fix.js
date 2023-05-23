
import { SlashCommandBuilder } from 'discord.js'
import { isProgrammer } from '@fl/bot-functions'
import { Deck, DeckType, Event, Format, Match, Matchup, Player, Server, Tournament } from '@fl/models'
import { generateMatchupData } from '@fl/bot-functions'
import { Op } from 'sequelize'

export default {
    data: new SlashCommandBuilder()
        .setName('fix')
        .setDescription('Admin Only - Fix an issue. 🛠️')
		.addStringOption(str =>
            str
                .setName('tournament')
                .setDescription('Enter tournament name or abbreviation.')
                .setRequired(true)
        ),
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

            const tournament = topCut ? await Tournament.findOne({
                where: {
                    [Op.or]: {
                        name: input + '_' + topCut,
                        abbreviation: input + '_' + topCut
                    }
                }
            }) : event?.tournament

            if (!tournament) return await interaction.editReply({ content: `No tournament found.` })
            await generateMatchupData(interaction, server, event, tournament)
        } else {
            return await interaction.editReply('🛠️')
        }
    }
}