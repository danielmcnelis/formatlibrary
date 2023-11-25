
import { SlashCommandBuilder } from 'discord.js'    
import { isMod } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Server, TriviaEntry } from '@fl/models'

export default {
	data: new SlashCommandBuilder()
		.setName('reset')
		.setDescription('Mod Only - Reset trivia! 🤔')
        .setDMPermission(false),
	async execute(interaction) {
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!isMod(server, interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.`})
        if (interaction.channel.id !== '1085316454053838981') return await interaction.editReply({ content: `Try using **/trivia** in the <#1085316454053838981> channel. 📚 🐛`})

        const triviaEntries = await TriviaEntry.findAll()
        for (let i = 0; i < triviaEntries.length; i++) {
            const entry = triviaEntries[i]
            await entry.destroy()
        }

        return interaction.editReply({ content: `The Trivia game has been reset. ${emojis.mlady}`})
	}
}