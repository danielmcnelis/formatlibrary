
import { SlashCommandBuilder } from 'discord.js'    
import { hasPartnerAccess, isMod, isServerManager } from '@fl/bot-functions'
import { Format, Server } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { Op } from 'sequelize'

export default {
    data: new SlashCommandBuilder()
        .setName('format')
        .setDescription(`Set the format for your server. `)
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Enter format name')
				.setAutocomplete(true)
                .setRequired(true)
        )
        .setDMPermission(false),    
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused()
        const formats = await Format.findAll({ 
            where: { 
                cleanName: {[Op.iLike]: '%' + focusedValue.toLowerCase() + '%'},
                category: {[Op.not]: 'OP'}
            },
            limit: 5,
            order: [["popular", "DESC"], ["name", "ASC"]]
        })
    
		await interaction.respond(
			formats.map(f => ({ name: f.name, value: f.name })),
		)
    },            
    async execute(interaction) {
        await interaction.deferReply()
        const name = interaction.options.getString('name')
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (server.access === 'full') return await interaction.editReply({ content: `This command has no application on Format Library. ${emojis.FL}`})
        if (hasPartnerAccess(server) && !isMod(server, interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.`})
        if (!hasPartnerAccess(server) && !isServerManager(interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that. You must have the "Server Manager" permission to set the format.`})

        const format = await Format.findOne({ where: { name }})
        const hadFormatSet = !!server.format

        await server.update({
            format: format.name,
            emoji: format.emoji
        })

        return await interaction.editReply({ content: `This server's format has been ${hadFormatSet ? 'set' : 'changed'} to: ${format.name} ${format.emoji} Format!`})	 
    }
}
