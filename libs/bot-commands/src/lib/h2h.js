
import { SlashCommandBuilder } from 'discord.js'    
import { hasPartnerAccess } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Format, Match, Player, Server } from '@fl/models'

export default {
    data: new SlashCommandBuilder()
        .setName('h2h')
        .setDescription(`Post the record between 2 players. 🤼`)
        .addUserOption(option =>
            option
                .setName('user1')
                .setDescription('Tag the first user.')
                .setRequired(true))
        .addUserOption(option =>
            option
                .setName('user2')
                .setDescription('Tag the second user.')
                .setRequired(false)
        )
        .setDMPermission(false),
    async execute(interaction) {
        const user1 = interaction.options.getUser('user1')
        const user2 = interaction.options.getUser('user2') || interaction.user
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        if (!format) return await interaction.reply({ content: `Try using **/h2h** in channels like: <#414575168174948372> or <#629464112749084673>.`})

        const player1DiscordId = user1.id	
        const player2DiscordId = user2.id
        if (player1DiscordId === player2DiscordId) return await interaction.reply({ content: `Please specify 2 different users.`})

        const player1 = await Player.findOne({ where: { discordId: player1DiscordId } })
        const player2 = await Player.findOne({ where: { discordId: player2DiscordId } })
        if (!player1 && player2DiscordId === interaction.user.id) return await interaction.reply({ content: `That user is not in the database.`})
        if (!player1 && player2DiscordId !== interaction.user.id) return await interaction.reply({ content: `The first user is not in the database.`})
        if (!player2 && player2DiscordId === interaction.user.id) return await interaction.reply({ content: `You are not in the database.`})
        if (!player2 && player2DiscordId !== interaction.user.id) return await interaction.reply({ content: `The second user is not in the database.`})

        const p1Wins = await Match.count({ where: { winnerId: player1.id, loserId: player2.id, formatName: format.name } })
        const p2Wins = await Match.count({ where: { winnerId: player2.id, loserId: player1.id, formatName: format.name } })
        
        return await interaction.reply({ content: 
            `${server.emoji || format.emoji} --- H2H ${format.name} Results --- ${server.emoji || format.emoji}`+
            `\n${player1.name} has won ${p1Wins}x`+
            `\n${player2.name} has won ${p2Wins}x`
        })	
    }
}
