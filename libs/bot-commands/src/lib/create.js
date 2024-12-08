
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { isModerator, hasPartnerAccess } from '@fl/bot-functions'

export default {
    data: new SlashCommandBuilder()
        .setName('create')
        .setDescription('Mod Only - Create a tournament. 🎉')
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Select a tournament type.')
                .setRequired(true)
                .addChoices(
					{ name: 'Swiss', value: 'SW' },	
					{ name: 'Single Elimination', value: 'SE' },	
					{ name: 'Double Elimination', value: 'DE' },	
					{ name: 'Round Robin', value: 'RR' },	
			)
        )
        .setDMPermission(false),
    async execute(interaction) {
        const type = interaction.options.getString('type')
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isModerator(server, interaction.member)) return await interaction.reply({ content: 'You do not have permission to do that.'})

        const format = await Format.findByServerOrChannelId(server, interaction.channelId)

		const modal = new ModalBuilder()
            .setCustomId(`create-${type}`)
            .setTitle('Create a New Tournament')

        const name = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('Full name of the tournament?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        
        const duration = new TextInputBuilder()
            .setCustomId('abbreviation')
            .setLabel('Live or Multi-Day? (L, M)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Live')
            .setRequired(false)

        const ranked = new TextInputBuilder()
            .setCustomId('ranked')
            .setLabel('Ranked or Unranked? (R, U)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ranked')
            .setRequired(false)

        const nameRow = new ActionRowBuilder().addComponents(name)
        const durationRow = new ActionRowBuilder().addComponents(duration)
        const rankedRow = new ActionRowBuilder().addComponents(ranked)
        modal.addComponents(nameRow, durationRow, rankedRow)
        
        if (interaction.guildId !== '414551319031054346') {
            const channelName = new TextInputBuilder()
                .setCustomId('channelName')
                .setLabel('What channel will host this event?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            
            channelName.setPlaceholder(interaction.channel.name)
            const channelRow = new ActionRowBuilder().addComponents(channelName)
            modal.addComponents(channelRow)
        } else if (!format) {
            const formatName = new TextInputBuilder()
                .setCustomId('formatName')
                .setLabel('What format will be played?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                
            const formatRow = new ActionRowBuilder().addComponents(formatName)
            modal.addComponents(formatRow)  
        }
    
        return await interaction.showModal(modal)        
    }
}