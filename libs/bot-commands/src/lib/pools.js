
import { SlashCommandBuilder } from 'discord.js'
import { Player, Pool } from '@fl/models'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('pools')
		.setDescription('Check your Rated Pools. 🏊'),
	async execute(interaction) {
        try {
            if (interaction.guildId) {
                await interaction.reply(`Please check your DMs.`)
            } else {
                await interaction.reply(`🤿`)
            }

            const player = await Player.findOne({ where: { discordId: interaction.user.id } })
            if (!player) return await interaction.user.send(`You are not in the database. Please join the Format Library ${emojis.FL} Discord server to register.`)
            const pools = [...await Pool.findAll({ where: { playerId: player.id }, order: [['formatName', 'ASC']] })].map((p) => p.formatName)
            if (!pools.length) return await interaction.user.send(`You are not in any Rated Pools.`)
            return await interaction.user.send({ content: `You are in the following pools:\n${pools.join('\n')}`})
        } catch (err) {
            console.log(err)
        }
	}
}