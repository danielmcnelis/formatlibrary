
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server } from '@fl/models'
import { checkDeckList, checkHighlanderList, getSkillCard } from '@fl/bot-functions'

export default {
    data: new SlashCommandBuilder()
        .setName('legal')
        .setDescription('Check deck legality. 👍')
        .setDMPermission(false),
    async execute(interaction) {
        try {
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            const format = await Format.findByServerOrChannelId(server, interaction.channelId)
            if (!format) return await interaction.reply({ content: `Try using **/legal** in channels like: <#414575168174948372> or <#629464112749084673>.`})
            if (format.category !== 'TCG' && format.category !== 'OCG' && format.category !== 'Speed') return await interaction.reply(`Sorry, ${format.category} formats are not supported at this time.`)
            await interaction.reply(`Please check your DMs.`)
            
            if (format.category === 'TCG' || format.category === 'OCG' || format.category === 'Highlander') {
                return await checkDeckList(interaction.member, format)
            } else if (format.category === 'Speed') {
                return await getSkillCard(interaction.member, format)
            }
        } catch (err) {
            console.log(err)
        }
    }
}