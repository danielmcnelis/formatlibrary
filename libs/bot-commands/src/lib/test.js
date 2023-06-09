
import { SlashCommandBuilder } from 'discord.js'
import { isProgrammer, updateSets, downloadNewCards, updateMarketPrices } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
// import { client } from '../client'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Admin Only - Performs a test. 🧪'),
    async execute(interaction) {
        if (isProgrammer(interaction.member)) {
            // console.log('interaction.member', interaction.member)
            console.log('interaction.member.displayName', interaction.member.displayName)
            const member = await interaction.guild.members.fetch(interaction.member.user.id)
            // console.log('member', member)
            console.log('member.displayName', member.displayName)
            await interaction.reply(emojis.yellow)
        } else {
            await interaction.reply('🧪')
        }
    }
}