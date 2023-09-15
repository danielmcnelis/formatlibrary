
import { SlashCommandBuilder } from 'discord.js'    
import { hasAffiliateAccess, isMod, isServerManager } from '@fl/bot-functions'
import { Format, Server } from '@fl/models'

export default {
    data: new SlashCommandBuilder()
        .setName('format')
        .setDescription(`Set the format for your server. `)
		.addStringOption(option =>
			option.setName('format')
				.setDescription('Enter format name')
				.setAutocomplete(true)
                .setRequired(true)
        ),    
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused()
        const formats = await Format.findAll({ 
            where: { 
                cleanName: focusedValue.toLowerCase(),
                game: 'YGO'
            }
        })
    
		await interaction.respond(
			formats.map(f => ({ name: f.name, value: f.id })),
		)
    },            
    async execute(interaction) {
        await interaction.deferReply()
        const formatId = interaction.options.getString('format')
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (hasAffiliateAccess(server) && !isMod(server, interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.`})
        if (!hasAffiliateAccess(server) && !isServerManager(interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that. You must have the "Server Manager" permission to set the format.`})
        
        const format = await Format.findOne({
            where: {
                id: formatId 
            }
        })

        const hadFormatSet = !!server.format

        await server.update({
            format: format.name,
            emoji: format.emoji
        })

        return await interaction.editReply({ content: `This server's format has been ${hadFormatSet ? 'set' : 'changed'} to: ${format.name} ${format.emoji} Format!`})	 
    }
}
