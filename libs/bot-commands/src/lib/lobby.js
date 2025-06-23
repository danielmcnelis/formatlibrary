
import { SlashCommandBuilder } from 'discord.js'
import { Format, Pool } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { Op } from 'sequelize'

export default {
	data: new SlashCommandBuilder()
		.setName('lobby')
		.setDescription('Check the Rated Lobby. 🛎️'),
	async execute(interaction) {
        try {
            await interaction.deferReply()
            const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000))

            const pools = [...await Pool.findAll({ 
                where: { 
                    createdAt: {[Op.gte]: oneWeekAgo}
                }, 
                include: Format,
                order: [['createdAt', 'DESC']] 
            })].map((pool) => {
                const difference = new Date() - pool.createdAt
                const timeAgo = difference < 1000 * 60 * 60 ? `${Math.round(difference / (1000 * 60))}m ago ${emojis.megaphone}` :
                    difference < 1000 * 60 * 60 * 24 ? `${Math.round(difference / (1000 * 60 * 60))}h ago` :
                    `${Math.round(difference / (1000 * 60 * 60 * 24))}d ago`
                
                return `${pool.formatName} ${pool.format.emoji} - ${timeAgo}` 
            })
            
            if (!pools.length) {
                return await interaction.editReply({ content: `Nobody is actively using the Rated Lobby.` })
            } else {
                pools.unshift(`${emojis.FL} __**Active Rated Lobbies**__ ${emojis.FL}`)

                for (let i = 0; i < pools.length; i += 27) {
                    if (i === 0) {
                        await interaction.editReply(pools.slice(i, i + 27).join('\n'))
                    } else {
                        if (interaction.channel) {
                            await interaction.channel.send(pools.slice(i, i + 27).join('\n'))
                        } else {
                            await interaction.user.send(pools.slice(i, i + 27).join('\n'))
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