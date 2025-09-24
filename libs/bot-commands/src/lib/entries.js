
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Player, Tournament } from '@fl/models'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName(w)
		.setDescription('Check your Tournament Entries. 🛎️'),
	async execute(interaction) {
        try {
            await interaction.deferReply()

            const player = await Player.findOne({
                where: {
                    discordId: interaction.user.id
                }
            })

            const entries = [...await Entry.findAll({ 
                where: { 
                    playerId: player.id,
                    isActive: true
                }, 
                include: Tournament,
                order: [['createdAt', 'DESC']] 
            })].map((entry) => {
                return `- ${entry.tournament.name} ${entry.tournament.logo} ${entry.tournament.emoji}` 
            })
            
            if (!entries.length) {
                return await interaction.editReply({ content: `You are not an active participant in any tournaments.` })
            } else {
                entries.unshift(`${emojis.placing} __**Your Tournament Entries**__ ${emojis.placing}`)

                return await interaction.editReply(entries.join('\n'))    
            }
        } catch (err) {
            console.log(err)
        }
	}
}