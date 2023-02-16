
import { SlashCommandBuilder } from 'discord.js'

export default {
	data: new SlashCommandBuilder()
		.setName('rng')
		.setDescription('Generate a random number! 🔢')
		.addNumberOption(num =>
            num
                .setName('number')
                .setDescription('The maximum value.')
                .setRequired(true)
        ),
	async execute(interaction) {
        const num = interaction.options.getNumber('number')
        if(isNaN(num) || num < 1) return await interaction.reply({ content: `Please specify an upper limit.`})
        const result = Math.floor((Math.random() * num) + 1)
        return await interaction.reply({ content: `You rolled a **${result}** with a ${num}-sided die.`})
	}
}