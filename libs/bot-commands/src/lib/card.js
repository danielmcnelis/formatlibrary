
import { SlashCommandBuilder } from 'discord.js'
import { Card, Format, Server } from '@fl/models'
import { getCard } from '@fl/bot-functions'
import { Op } from 'sequelize'

export default {
	data: new SlashCommandBuilder()
		.setName('card')
		.setDescription('Search for a card. 🎴')
		.addStringOption(str =>
            str
                .setName('name')
                .setDescription('Enter search query.')
				.setAutocomplete(true)
                .setRequired(true)
        )
        .setDMPermission(false), 
    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused()

            const cards = await Card.findAll({
                where: {
                    name: {[Op.startsWith]: `%${focusedValue}%`},
                },
                limit: 5,
                order: [["name", "ASC"]]
            })

            await interaction.respond(
                cards.map(card => ({ name: card.name, value: card.id })),
            )
        } catch (err) {
            console.log(err)
        }
    },        
	async execute(interaction, fuzzyCards) {
        try {
            const query = interaction.options.getString('name')
            console.log('query', query)
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (server?.name === 'Format Library' && interaction.member.roles.cache.some(role => role.id === '1085310457126060153')) return interaction.reply({ content: `Sorry, you cannot look up cards while playing trivia. 📚 🐛` })
            const format = await Format.findByServerOrChannelId(server, interaction.channelId)
            const { cardEmbed, attachment } = await getCard(query, fuzzyCards, format)

            if (!cardEmbed) {
                interaction.reply({ content: `Could not find: "${query}".`})
            } else if (attachment) {
                interaction.reply({ embeds: [cardEmbed], files: [attachment] })
            } else {
                return await interaction.reply({ embeds: [cardEmbed] })
            }
        } catch (err) {
            console.log(err)
        }
	}
}