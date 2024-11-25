
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server, Tournament } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { capitalize, hasPartnerAccess } from '@fl/bot-functions'

export default {
    data: new SlashCommandBuilder()
        .setName('bracket')
        .setDescription('Post brackets for active tournaments. 🏟️')
        .setDMPermission(false),
    async execute(interaction) {
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const tournaments = await Tournament.findActive(format, interaction.guildId)
        if (!tournaments.length) return await interaction.reply({ content: `There are no active tournaments.`})
        
        const results = []
        for (let i = 0; i < tournaments.length; i++) {
            const tournament = tournaments[i]
            const subdomain = server.challongeSubdomain ? `${server.challongeSubdomain}.` : ''
            results.push(`Name: ${tournament.name} ${tournament.logo}` +
                `\nFormat: ${tournament.formatName} ${tournament.emoji}` + 
                `\nBracket: <https://${subdomain}challonge.com/${tournament.url}>` +
                `\nType: ${capitalize(tournament.type, true)}${!tournament.isRanked ? ' (Unranked)' : ''}` +
                `${tournament.type === 'swiss' && tournament.state === 'underway' ? `\nDetails: ${tournament.rounds} Rounds - ${tournament.topCutSize ? `Top ${tournament.topCutSize}` : `No Playoff` }` : ''}` +
                `\nStatus: ${capitalize(tournament.state, true)}`
            )
        }

        return await interaction.reply({ content: results.join('\n\n').toString() })
    }
}