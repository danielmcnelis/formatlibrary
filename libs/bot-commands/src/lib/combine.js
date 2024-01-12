
import { SlashCommandBuilder } from 'discord.js'    
import { isMod } from '@fl/bot-functions'
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
                .setRequired(true))
        .addUserOption(option =>
            option
                .setName('new-user')
                .setDescription('Tag the new user.')
                .setRequired(true)
        )
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply()
        const oldDiscordId = interaction.options.getUser('olduser')?.id || interaction.options._hoistedOptions[0].user?.id || interaction.options._hoistedOptions[0].value
        console.log('oldDiscordId', oldDiscordId)
        const newDiscordId = interaction.options.getUser('newuser')?.id || interaction.options._hoistedOptions[1].user?.id || interaction.options._hoistedOptions[1].value
        console.log('newDiscordId', newDiscordId)

        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!isMod(server, interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.`})
        if (oldDiscordId === newDiscordId) return await interaction.editReply({ content: `Please specify 2 different users.`})

        const oldPlayer = await Player.findOne({ where: { discordId: oldDiscordId } })
        if (!oldPlayer) return await interaction.editReply({ content: `<@${oldDiscordId}> is not in the database.`})

        const newPlayer = await Player.findOne({ where: { discordId: newDiscordId } })
        if (!newPlayer) return await interaction.editReply({ content: `<@${newDiscordId}> is not in the database.`})

        const aliuses = await Alius.findAll({
            where: {
                playerId: oldPlayer.id
            }
        })

        for (let i = 0; i < aliuses.length; i++) {
            const alius = aliuses[i]
            await alius.update({ playerId: newPlayer.id })
        }

        const decks = await Deck.findAll({
            where: {
                playerId: oldPlayer.id
            }
        })

        for (let i = 0; i < decks.length; i++) {
            const deck = decks[i]
            await deck.update({ playerId: newPlayer.id })
        }

        const events = await Event.findAll({
            where: {
                playerId: oldPlayer.id
            }
        })

        for (let i = 0; i < events.length; i++) {
            const event = events[i]
            await event.update({ playerId: newPlayer.id })
        }

        const membership = await Membership.findOne({
            where: {
                playerId: oldPlayer.id
            }
        })

        if (membership) await membership.destroy()

        const replays = await Replay.findAll({
            where: {
                [Op.or]: [
                    { winnerId: oldPlayer.id },
                    { loserId: oldPlayer.id }
                ]
            }
        })

        for (let i = 0; i < replays.length; i++) {
            const replay = replays[i]
            
            if (replay.winnerId === oldPlayer.id) {     
                await replay.update({
                    winnerId: newPlayer.id,
                    winner: newPlayer.discordName
                })
                count++
            } else if (replay.loserId === oldPlayer.id) {
                await replay.update({
                    loserId: newPlayer.id,
                    loser: newPlayer.discordName
                })
                count++
            }
        }

        const pairings = await Pairing.findAll({
            where: {
                [Op.or]: [
                    { playerAId: oldPlayer.id },
                    { playerBId: oldPlayer.id }
                ]
            }
        })

        for (let i = 0; i < pairings.length; i++) {
            const pairing = pairings[i]
            
            if (pairing.playerAId === oldPlayer.id) {     
                await pairing.update({
                    playerAId: newPlayer.id,
                    playerAName: newPlayer.discordName
                })
                count++
            } else if (pairing.playerBId === oldPlayer.id) {
                await pairing.update({
                    playerBId: newPlayer.id,
                    playerBName: newPlayer.discordName
                })
                count++
            }
        }

        for (let i = 0; i < decks.length; i++) {
            const deck = decks[i]
            await deck.update({ playerId: oldPlayer.id })
        }

        const matches = await Match.findAll({
            where: {
                [Op.or]: [
                    { winnerId: oldPlayer.id },
                    { loserId: oldPlayer.id }
                ]
            }
        })

        let violations = 0
        let count = 0
        let formats = []

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i]
            const format = match.formatName
            if (!formats.includes(format)) formats.push(format)
            
            if (
                (match.winnerId === oldPlayer.id && match.loserId === newPlayer.id) || 
                (match.loserId === oldPlayer.id && match.winnerId === newPlayer.id)
            ) {
                violations++
                await match.destroy()
            } else if (match.winnerId === oldPlayer.id) {     
                await match.update({
                    winnerId: newPlayer.id,
                    winner: newPlayer.discordName
                })
                count++
            } else if (match.loserId === oldPlayer.id) {
                await match.update({
                    loserId: newPlayer.id,
                    loser: newPlayer.discordName
                })
                count++
            }
        }

        return await interaction.editReply({ content: 
            `<@${oldPlayer.discordId}>'s ID was replaced with <@${newPlayer.discordId}>'s ID in ${count} match records.` +
            ` ${violations} boosting violation(s) occurred.` +
            `\n\nStats in the following formats need to be recalculated:\n${formats.join("\n")}`
        })
    }
}
