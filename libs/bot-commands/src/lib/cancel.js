
import { SlashCommandBuilder } from 'discord.js'    
import { isModerator, hasPartnerAccess, selectPairing, undoMatch } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Pairing, Server } from '@fl/models'

export default {
    data: new SlashCommandBuilder()
        .setName('cancel')
        .setDescription(`Cancel a rated pairing.`)
        .setDMPermission(false),                
    async execute(interaction) {
        try {
            await interaction.deferReply()
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            const serverId = server.hasInternalLadder ? server.id : '414551319031054346'
            const pairings = await Pairing.findAll({ where: { serverId: serverId }, order: [['createdAt', 'DESC']]})
            const authorIsMod = isModerator(server, interaction.member)
            const match = authorIsMod ? await selectPairing(interaction, pairings.slice(0, 25)) : pairings[0]

            if (match) {
                return undoMatch(interaction, server, match.id, authorIsMod)
            } else {
                return
            }
        } catch (err) {
            console.log(err)
        }
    }
}
