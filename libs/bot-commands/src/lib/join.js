
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Server, Team, Tournament } from '@fl/models'
import { askForDBName, getDeckList, postParticipant, selectTournament } from '@fl/bot-functions'
import { drawDeck, hasPartnerAccess } from '@fl/bot-functions'
import { Op } from 'sequelize'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Join a tournament. ✅'),
	async execute(interaction) {
        await interaction.deferReply()
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})

        let format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
        
        const tournaments = await Tournament.findAll({ 
            where: { 
                state: 'pending',
                formatName: format ? format.name : {[Op.not]: null},
                serverId: interaction.guildId
            }, 
            order: [['createdAt', 'ASC']] 
        })
        
        const player = await Player.findOne({ where: { discordId: interaction.user.id }})
        if (!player) return await interaction.editReply({ content: `You are not in the database.`})
        
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        let entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id }})
        if (!format) format = await Format.findOne({ where: { name: {[Op.iLike]: tournament.formatName } }})
        if (!format) return await interaction.editReply(`Unable to determine what format is being played in ${tournament.name}. Please contact an administrator.`)
        interaction.editReply({ content: `Please check your DMs.` })
        
        const dbName = player.duelingBook ? player.duelingBook : await askForDBName(interaction.member, player)
        if (!dbName) return

        const team = await Team.findOne({
            where: {
                tournamentId: tournament.id,
                [Op.or]: {
                    playerAId: player.id,
                    playerBId: player.id,
                    playerCId: player.id,
                }
            }
        })

        if (tournament.isTeamTournament && !team) return

        const { url, ydk } = await getDeckList(interaction.member, player, format)
        if (!url || !ydk) return

        if (!entry && team) {
            const slot = team.playerAId === player.id ? 'A' :
                team.playerBId === player.id ? 'B' :
                team.playerCId === player.id ? 'C' :
                null

            try { 
                await Entry.create({
                    playerName: player.name,
                    url: url,
                    ydk: ydk,
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

            const deckAttachments = await drawDeck(ydk) || []
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
        } else if (!entry && !tournament.isTeamTournament) {
            try {
                entry = await Entry.create({
                    playerName: player.name,
                    url: url,
                    ydk: ydk,
                    playerId: player.id,
                    compositeKey: player.id + tournament.id,
                    tournamentId: tournament.id
                })
            } catch (err) {
                console.log(err)
                return interaction.member.send({ content: `${emojis.high_alert} Error: Please do not spam bot commands multiple times. ${emojis.one_week}`})
            }
                                    
            const { participant } = await postParticipant(server, tournament, player)
            
            if (!participant) {
                await entry.destroy()
                return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register on Challonge for ${tournament.name}. ${tournament.logo}`})
            }
            
            await entry.update({ participantId: participant.id })

            const deckAttachments = await drawDeck(ydk) || []
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
        } else if (entry && entry.active === false && team) {
            await entry.update({
                url: url,
                ydk: ydk,
                active: true
            })

            const deckAttachments = await drawDeck(ydk) || []
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
        } else if (entry.active === false) {
            const { participant } = await postParticipant(server, tournament, player)
            if (!participant) return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register on Challonge for ${tournament.name}. ${tournament.logo}`})
                                        
            await entry.update({
                url: url,
                ydk: ydk,
                participantId: participant.id,
                active: true
            })

            const deckAttachments = await drawDeck(ydk) || []
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
        } else {
            await entry.update({ url: url, ydk: ydk })
            
            const deckAttachments = await drawDeck(ydk) || []
            interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
            interaction.member.send({ content: `Thanks! I have your updated deck list for ${tournament.name}! ${tournament.logo}`})
            deckAttachments.forEach((attachment, index) => {
                if (index === 0) {
                    interaction.member.send({ content: `FYI, this is the deck you submitted:`, files: [attachment] }).catch((err) => console.log(err))
                } else {
                    interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
                }
            })
            
            return await interaction.guild.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> resubmitted their deck list for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
        }
	}
}
