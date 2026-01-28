
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Player, Server, Tournament } from '@fl/models'
import { isModerator, isProgrammer, hasPartnerAccess } from '@fl/bot-functions'
import axios from 'axios'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('destroy')
		.setDescription('Mod Only - Destroy a tournament. 🧨')
        .addStringOption(str =>
            str
                .setName('tournament')
                .setDescription('Enter the tournament name or abbreviation.')
                .setRequired(true)
        )
        .setDMPermission(false),
	async execute(interaction) {
        try {
            await interaction.deferReply()
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            const query = interaction.options.getString('tournament')
            if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            if (!isModerator(server, interaction.member)) return await interaction.editReply({ content: 'You do not have permission to do that.'})
            const tournament = await Tournament.findByQuery(query, interaction.guildId)
            if (!tournament) return await interaction.reply({ content: `Could not find tournament: "${query}".`})
            if (tournament.state === 'complete' && !isProgrammer(interaction.member)) return await interaction.editReply({ content: `This tournament is complete, therefore it may only be deleted by the database manager.`})

            try {
                const tournamentId = server.challongeSubdomain ? `${server.challongeSubdomain}-${tournament.url}` : tournament.id
                const { status } = await axios({
                    method: 'delete',
                    url: `https://api.challonge.com/v2.1/tournaments/${tournamentId}.json}`,
                    headers: {
                        Authorization: server.challongeApiKey
                    }
                })
            
                if (status === 200) {
                    const entries = await Entry.findAll({ where: { tournamentId: tournament.id }, include: Player })
                    for (let i = 0; i < entries.length; i++) {
                        try {
                            const entry = entries[i]
                            const discordId = entry.player.discordId
                            const playerId = entry.player.id
                            await entry.destroy()
                            
                            if (!server.tournamentRoleId) continue
                            
                            const member = await interaction.guild?.members.fetch(discordId)
                            if (!member) continue

                            const count = await Entry.count({ 
                                where: {
                                    playerId: playerId,
                                    '$tournament.serverId$': server.id
                                },
                                include: Tournament,
                            })

                            if (!count) member.roles.remove(server.tournamentRoleId).catch((err) => console.log(err))
                        } catch (err) {
                            console.log(err)
                        }
                    }

                    const tournamentName = tournament.name
                    const tournamentLogo = tournament.logo
                    await tournament.destroy()
                    return await interaction.editReply({ content: `Yikes! You deleted ${tournamentName} ${tournamentLogo} from your Challonge account.` })
                } else {
                    return await interaction.editReply({ content: `Unable to delete tournament from Challonge account.`})
                }
            } catch (err) {
                console.log(err)
                return await interaction.editReply({ content: `Error: Unable to delete tournament from Challonge account.`})
            }
        } catch (err) {
            console.log(err)
        }
    }
}