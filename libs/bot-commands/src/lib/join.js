
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Server, Team, Tournament } from '@fl/models'
import { drawDeck, getForgedDeckList, getGenesysDeckList, hasPartnerAccess, askForSimName, askForTimeZone, createPlayer, getDeckList, getSpeedDeckList, isNewUser, postParticipant, selectTournament } from '@fl/bot-functions'
import { Op } from 'sequelize'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Join a tournament. ✅')
        .setDMPermission(false),
	async execute(interaction) {
        try {
            await interaction.deferReply()
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            let format = await Format.findByServerOrChannelId(server, interaction.channelId)
            const tournaments = await Tournament.findByState('pending', format, interaction.guildId, 'ASC')
            const member = await interaction.guild?.members.fetch(interaction.user?.id)
            if (await isNewUser(interaction.user?.id)) await createPlayer(member)
            const player = await Player.findOne({ where: { discordId: interaction.user?.id }})    
            if (!player) { return await interaction.editReply({ content: `You are not in the database. Please try again.`})}
            if (player.isHidden) return await interaction.reply(`You are not allowed to play in Format Library sanctioned tournaments.`)

            const tournament = await selectTournament(interaction, tournaments, 'ASC')
            if (!tournament) return

            // if (tournament.isPremiumTournament && (!player.isSubscriber || player.subscriberTier === 'Supporter')) {
            //     return interaction.editReply({ content: `Sorry, premium tournaments are only open to premium subscribers.`})
            // } else 
            if (tournament.requiredRoleId && tournament.alternateRoleId && !interaction.member?._roles.includes(tournament.requiredRoleId) && !interaction.member?._roles.includes(tournament.alternateRoleId)) {
                return interaction.editReply({ content: `Sorry, you must have the <@&${tournament.requiredRoleId}> or <@&${tournament.alternateRoleId}> role to join ${tournament.name}.`})
            } else if (tournament.requiredRoleId && !tournament.alternateRoleId && !interaction.member?._roles.includes(tournament.requiredRoleId)) {
                return interaction.editReply({ content: `Sorry, you must have the <@&${tournament.requiredRoleId}> role to join ${tournament.name}.`})
            } 

            let entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id }})
            if (!format) format = await Format.findOne({ where: { id: tournament.formatId }})
            if (!format) return await interaction.editReply({ content: `Please register in a specific format channel.`})
            let team

            if (tournament.isTeamTournament) {
                team = await Team.findOne({
                    where: {
                        tournamentId: tournament.id,
                        [Op.or]: {
                            playerAId: player.id,
                            playerBId: player.id,
                            playerCId: player.id,
                        }
                    }
                })

                if (tournament.name?.includes('Multi-Format')) {
                    if (!team) {
                        return await interaction.editReply({ content: `Sorry, you cannot register for ${tournament.name} ${tournament.logo} as a Free Agent. A designated captain must first purchase the MFS Captain's Pass then register your team.`}).catch((err) => console.log(err))
                    } else if (format?.name !== 'Goat' && format?.name !== 'Edison' && format?.name !== 'Tengu Plant') {
                        return await interaction.editReply({ content: `To register for ${tournament.name} ${tournament.logo} you must submit a deck for Goat, Edison, or Tengu Plant Format.` })
                    } else if (!entry) {
                        const count = await Entry.count({
                            where: {
                                teamId: team?.id,
                                slot: format.name
                            }
                        })
            
                        if (count) {
                            return await interaction.editReply({ content: `Sorry, your team already has a player registered for ${format.name} Format. ${format.emoji}` })
                        }
                    }
                }
            }

            interaction.editReply({ content: `Please check your DMs.` })
            
            let simName = player.duelingBookName || await askForSimName(interaction.member, player, 'DuelingBook')
            if (!simName) return

            let timeZone = !tournament.isLive ? player.timeZone || await askForTimeZone(interaction.member, player) : 'N/A'
            if (!timeZone) return

            const data = format.name === 'Genesys' ? await getGenesysDeckList(interaction.member, player) :
                format.name === 'Forged in Chaos' ? await getForgedDeckList(interaction.member, player, format) :
                format.category === 'Speed' ? await getSpeedDeckList(interaction.member, player, format) :
                await getDeckList(interaction.member, player, format, false, !tournament.isRated)

            if (!data) return

            if (entry) {
                if (!entry.participantId) {
                    const { participant } = await postParticipant(server, tournament, player.name).catch((err) => console.log(err))
            
                    if (!participant) {
                        await entry.destroy()
                        return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register on Challonge for ${tournament.name}. ${tournament.logo}`})
                    } else {
                        await entry.update({ participantId: participant.id })
                    }
                }

                let slot
                if (tournament.isTeamTournament && tournament.name?.includes('Multi-Format')) {
                    slot = format.name
                }
                
                await entry.update({ 
                    url: data.url, 
                    ydk: data.ydk || data.opdk,
                    skillCardId: data.skillCard?.id,
                    slot: slot
                }) 

                const deckAttachments = await drawDeck(data.ydk) || []
                if (server.tournamentRoleId) {
                    interaction.member.roles.add(server.tournamentRoleId).catch((err) => console.log(err))
                }
                interaction.member.send({ content: `Thanks! I have your updated deck list for ${tournament.name}! ${tournament.logo}`})
                deckAttachments.forEach((attachment, index) => {
                    if (index === 0) {
                        interaction.member.send({ content: `FYI, this is the deck you resubmitted:`, files: [attachment] }).catch((err) => console.log(err))
                    } else {
                        interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
                    }
                })
                
                return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> resubmitted their deck list for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
            } else if (!entry && !tournament.isTeamTournament) {
                // if (tournament.isPremiumTournament && player.subscriberTier === 'Premium') {
                //     const alreadyEntered = await Entry.count({
                //         where: {
                //             playerId: player.id,
                //             '$tournament.isPremiumTournament$': true
                //         },
                //         include: Tournament
                //     })

                //     if (alreadyEntered > 2) {
                //         return interaction.member.send({ content: `Sorry, you may only enter two (2) Premium Tournaments this month with your current subscription.`})
                //     }
                // }
        
                try {
                    entry = await Entry.create({
                        playerName: player.name,
                        url: data.url,
                        ydk: data.ydk || data.opdk,
                        skillCardId: data.skillCard?.id,
                        playerId: player.id,
                        compositeKey: player.id + tournament.id,
                        tournamentId: tournament.id
                    })
                } catch (err) {
                    console.log(err)
                    return interaction.member.send({ content: `${emojis.high_alert} Error: Please do not spam bot commands multiple times. ${emojis.one_week}`})
                }
                                            
                const { participant } = await postParticipant(server, tournament, player.name).catch((err) => console.log(err))
            
                if (!participant) {
                    await entry.destroy()
                    return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register on Challonge for ${tournament.name}. ${tournament.logo}`})
                }
                    
                await entry.update({ participantId: participant.id })
                if (server.tournamentRoleId) {
                     interaction.member.roles.add(server.tournamentRoleId).catch((err) => console.log(err))
                }
                interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in ${tournament.name}! ${tournament.logo}`})
                
                const deckAttachments = await drawDeck(data.ydk) || []
                deckAttachments.forEach((attachment, index) => {
                    if (index === 0) {
                        interaction.member.send({ content: `FYI, this is the deck you submitted:`, files: [attachment] }).catch((err) => console.log(err))
                    } else {
                        interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
                    }
                })

                return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> is now registered for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
            } else if (!entry && tournament.isTeamTournament && team) {
                const slot = tournament.name?.includes('Multi-Format') ? format.name :
                    team.playerAId === player.id ? 'A' :
                    team.playerBId === player.id ? 'B' :
                    team.playerCId === player.id ? 'C' :
                    null

                try {
                    await Entry.create({
                        playerName: player.name,
                        url: data.url,
                        ydk: data.ydk || data.opdk,
                        skillCardId: data.skillCard?.id,
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

                const deckAttachments = await drawDeck(data.ydk) || []
                if (server.tournamentRoleId) {
                    interaction.member.roles.add(server.tournamentRoleId).catch((err) => console.log(err))
                }
                interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in ${tournament.name}! ${tournament.logo}`})
                deckAttachments.forEach((attachment, index) => {
                    if (index === 0) {
                        interaction.member.send({ content: `FYI, this is the deck you submitted:`, files: [attachment] }).catch((err) => console.log(err))
                    } else {
                        interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
                    }
                })
                
                return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> (${team.name}) is now registered for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
            } else if (!entry && tournament.isTeamTournament && !team) {
                try { 
                    await Entry.create({
                        playerName: player.name,
                        url: data.url,
                        ydk: data.ydk || data.opdk,
                        skillCardId: data.skillCard?.id,
                        playerId: player.id,
                        tournamentId: tournament.id,
                        compositeKey: player.id + tournament.id
                    })
                } catch (err) {
                    console.log(err)
                    return interaction.member.send({ content: `${emojis.high_alert} Error: Please do not spam bot commands multiple times. ${emojis.one_week}`})
                }

                const deckAttachments = await drawDeck(data.ydk) || []
                if (server.tournamentRoleId) {
                    interaction.member.roles.add(server.tournamentRoleId).catch((err) => console.log(err))
                }
                interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in ${tournament.name}! ${tournament.logo}`})
                deckAttachments.forEach((attachment, index) => {
                    if (index === 0) {
                        interaction.member.send({ content: `FYI, this is the deck you submitted:`, files: [attachment] }).catch((err) => console.log(err))
                    } else {
                        interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
                    }
                })
                
                return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> (Free Agent) is now registered for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
            }   
        } catch (err) {
            console.log(err)
        }
    }
}
