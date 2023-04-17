
import { SlashCommandBuilder } from 'discord.js'
import { Event, Format, Player, Server } from '@fl/models'
import { composeBlogPost, composeThumbnails, displayDecks, publishDecks, hasFullAccess, isMod } from '@fl/bot-functions'
import { Op } from 'sequelize'
import { emojis } from '@fl/bot-emojis'

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
        await interaction.deferReply()
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasFullAccess(server)) return await interaction.editReply(`This feature is only available in Format Library. ${emojis.FL}`) 
        if (!isMod(server, interaction.member)) return await interaction.editReply(`You do not have permission to do that.`)
        
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

        if (!event) return await interaction.editReply(`No event found.`)
        if (event.display === false) await event.update({ display: true })

        interaction.editReply(`Generating coverage for ${event.name}. Please wait.`)
        await displayDecks(interaction, event)
        await publishDecks(interaction, event)
        await composeThumbnails(interaction, event)
        console.log('event.community', event.community)
        if (event.community !== 'Konami' && event.communtiy !== 'Upper Deck Entertainment') {
            await composeBlogPost(interaction, event)
        }
        return
    }
}