
import { SlashCommandBuilder } from 'discord.js'    
import { isModerator, hasPartnerAccess, selectMatch, undoMatch } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Format, Match, Server } from '@fl/models'

export default {
    data: new SlashCommandBuilder()
        .setName('undo')
        .setDescription(`Undo a match result. ⏪`)
        .setDMPermission(false),                
    async execute(interaction) {
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        if (!format) return await interaction.editReply({ content: `Try using **/undo** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const serverId = server.hasInternalLadder ? server.id : '414551319031054346'
        const matches = await Match.findAll({ where: { formatId: format.id, serverId: serverId }, order: [['createdAt', 'DESC']]})
        const authorIsMod = isModerator(server, interaction.member)
        const match = authorIsMod ? await selectMatch(interaction, matches.slice(0, 10)) : matches[0]

        if (match) {
            return undoMatch(interaction, server, match.id, authorIsMod)
        } else {
            return
        }
    }
}
