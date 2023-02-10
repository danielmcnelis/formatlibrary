
import { SlashCommandBuilder } from 'discord.js'
import { hasFullAccess, isMod } from '@fl/bot-functions'
import { postStory } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Format, Server } from '@fl/models'
import { Op } from 'sequelize'

export default {
	data: new SlashCommandBuilder()
		.setName('story')
		.setDescription('Posts the Iron Story. 📖'),
	async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasFullAccess(server)) return interaction.reply({ content: `This feature is only available in Format Library. ${emojis.FL}`})
        if (!isMod(server, interaction.member)) return interaction.reply({ content: `You do not have permission to do that.`})

        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

        return postStory(interaction, format)
	}
}