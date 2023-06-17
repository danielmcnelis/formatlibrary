
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server } from '@fl/models'
import { urlize } from '@fl/bot-functions'

export default {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Post format overview. 📚'),
    async execute(interaction) {
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        if (!format) return await interaction.reply({ content: `Try using /info in channels like: <#414575168174948372> or <#629464112749084673>.`})
        if (format.category === 'OP') return await interaction.reply({ content: `**${format.name.toUpperCase()} Card Game ${format.emoji} - Overview**\nhttps://onepiece-cardgame.dev` })
        return await interaction.reply(`**${format.name.toUpperCase()} Format ${format.emoji} - Overview**\nhttps://formatlibrary.com/formats/${urlize(format.name)}`)
    }
}