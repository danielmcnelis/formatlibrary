
import { SlashCommandBuilder } from 'discord.js'
import { Event, Format, Player, Server } from '@fl/models'
import { hasFullAccess, isMod } from '../functions/utility'
import { Op } from 'sequelize'
import { composeBlogPost, composeThumbnails, displayDecks } from '../functions/coverage'

export default {
    data: new SlashCommandBuilder()
        .setName('coverage')
        .setDescription('Post tournament coverage. 🖊️')
		.addStringOption(str =>
            str
                .setName('tournament')
                .setDescription('Enter tournament name.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasFullAccess(server)) return interaction.reply(`This feature is only available in Format Library. ${emojis.FL}`) 
        if (!isMod(server, interaction.member)) return interaction.reply(`You do not have permission to do that.`)
        
        const input = interaction.options.getString('tournament')     
        const event = await Event.findOne({ 
            where: { 
                [Op.or]: {
                    name: input,
                    abbreviation: input
                }
            },
            include: [Format, Player]
        })

        if (!event) return interaction.reply(`No event found.`)
        if (event.display === false) await event.update({ display: true })

        interaction.reply(`Generating coverage for ${event.name}. Please wait.`)
        await displayDecks(interaction, event)
        await composeThumbnails(interaction, event)
        await composeBlogPost(interaction, event)
        return
    }
}