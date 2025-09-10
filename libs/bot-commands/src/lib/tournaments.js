
import { SlashCommandBuilder } from 'discord.js'
import { Server, Tournament } from '@fl/models'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('tournaments')
		.setDescription('Check Open Tournaments. 🛎️'),
	async execute(interaction) {
        try {
            await interaction.deferReply()

            const tournaments = [...await Tournament.findAll({ 
                where: { 
                    state: 'pending',
                    '$server.hasInternalLadder': false
                },
                include: Server,
                order: [['createdAt', 'DESC']] 
            })].map((tournament) => {
                return `- ${tournament.name} ${tournament.logo} ${tournament.emoji} (${tournament.server?.name})` 
            })
            
            if (!tournaments.length) {
                return await interaction.editReply({ content: `There are no pending tournaments.` })
            } else {
                tournaments.unshift(`${emojis.placing} __**Pending Tournaments**__ ${emojis.placing}`)

                for (let i = 0; i < tournaments.length; i += 10) {
                    if (i === 0) {
                        await interaction.editReply(tournaments.slice(i, i + 10).join('\n'))
                    } else {
                        if (interaction.channel) {
                            await interaction.channel.send(tournaments.slice(i, i + 10).join('\n'))
                        } else {
                            await interaction.user.send(tournaments.slice(i, i + 10).join('\n'))
                        }
                    }
                }

                return  
            }
        } catch (err) {
            console.log(err)
        }
	}
}