
import { SlashCommandBuilder } from 'discord.js'    
import { isMod, hasFullAccess } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Server, TriviaEntry } from '@fl/models'

export default {
	data: new SlashCommandBuilder()
		.setName('reset')
		.setDescription('Reset trivia! 🤔'),
	async execute(interaction) {
        await interaction.deferReply()
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        if (!hasFullAccess(server)) return await interaction.editReply({ content: `This feature is only available in Format Library. ${emojis.FL}`})
        if (!isMod(server, interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.`})
        if (interaction.channel.id !== '1085316454053838981') return await interaction.editReply({ content: `Try using **/trivia** in the <#1085316454053838981> channel. 📚 🐛`})

        const triviaEntries = await TriviaEntry.findAll()
        for (let i = 0; i < triviaEntries; i++) {
            const entry = triviaEntries[i]
            await entry.destroy()
        }

        return interaction.editReply({ content: `The Trivia game has been reset. ${emojis.mlady}`})
	}
}