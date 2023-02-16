
import { SlashCommandBuilder } from 'discord.js'
import { Player } from '@fl/models'

export default {
	data: new SlashCommandBuilder()
		.setName('duelingbook')
		.setDescription('Set your DuelingBook name. 📛')
		.addStringOption(str =>
            str
                .setName('name')
                .setDescription('Your DuelingBook name.')
                .setRequired(true)
        ),
	async execute(interaction) {
        const duelingBook = interaction.options.getString('name')
        const player =  await Player.findOne({ where: { discordId: interaction.user.id } })
        await player.update({ duelingBook })
        return await interaction.reply({ content: `Your DuelingBook username has been set to: ${player.duelingBook}.`})
	}
}
