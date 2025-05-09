
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server, Tournament } from '@fl/models'
import { selectTournament } from '@fl/bot-functions'
import { isModerator, hasPartnerAccess } from '@fl/bot-functions'

export default {
	data: new SlashCommandBuilder()
		.setName('open')
		.setDescription('Mod Only - Open tournament registration. 🔓')
        .setDMPermission(false),
	async execute(interaction) {
        try {
            await interaction.deferReply()
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            if (!isModerator(server, interaction.member)) return await interaction.editReply({ content: 'You do not have permission to do that.'})
            const format = await Format.findByServerOrChannelId(server, interaction.channelId)
            const tournaments = await Tournament.findByState('standby', format, interaction.guildId, 'ASC')
            const tournament = await selectTournament(interaction, tournaments)
            if (!tournament) return
            
            await tournament.update({ state: 'pending'})
            return await interaction.editReply({ content: `Registration for ${tournament.name} ${tournament.logo} is now open.`})
        } catch (err) {
            console.log(err)
        }
	}
}