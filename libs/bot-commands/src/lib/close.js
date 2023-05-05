
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server, Tournament } from '@fl/models'
import { selectTournament } from '@fl/bot-functions'
import { isMod, hasPartnerAccess } from '@fl/bot-functions'
import { Op } from 'sequelize'

export default {
	data: new SlashCommandBuilder()
		.setName('close')
		.setDescription('Mod Only - Close tournament registration. 🔐'),
	async execute(interaction) {
        await interaction.deferReply()
        const server = !interaction.guildId ? {} : 
        await Server.findOne({ where: { id: interaction.guildId }}) || 
        await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return await interaction.editReply({ content: 'You do not have permission to do that.'})
        
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
        
        const tournaments = await Tournament.findAll({ 
            where: { 
                state: 'pending',
                formatName: format.name,
                serverId: interaction.guildId
            }, 
            order: [['createdAt', 'ASC']] 
        })
  
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return
        await tournament.update({ state: 'standby'})
        return await interaction.editReply({ content: `Registration for ${tournament.name} ${tournament.logo} is now closed.`})
	}
}