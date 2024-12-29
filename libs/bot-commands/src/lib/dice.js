
import { SlashCommandBuilder } from 'discord.js'

export default {
	data: new SlashCommandBuilder()
		.setName('dice')
		.setDescription('Roll a 6-sided die! 🎲'),
	async execute(interaction) {
        try {
            const result = Math.floor((Math.random() * 6) + 1)
            return await interaction.reply({ content: `You rolled a **${result}** with a 6-sided die.`})
        } catch (err) {
            console.log(err)
        }
	}
}