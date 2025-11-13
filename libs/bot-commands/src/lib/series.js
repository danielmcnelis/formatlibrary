
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
			option.setName('server')
				.setDescription('Enter host server')
				.setAutocomplete(true)
                .setRequired(true)
        )
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Enter series name')
                .setRequired(true)
        ).addStringOption(option =>
			option.setName('abbreviation')
				.setDescription('Enter series abbreviation')
                .setRequired(true)
        )
        .addStringOption(option =>
			option.setName('emoji')
				.setDescription('Enter series emoji')
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
    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused()
            const servers = await Server.findAll({
                where: {
                    access: {[Op.not]: 'free'},
                    name: {[Op.iLike]: `%${focusedValue}%`}
                },
                order: [['size', 'DESC']],
                limit: 25
            })

            await interaction.respond(
                servers.map(s => ({ name: s.name, value: s.id })),
            )
        } catch (err) {
            console.log(err)
        }
    },      
    async execute(interaction) {
        try {
            if (!isProgrammer(interaction.member)) return await interaction.editReply('🧪')
            const serverId = interaction.options.getString('server')
            console.log('serverId', serverId)
            const server = await Server.findOne({ where: { id: serverId }})
            const communityName = server.communityName
            if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            const name = interaction.options.getString('name')
            const abbreviation = interaction.options.getString('abbreviation')
            const emoji = interaction.options.getString('emoji')
            const requiredRole1 = interaction.options.getRole('role-1')?.id
            const requiredRole2 = interaction.options.getRole('role-2')?.id
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