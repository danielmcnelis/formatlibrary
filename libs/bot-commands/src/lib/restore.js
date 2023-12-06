
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Server, Tournament } from '@fl/models'
import { restoreParticipant, selectTournament } from '@fl/bot-functions'
import { isMod, hasPartnerAccess } from '@fl/bot-functions'
import { Op } from 'sequelize'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('restore')
		.setDescription('Mod Only - Restore a dropped participant in a tournament. ❤️‍🩹')
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to restore.')
                .setRequired(true)
        )
        .setDMPermission(false),
	async execute(interaction) {
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return await interaction.editReply({ content: 'You do not have permission to do that.'})           
        let format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const tournaments = await Tournament.findByState('underway', format, interaction.guildId, 'ASC')
        const user = interaction.options.getUser('player')
        const member = await interaction.guild?.members.fetch(user.id)
        const player = await Player.findOne({ where: { discordId: user.id }})
        if (!player) return await interaction.editReply({ content: `That player is not in the database.`})
        
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        let entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id }})
        if (!entry) return await interaction.editReply(`That player is not in ${tournament?.name}.`)
        if (!format) format = await Format.findOne({ where: { name: {[Op.iLike]: tournament.formatName } }})
        if (!format) return await interaction.editReply(`Unable to determine what format is being played in ${tournament?.name}. Please contact an administrator.`)
                                       
        const data = await restoreParticipant(server, tournament, entry)
        if (!data || !data?.participant) return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register ${player.globalName || player.discordName} on Challonge for ${tournament?.name}. ${tournament.logo}`})
        await entry.update({ active: true })

        member.roles.add(server.tourRole).catch((err) => console.log(err))
        return await interaction.editReply({ content: `A moderator restored <@${player.discordId}> in ${tournament.name}. ${tournament.emoji}` }).catch((err) => console.log(err))
    }
}