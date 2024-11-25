
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Server, Tournament } from '@fl/models'
import { removeParticipant, selectTournament } from '@fl/bot-functions'
import { isModerator, hasPartnerAccess } from '@fl/bot-functions'
import { Op } from 'sequelize'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Mod Only - Remove a player from a tournament. 👢')
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to remove.')
                .setRequired(true)
        )
        .setDMPermission(false),
	async execute(interaction) {
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        const user = interaction.options.getUser('player')
        const member = await interaction.guild?.members.fetch(user.id).catch((err) => console.log(err))

        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isModerator(server, interaction.member)) return await interaction.editReply({ content: 'You do not have permission to do that.'})

        const player = await Player.findOne({ where: { discordId: user.id }})
        if (!player) return await interaction.editReply(`That player is not in the database.`)
        
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
                
        const tournaments = [
            ...await Entry.findAll({ 
                where: { 
                    playerId: player.id,
                    '$tournament.formatName$': format ? format.name : { [Op.not]: null },
                    '$tournament.serverId$': interaction.guild.id
                }, 
                include: [Player, Tournament] 
            })
        ].map((e) => e.tournament)

        if (!tournaments.length) return await interaction.editReply(`That user is not in an active ${format ? `${format.name} tournament` : 'tournament'}.`)
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        const entry = await Entry.findOne({ 
            where: { 
                playerId: player.id, 
                tournamentId: tournament.id 
            }, 
            include: Player 
        })

        return removeParticipant(server, interaction, member, entry, tournament, false)
    }
}




