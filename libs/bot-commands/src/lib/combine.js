
import { SlashCommandBuilder } from 'discord.js'    
import { combinePlayers, isModerator } from '@fl/bot-functions'
import { Alius, Deck, Event, Match, Membership, Pairing, Player, Replay, Server } from '@fl/models'
import { Op } from 'sequelize'

// COMBINE
// Use this command to combine two Discord accounts into one.
// Arguments required: @Old_User, @New_User
// The old user's records will be overwritten with the new user's. 
// In the record of matches, the old user id will be replaced by the new user id.
// After this is done, there is no way to tell which matches were played on the old account.
// So be careful with this command. Make sure the accounts are definitely shared.
// When this command is finished, use the **/recalculate** command to update everyone's stats.
export default {
    data: new SlashCommandBuilder()
        .setName('combine')
        .setDescription(`Admin Only - Combine two user accounts. 🏭`)
        .addUserOption(option =>
            option
                .setName('old-user')
                .setDescription('Tag the old user.')
                .setRequired(false))
        .addUserOption(option =>
            option
                .setName('new-user')
                .setDescription('Tag the new user.')
                .setRequired(false)
        )
        .setDMPermission(false),
    async execute(interaction) {
        try {
            await interaction.deferReply()
            const oldDiscordId = interaction.options.getUser('olduser')?.id || interaction.options._hoistedOptions[0].user?.id || interaction.options._hoistedOptions[0].value
            const newDiscordId = interaction.options.getUser('newuser')?.id || interaction.options._hoistedOptions[1].user?.id || interaction.options._hoistedOptions[1].value
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)

            if (!isModerator(server, interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.`})
            if (oldDiscordId === newDiscordId) return await interaction.editReply({ content: `Please specify 2 different users.`})

            const oldPlayer = await Player.findOne({ where: { discordId: oldDiscordId } })
            if (!oldPlayer) return await interaction.editReply({ content: `<@${oldDiscordId}> is not in the database.`})
        
            const newPlayer = await Player.findOne({ where: { discordId: newDiscordId } })
            if (!newPlayer) return await interaction.editReply({ content: `<@${newDiscordId}> is not in the database.`})

            const [formats, count, violations] = await combinePlayers(oldPlayer, newPlayer)

            return await interaction.editReply({ content: 
                `<@${oldDiscordId}>'s ID was replaced with <@${newDiscordId}>'s ID in ${count} match records.` +
                ` ${violations} boosting violation(s) occurred.` +
                `\n\nStats in the following formats need to be recalculated:\n${formats.join("\n")}`
            })
        } catch (err) {
            console.log(err)
            return
        }
    }
}
