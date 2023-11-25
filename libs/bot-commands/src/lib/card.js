
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server } from '@fl/models'
import { getCard, getOPCard } from '@fl/bot-functions'

export default {
	data: new SlashCommandBuilder()
		.setName('card')
		.setDescription('Search for a card. 🎴')
		.addStringOption(str =>
            str
                .setName('name')
                .setDescription('Enter search query.')
                .setRequired(true)
        )
        .setDMPermission(false),
	async execute(interaction, fuzzyCards, fuzzyOPCards) {
        const query = interaction.options.getString('name')
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (server?.name === 'Format Library' && interaction.member.roles.cache.some(role => role.id === '1085310457126060153')) return interaction.reply({ content: `Sorry, you cannot look up cards while playing trivia. 📚 🐛` })
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const { cardEmbed, attachment } = format?.category === 'OP' ? await getOPCard(query, fuzzyOPCards, format)
            : await getCard(query, fuzzyCards, format)

        if (!cardEmbed) {
            interaction.reply({ content: `Could not find: "${query}".`})
        } else if (attachment) {
            interaction.reply({ embeds: [cardEmbed], files: [attachment] })
        } else {
            return await interaction.reply({ embeds: [cardEmbed] })
        }
	}
}