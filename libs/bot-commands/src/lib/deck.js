
import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js'
import { Deck, Entry, Event, Format, Player, Server, Tournament } from '@fl/models'
import { hasPartnerAccess, selectTournamentForDeckCheck } from '@fl/bot-functions'
import { drawDeck, isModerator } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Op } from 'sequelize'

export default {
    data: new SlashCommandBuilder()
        .setName('deck')
        .setDescription(`Check tournament deck. 🧐`)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Tag the user to check.')
                .setRequired(false)
        )
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply()
        const discordId = interaction.options.getUser('user')?.id || interaction.user.id
        const inspectingOtherUser = discordId !== interaction.user.id
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const userIsMod = isModerator(server, interaction.member)
        if (!userIsMod && inspectingOtherUser) return await interaction.editReply({ content: `You do not have permission to do that.` })
    
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const tournaments = userIsMod && inspectingOtherUser ? await Tournament.findRecent(format, interaction.guildId) :
            await Tournament.findActive(format, interaction.guildId)

        const player = await Player.findOne({ where: { discordId: discordId } })
        if (!player) return

        const decks = []

        for (let i = 0; i < tournaments.length; i++) {
            try {
                const tournament = tournaments[i]
                const entry = await Entry.findOne({
                    where: {
                        playerId: player.id,
                        tournamentId: tournament.id
                    }
                })

                if (entry) {
                    decks.push({ 
                        id: 'E' + entry.id,
                        ydk: entry.ydk,
                        tournamentName: tournament.name,
                        tournamentAbbreviation: tournament.abbreviation
                    })
                } else {
                    const event = await Event.findOne({
                        where: {
                            [Op.or]: {
                                primaryTournamentId: tournament.id,
                                topCutTournamentId: tournament.id
                            }
                        }
                    })

                    if (event) {
                        const deck = await Deck.findOne({
                            where: {
                                builderId: player.id,
                                eventId: event.id
                            }
                        })
        
                        if (deck) decks.push({
                            id: 'D' + deck.id,
                            ydk: deck.ydk,
                            tournamentName: tournament.name,
                            tournamentAbbreviation: tournament.abbreviation
                        })
                    }
                }
            } catch (err) {
                console.log(err)
            }
        }

        const deck = await selectTournamentForDeckCheck(interaction, decks, format)
        if (!deck) return

        interaction.editReply({ content: `Please check your DMs.` })
        const deckAttachments = await drawDeck(deck.ydk) || []
        const ydkFile = new AttachmentBuilder(Buffer.from(deck.ydk), { name: `${player.name}_${deck.tournamentAbbreviation || deck.tournamentName}.ydk` })
        deckAttachments.forEach((attachment, index) => {
            if (index === 0) {
                interaction.member.send({ content: `${player.name}'s deck for ${deck.tournamentName}:`, files: [attachment] }).catch((err) => console.log(err))
            } else {
                interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
            }
        })

        return await interaction.member.send({ files: [ydkFile]}).catch((err) => console.log(err))
    }
}