
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { isMod, hasPartnerAccess } from '@fl/bot-functions'

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
        if (!isMod(server, interaction.member)) return await interaction.reply({ content: 'You do not have permission to do that.'})

        const format = await Format.findByServerOrChannelId(server, interaction.channelId)

		const modal = new ModalBuilder()
            .setCustomId(`create-${type}`)
            .setTitle('Create a New Tournament')

        const name = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('Full name of the tournament?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)

        const abbreviation = new TextInputBuilder()
            .setCustomId('abbreviation')
            .setLabel('Abbreviation for the tournament?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)

        const nameRow = new ActionRowBuilder().addComponents(name)
        const abbreviationRow = new ActionRowBuilder().addComponents(abbreviation)
        modal.addComponents(nameRow, abbreviationRow)
        
        if (type === 'SW') {
            const tieBreakerOne = new TextInputBuilder()
                .setCustomId('tb1')
                .setLabel('Tie breaker #1? (OWP, OOWP, MB, WVT, PD)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Opponents\' Win Percentage (OWP)')
                .setRequired(false)

            const tieBreakerTwo = new TextInputBuilder()
                .setCustomId('tb2')
                .setLabel('Tie breaker #2? (OWP, OOWP, MB, WVT, PD)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Opponents\' Opponents\' Win Percentage (OOWP)')
                .setRequired(false)
            
            const tb1Row = new ActionRowBuilder().addComponents(tieBreakerOne)
            const tb2Row = new ActionRowBuilder().addComponents(tieBreakerTwo)
            modal.addComponents(tb1Row, tb2Row)
        }

        if (!format) {
            const formatName = new TextInputBuilder()
                .setCustomId('formatName')
                .setLabel('What format will be played?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                
            const formatRow = new ActionRowBuilder().addComponents(formatName)
            modal.addComponents(formatRow)  
        } else if (interaction.guildId !== '414551319031054346') {
            const channelName = new TextInputBuilder()
                .setCustomId('channelName')
                .setLabel('What channel will host this event?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            
            channelName.setValue(interaction.channel.name)
            channelName.setPlaceholder(interaction.channel.name)
            const channelRow = new ActionRowBuilder().addComponents(channelName)
            modal.addComponents(channelRow)
        }
    
        return await interaction.showModal(modal)        
    }
}