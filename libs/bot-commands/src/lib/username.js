
import { SlashCommandBuilder } from 'discord.js'
import { Player } from '@fl/models'

export default {
	data: new SlashCommandBuilder()
		.setName('username')
		.setDescription('Set your username for various simulators. 📛')
		.addStringOption(str =>
            str
                .setName('name')
                .setDescription('Enter your username.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('simulator')
                .setDescription('Select a simulator.')
                .setRequired(true)
                .addChoices(
					{ name: 'DuelingBook', value: 'DuelingBook, duelingBook' },	
					{ name: 'One Piece TCG Simulator', value: 'One Piece TCG Simulator, opTcgSim' },
				)
        ),
	async execute(interaction) {
        const name = interaction.options.getString('name')
        const [simulator, colName] = interaction.options.getString('simulator').split(', ')
        const player =  await Player.findOne({ where: { discordId: interaction.user.id } })
        await player.update({ [colName]: name })
        return await interaction.reply({ content: `Your ${simulator} username has been set to: ${player[colName]}.`})
	}
}
