
import { SlashCommandBuilder } from 'discord.js'
import { Player } from '@fl/models'

export default {
	data: new SlashCommandBuilder()
		.setName('timezone')
		.setDescription('Set or look-up a time zone. ⏱️')
        .addStringOption(str =>
            str
                .setName('time-zone')
                .setDescription('Enter your time zone (abbreviation).')
                .setRequired(false)
        )
		.addUserOption(user =>
            user
                .setName('user')
                .setDescription('Tag another user.')
                .setRequired(false)
        ),
	async execute(interaction) {
        try {
            const user = interaction.options.getUser('user') || interaction.user
            const userIsAuthor = user.id === interaction.user.id
            const zone = interaction.options.getString('time-zone')?.toUpperCase()
            const player =  await Player.findOne({ where: { discordId: user.id } })
            if (userIsAuthor && zone) {
                await player.update({ timeZone: zone })
                return await interaction.reply({ content: `Your time zone has been set to: ${player.timeZone}`})
            } else {
                return await interaction.reply({ content: `${userIsAuthor ? 'Your' : `${user.username}'s`} time zone is: ${player.timeZone}`})
            }
        } catch (err) {
            console.log(err)
        }
	}
}
