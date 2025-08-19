
import { SlashCommandBuilder } from 'discord.js'    
import { isModerator, hasPartnerAccess, recalculateFormatStats } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Format, Match, Server } from '@fl/models'

// RECALCULATE
// Use this command to recalculate every player's Elo from scratch.
// This is needed after matches are directly added or deleted using postgreSQL.
// It's also required after using the !combine command, but the bot will remind you to do it.
export default {
    data: new SlashCommandBuilder()
        .setName('recalculate')
        .setDescription(`Admin Only - Recalculate player stats. 🧮`)
        .addStringOption(option =>
            option
                .setName('format')
                .setDescription('Format to recalculate.')
                .setRequired(false)
        )
        .setDMPermission(false),
    async execute(interaction) {
        try {
            const formatName = interaction.options.getString('format')
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            if (!isModerator(server, interaction.member)) return await interaction.reply({ content: `You do not have permission to do that.`})
            let format = await Format.findByServerOrInputOrChannelId(server, formatName, interaction.channelId)
            const serverId = server.hasInternalLadder ? server.id : '414551319031054346'
            if (!format && (!server.id !== '414551319031054346' || interaction.channel?.name !== 'bot-spam')) return await interaction.reply({ content: `Try using **/recalculate** in channels like: <#414575168174948372> or <#629464112749084673>.`})
            let count = 0
            if (!format && formatName === 'Overall' && server.id === '414551319031054346') {
                format = await Format.findOne({
                    where: {
                        name: 'Overall'
                    }
                })

                const allMatches = await Match.findAll({ attributes: ['id']})
                console.log('!!allMatches', !!allMatches)
                count = allMatches.length
                console.log('allMatches.length', allMatches?.length)
                console.log('count', count)
            } else {
                count = await Match.count({ where: { formatName: format.name, serverId: serverId }})
            }

            interaction.reply({ content: `Recalculating data from ${count} ${format.name} ${format.emoji} matches. Please wait...`})
            await recalculateFormatStats(format)
            return await interaction.channel.send({ content: `Recalculation complete!`})	
        } catch (err) {
            console.log(err)
        }
    }
}

    