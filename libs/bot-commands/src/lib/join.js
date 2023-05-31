
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Server, Team, Tournament } from '@fl/models'
import { askForSimName, getDeckList, getOPDeckList, postParticipant, selectTournament } from '@fl/bot-functions'
import { drawDeck, hasPartnerAccess } from '@fl/bot-functions'
import { Op } from 'sequelize'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Join a tournament. ✅'),
	async execute(interaction) {
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        let format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const tournaments = await Tournament.findByStateAndFormatAndServerId('pending', format, interaction.guildId)
        const player = await Player.findOne({ where: { discordId: interaction.user?.id }})    
        if (!player) return

        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        let entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id }})
        if (!format) format = await Format.findOne({ where: { id: tournament.formatId }})
        if (!format) return

        interaction.editReply({ content: `Please check your DMs.` })
        
        let simName = format.category === 'OP' ? player.opTcgSim || await askForSimName(interaction.member, player, 'OPTCGSim') :
            player.duelingBook || await askForSimName(interaction.member, player, 'DuelingBook')

        if (!simName) return

        const team = tournament.isTeamTournament ? await Team.findOne({
            where: {
                tournamentId: tournament.id,
                [Op.or]: {
                    playerAId: player.id,
                    playerBId: player.id,
                    playerCId: player.id,
                }
            }
        }) : null

        const data = format.category === 'OP' ? await getOPDeckList(interaction.member, player) :
            await getDeckList(interaction.member, player, format)

        if (!data) return

        if (!entry && tournament.isTeamTournament && team) {
            const slot = team.playerAId === player.id ? 'A' :
                team.playerBId === player.id ? 'B' :
                team.playerCId === player.id ? 'C' :
                null

            try { 
                await Entry.create({
                    playerName: player.name,
                    url: data.url,
                    ydk: data.ydk || data.opdk,
                    participantId: team.participantId,
                    playerId: player.id,
                    tournamentId: tournament.id,
                    compositeKey: player.id + tournament.id,
                    slot: slot,
                    teamId: team.id
                })
            } catch (err) {
                console.log(err)
                return interaction.member.send({ content: `${emojis.high_alert} Error: Please do not spam bot commands multiple times. ${emojis.one_week}`})
            }

            const deckAttachments = await drawDeck(data.ydk || data.opdk) || []
            interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
            interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in ${tournament.name}! ${tournament.logo}`})
            deckAttachments.forEach((attachment, index) => {
                if (index === 0) {
                    interaction.member.send({ content: `FYI, this is the deck you submitted:`, files: [attachment] }).catch((err) => console.log(err))
                } else {
                    interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
                }
            })
            
            return await interaction.guild.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> (${team.name}) is now registered for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
        } else if (!entry && tournament.isTeamTournament && !team) {
            try { 
                await Entry.create({
                    playerName: player.name,
                    url: data.url,
                    ydk: data.ydk || data.opdk,
                    playerId: player.id,
                    tournamentId: tournament.id,
                    compositeKey: player.id + tournament.id
                })
            } catch (err) {
                console.log(err)
                return interaction.member.send({ content: `${emojis.high_alert} Error: Please do not spam bot commands multiple times. ${emojis.one_week}`})
            }

            const deckAttachments = await drawDeck(data.ydk || data.opdk) || []
            interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
            interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in ${tournament.name}! ${tournament.logo}`})
            deckAttachments.forEach((attachment, index) => {
                if (index === 0) {
                    interaction.member.send({ content: `FYI, this is the deck you submitted:`, files: [attachment] }).catch((err) => console.log(err))
                } else {
                    interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
                }
            })
            
            return await interaction.guild.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> (Free Agent) is now registered for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
        } else if (!entry && !tournament.isTeamTournament) {
            if (tournament.isPremiumTournament && (!player.subscriber || player.subTier === 'Supporter')) {
                return interaction.member.send({ content: `Sorry premium tournaments are only open to premium server subscribers.`})
            } else if (tournament.isPremiumTournament && player.subTier === 'Premium') {
                const alreadyEntered = await Entry.count({
                    where: {
                        playerId: player.id,
                        '$tournament.isPremiumTournament$': true
                    },
                    include: Tournament
                })

                if (alreadyEntered) {
                    return interaction.member.send({ content: `Sorry, you may only enter one Premium Tournament per month with your current subscription.`})
                }
            }

            try {
                entry = await Entry.create({
                    playerName: player.name,
                    url: data.url,
                    ydk: data.ydk || data.opdk,
                    playerId: player.id,
                    compositeKey: player.id + tournament.id,
                    tournamentId: tournament.id
                })
            } catch (err) {
                console.log(err)
                return interaction.member.send({ content: `${emojis.high_alert} Error: Please do not spam bot commands multiple times. ${emojis.one_week}`})
            }
                                    
            const { participant } = await postParticipant(server, tournament, player).catch((err) => console.log(err))
        
            if (!participant) {
                await entry.destroy()
                return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register on Challonge for ${tournament.name}. ${tournament.logo}`})
            }
            
            await entry.update({ participantId: participant.id })

            const deckAttachments = await drawDeck(data.ydk || data.opdk) || []
            interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
            interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in ${tournament.name}! ${tournament.logo}`})
            deckAttachments.forEach((attachment, index) => {
                if (index === 0) {
                    interaction.member.send({ content: `FYI, this is the deck you submitted:`, files: [attachment] }).catch((err) => console.log(err))
                } else {
                    interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
                }
            })

            return await interaction.guild.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> is now registered for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
        } else if (entry && entry.active === false && tournament.isTeamTournament) {
            await entry.update({
                url: data.url,
                ydk: data.ydk || data.opdk,
                active: true
            })

            const deckAttachments = await drawDeck(data.ydk || data.opdk) || []
            interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
            interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in ${tournament.name}! ${tournament.logo}`})
            deckAttachments.forEach((attachment, index) => {
                if (index === 0) {
                    interaction.member.send({ content: `FYI, this is the deck you submitted:`, files: [attachment] }).catch((err) => console.log(err))
                } else {
                    interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
                }
            })

            return await interaction.guild.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> (${team ? team.name : 'Free Agent'}) is now registered for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
        } else {
            await entry.update({ url: data.url, ydk: data.ydk || data.opdk })
            const deckAttachments = await drawDeck(data.ydk || data.opdk) || []
            interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
            interaction.member.send({ content: `Thanks! I have your updated deck list for ${tournament.name}! ${tournament.logo}`})
            deckAttachments.forEach((attachment, index) => {
                if (index === 0) {
                    interaction.member.send({ content: `FYI, this is the deck you resubmitted:`, files: [attachment] }).catch((err) => console.log(err))
                } else {
                    interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
                }
            })
            
            return await interaction.guild.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> resubmitted their deck list for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
        }
	}
}
