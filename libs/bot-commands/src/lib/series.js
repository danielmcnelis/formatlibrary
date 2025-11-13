
import { SlashCommandBuilder } from 'discord.js'
import { Series, Server } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { Op } from 'sequelize'
import { isProgrammer, hasPartnerAccess } from '@fl/bot-functions'

export default {
    data: new SlashCommandBuilder()
        .setName('series')
        .setDescription('Admin Only - Create a new tournament series.')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Enter series name')
				.setAutocomplete(true)
                .setRequired(true)
        ).addStringOption(option =>
			option.setName('abbreviation')
				.setDescription('Enter series abbreviation')
				.setAutocomplete(true)
                .setRequired(true)
        )
        .addStringOption(option =>
			option.setName('emoji')
				.setDescription('Enter series emoji')
				.setAutocomplete(true)
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('role-1')
                .setDescription('Role that allows users to enter.')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('role-2')
                .setDescription('Role that allows users to enter.')
                .setRequired(false))
        .setDMPermission(false),    
    async execute(interaction) {
        try {
            if (!isProgrammer(interaction.member)) return await interaction.editReply('🧪')
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            const communityName = server.communityName
            const serverId = server.id
            if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            const name = interaction.options.getString('name')
            const abbreviation = interaction.options.getString('abbreviation')
            const emoji = interaction.options.getString('emoji')
            const requiredRole1 = interaction.options.getRole('role-1')
            const requiredRole2 = interaction.options.getRole('role-2')
            console.log('requiredRole1', requiredRole1)
            console.log('requiredRole2', requiredRole2)

            let series = await Series.findOne({
                where: {
                    [Op.or]: {
                        name,
                        abbreviation
                    }
                }
            })

            if (series) {
                return await interaction.replay({ content: `Error: series already exists. (${series.name} - ${series.abbreviation})`})  
            } else {
                series = await Series.create({
                    communityName,
                    serverId,
                    name,
                    abbreviation,
                    emoji,
                    requiredRoleId: requiredRole1,
                    alternateRoleId: requiredRole2
                })

                return await interaction.reply({ content: `Created new series: ${series.name} ${emoji} (${series.abbreviation})` })
            }
     
        } catch (err) {
            console.log(err)
        }
    }
}