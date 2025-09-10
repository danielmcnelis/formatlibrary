
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
                    state: 'pending'
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

                return await interaction.editReply(tournaments.join('\n'))    
            }
        } catch (err) {
            console.log(err)
        }
	}
}