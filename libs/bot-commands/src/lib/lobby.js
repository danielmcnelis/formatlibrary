
import { SlashCommandBuilder } from 'discord.js'
import { Format, Pool } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { Op } from 'sequelize'

export default {
	data: new SlashCommandBuilder()
		.setName('lobby')
		.setDescription('Check the Rated Lobbies. 🛎️'),
	async execute(interaction) {
        await interaction.deferReply()
        const now = new Date()
        const oneDayAgo = new Date(now - (24 * 60 * 60 * 1000))

        const pools = [...await Pool.findAll({ 
            where: { 
                createdAt: {[Op.gte]: oneDayAgo}
            }, 
            include: Format,
            order: [['createdAt', 'DESC']] 
        })].map((pool) => {
            const difference = now - pool.createdAt
            const timeAgo = difference < 1000 * 60 * 60 ? `${Math.round(difference / (1000 * 60))}m ago ${emojis.megaphone}` :
                `${Math.round(difference / (1000 * 60 * 60))}h ago`
            
            return `${pool.formatName} ${pool.format.emoji} - ${timeAgo}` 
        })
        
        if (!pools.length) {
            return await interaction.editReply({ content: `Nobody is actively using any Rated Lobby.` })
        } else {
            return await interaction.editReply({ content: `${emojis.FL} __**Active Rated Lobbies**__ ${emojis.FL}\n${pools.join('\n')}`})
        }
	}
}