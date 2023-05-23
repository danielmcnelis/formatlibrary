
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
            const input = interaction.options.getString('tournament')     
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

            await generateMatchupData(interaction, server, event)
        } else {
            return await interaction.editReply('🛠️')
        }
    }
}