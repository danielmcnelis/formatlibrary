
import { SlashCommandBuilder } from 'discord.js'    
import { hasPartnerAccess } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Format, Player, Membership, Role, Server } from '@fl/models'
import { hasPartnerAccess } from '../../../bot-functions/src'

export default {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription(`Add or remove a format role. 🧙`)
        .setDMPermission(false),
    async execute(interaction) {
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        if (!format) return await interaction.reply({ content: `Try using **/role** in channels like: <#414575168174948372> or <#629464112749084673>.`})    
        const roleId = server.rankedRole || format.roleId
        const discordRole = await interaction.guild?.roles.cache.find((role) => role.id === roleId)

        const membership = await Membership.findOne({ where: { '$player.discordId$': interaction.user.id, serverId: interaction.guildId }, include: Player })
        if (!membership) return await interaction.reply({ content: `You are not in the database.`})

        if (!interaction.member.roles.cache.some(role => role.id === roleId)) {
            try {
                await interaction.member.roles.add(roleId)
                const count = await Role.count({ where: { membershipId: membership.id, roleId: roleId } })
                if (!count) {
                    await Role.create({ 
                        membershipId: membership.id,
                        roleId: roleId,
                        roleName: discordRole.name
                    })
                }
                return await interaction.reply({ content: `You now have the ${discordRole.name} role.`})
            } catch (err) {
                console.log(err)
                return await interaction.reply({ content: `Error: Unable to add ${discordRole.name} role.`})
            }
        } else {
            try {
                await interaction.member.roles.remove(roleId)
                const role = await Role.findOne({ where: { membershipId: membership.id, roleId: roleId } })
                await role.destroy()
                return await interaction.reply({ content: `You no longer have the ${discordRole.name} role.`})
            } catch (err) {
                console.log(err)
                return await interaction.reply({ content: `Error: Unable to remove ${discordRole.name} role.`})
            }
        }
    }
}
