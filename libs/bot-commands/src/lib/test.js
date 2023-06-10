
import { SlashCommandBuilder } from 'discord.js'
import { isProgrammer, updateSets, downloadNewCards, updateMarketPrices } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import axios from 'axios'
import { config } from '@fl/config'

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Admin Only - Performs a test. 🧪'),
    async execute(interaction) {
        await interaction.deferReply()
        if (isProgrammer(interaction.member)) {
            

            // console.log('interaction.member', interaction.member)
            // const member = await interaction.guild.members.fetch(interaction.member.user.id)
            // console.log('member', member)
                const response = await axios.get(`https://discord.com/api/v9/users/${interaction.member.user.id}`, {
                    headers: {
                      Authorization: `Bot ${config.services.bot.token}`
                    }
                  })
  
                  console.log('response', response)

            // console.log('member.user', member.user)
            // console.log('member.user.display_name', member.user.display_name)
            // console.log('member.user.displayName', member.user.displayName)
            // console.log('member.user.globalName', member.user.globalName)
            // console.log('member.user.global_name', member.user.global_name)
            // console.log('member.user.nickname', member.user.nickname)
            
            await interaction.reply(emojis.yellow)
        } else {
            await interaction.reply('🧪')
        }
    }
}