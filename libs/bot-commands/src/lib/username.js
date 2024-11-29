
import { SlashCommandBuilder } from 'discord.js'
import { Player } from '@fl/models'

export default {
	data: new SlashCommandBuilder()
		.setName('username')
		.setDescription('Set or look-up a username for various simulators. 📛')
        .addStringOption(str =>
            str
                .setName('simulator')
                .setDescription('Select a simulator.')
                .setRequired(true)
                .addChoices(
					{ name: 'DuelingBook', value: 'DuelingBook, duelingBookName' },	
				)
        )
		.addUserOption(user =>
            user
                .setName('user')
                .setDescription('Tag another user.')
                .setRequired(false)
        )
		.addStringOption(str =>
            str
                .setName('name')
                .setDescription('Enter a new username.')
                .setRequired(false)
        ),
	async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user
        const userIsAuthor = user.id === interaction.user.id
        const name = interaction.options.getString('name')
        console.log('submitted name:', name)
        const [simulator, colName] = interaction.options.getString('simulator').split(', ')
        console.log('simulator:', simulator)
        console.log('colName:', colName)
        console.log('prev. player.duelingBookName:', player.duelingBookName)
        console.log('prev. player[colName]:', player[colName])
        const player =  await Player.findOne({ where: { discordId: user.id } })
        if (userIsAuthor && name) {
            await player.update({ [colName]: name })
            console.log('new player.duelingBookName:', player.duelingBookName)
            console.log('new player[colName]:', player[colName])
            return await interaction.reply({ content: `Your ${simulator} username has been set to: ${player[colName]}`})
        } else {
            console.log('not author or no name')
            return await interaction.reply({ content: `${userIsAuthor ? 'Your' : `${user.username}'s`} ${simulator} username is: ${player[colName]}`})
        }
	}
}
