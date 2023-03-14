
import { SlashCommandBuilder } from 'discord.js'
import { TriviaEntry, Player, Server } from '@fl/models'
import { initiateTrivia, hasFullAccess } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'

export default {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Join or leave the trivia queue. 📚'),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        if (!hasFullAccess(server)) return await interaction.reply({ content: `This feature is only available in Format Library. ${emojis.FL}`})
        
        const player = await Player.findOne({ where: { discordId: interaction.user.id }})
        const alreadyIn = await TriviaEntry.count({ where: { playerId: player.id }})
        const isConfirming = await TriviaEntry.count({ where: { status: 'confirming' }})
        if (isConfirming && alreadyIn) return await interaction.reply({ content: 'Sorry, you cannot leave trivia after it has started.' })
        
        if (!alreadyIn) {
            if (isConfirming) {
                await TriviaEntry.create({ 
                    playerName: player.discordName,
                    playerId: player.id,
                    confirmed: true
                })

                return await interaction.reply({ content: `You joined the Trivia game. 📚`})
            } else {
                await TriviaEntry.create({ 
                    playerName: player.discordName,
                    playerId: player.id,
                    status: 'confirming',
                    confirmed: false
                })

                const count = await TriviaEntry.count()
                if (count >= 4) initiateTrivia(interaction)
                return await interaction.reply({ content: `You joined the Trivia queue. 📚`})
            }
        } else {
            const triviaPerson = await TriviaEntry.findOne({ where: { playerId: player.id }})
            await triviaPerson.destroy()
            return await interaction.reply({ content: `You left the Trivia queue. 📚`})
        }
    }
}