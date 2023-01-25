
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server } from '@fl/models'
import { Op } from 'sequelize'
import { search } from '../functions/utility'

export default {
	data: new SlashCommandBuilder()
		.setName('card')
		.setDescription('Search for a card. 🎴')
		.addStringOption(str =>
            str
                .setName('name')
                .setDescription('Enter search query.')
                .setRequired(true)
        ),
	async execute(interaction, fuzzyCards) {
        const query = interaction.options.getString('name')
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

        const { cardEmbed, attachment } = await search(query, fuzzyCards, format)
        if (!cardEmbed) {
            interaction.reply({ content: `Could not find: "${query}".`})
        } else if (attachment) {
            interaction.reply({ embeds: [cardEmbed], files: [attachment] })
        } else {
            return interaction.reply({ embeds: [cardEmbed] })
        }
	}
}