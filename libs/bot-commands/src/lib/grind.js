
    import { SlashCommandBuilder } from 'discord.js'    
    import { hasFullAccess } from '@fl/bot-functions'
    import { emojis } from '@fl/bot-emojis'
    import { Format, Player, Membership, Role, Server } from '@fl/models'
    import { Op } from 'sequelize'

    export default {
        data: new SlashCommandBuilder()
            .setName('grind')
            .setDescription(`Add or remove a grinder role. 👷`),
        async execute(interaction) {
            const server = !interaction.guildId ? {} : 
                await Server.findOne({ where: { id: interaction.guildId }}) || 
                await Server.create({ id: interaction.guildId, name: interaction.guild.name })

            if (!hasFullAccess(server)) return await interaction.reply({ content: `This feature is only available in Format Library. ${emojis.FL}`})
            const format = await Format.findOne({
                where: {
                    [Op.or]: {
                        name: { [Op.iLike]: server.format },
                        channel: interaction.channelId
                    }
                }
            })
    
            if (!format) return await interaction.reply({ content: `Try using **/grind** in channels like: <#414575168174948372> or <#629464112749084673>.`})
            
            const roleId = format.grinders
            const roleName = `${format.name} Grinders`
    
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
                            roleName: roleName
                        })
                    }
                    return await interaction.reply({ content: `You now have the ${roleName} role.`})
                } catch (err) {
                    console.log(err)
                    return await interaction.reply({ content: `Error: Unable to add ${roleName} role.`})
                }
            } else {
                try {
                    await interaction.member.roles.remove(roleId)
                    const role = await Role.findOne({ where: { membershipId: membership.id, roleId: roleId } })
                    await role.destroy()
                    return await interaction.reply({ content: `You no longer have the ${roleName} role.`})
                } catch (err) {
                    console.log(err)
                    return await interaction.reply({ content: `Error: Unable to remove ${roleName} role.`})
                }
            }
        }
    }
