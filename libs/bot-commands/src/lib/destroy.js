
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Player, Server, Tournament } from '@fl/models'
import { isAdmin, isProgrammer, hasPartnerAccess } from '@fl/bot-functions'
import { Op } from 'sequelize'
import axios from 'axios'

export default {
	data: new SlashCommandBuilder()
		.setName('destroy')
		.setDescription('Destroy a tournament. 🧨')
        .addStringOption(str =>
            str
                .setName('tournament')
                .setDescription('The tournament you want to destroy.')
                .setRequired(true)
        ),
	async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        const name = interaction.options.getString('tournament')

        if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isAdmin(server, interaction.member)) return await interaction.reply({ content: 'You do not have permission to do that.'})

        const tournament = await Tournament.findOne({ 
            where: { 
                [Op.or]: {
                    name: { [Op.iLike]: name },
                    abbreviation: { [Op.iLike]: name },
                },
                serverId: interaction.guildId 
            }
        })

        if (!tournament) return await interaction.reply({ content: `Could not find tournament: "${name}".`})
        if (tournament.state === 'underway' && !isProgrammer(interaction.member)) return await interaction.reply({ content: `This tournament is underway, therefore it may only be deleted by the database manager.`})
        if (tournament.state === 'complete' && !isProgrammer(interaction.member)) return await interaction.reply({ content: `This tournament is complete, therefore it may only be deleted by the database manager.`})

        try {
            const { status } = await axios({
                method: 'delete',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`
            })
        
            if (status === 200) {
                const entries = await Entry.findAll({ where: { tournamentId: tournament.id }, include: Player })
                for (let i = 0; i < entries.length; i++) {
                    try {
                        const entry = entries[i]
                        const discordId = entry.player.discordId
                        const playerId = entry.player.id
                        await entry.destroy()
                        
                        const member = await interaction.guild.members.fetch(discordId)
                        if (!member) continue

                        const count = await Entry.count({ 
                            where: {
                                playerId: playerId,
                                '$tournament.serverId$': server.id
                            },
                            include: Tournament,
                        })

                        if (!count) member.roles.remove(server.tourRole).catch((err) => console.log(err))
                    } catch (err) {
                        console.log(err)
                    }
                }
        
                const content = `Yikes! You deleted ${tournament.name} ${tournament.logo} from your Challonge account.`
                await tournament.destroy()
                return await interaction.reply({ content })
            } else {
                return await interaction.reply({ content: `Unable to delete tournament from Challonge account.`})
            }
        } catch (err) {
            console.log(err)
            return await interaction.reply({ content: `Error: Unable to delete tournament from Challonge account.`})
        }
    }
}