
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Server, Team, Tournament } from '@fl/models'
import { askForSimName, getDeckList, getSpeedDeckList, postParticipant, selectTournament } from '@fl/bot-functions'
import { isModerator, hasPartnerAccess } from '@fl/bot-functions'
import { Op } from 'sequelize'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('signup')
		.setDescription('Mod Only - Sign-up another user for a tournament. 🙋')
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to sign-up.')
                .setRequired(true)
        )
        .setDMPermission(false),
	async execute(interaction) {
        try {
            await interaction.deferReply()
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            if (!isModerator(server, interaction.member)) return await interaction.editReply({ content: 'You do not have permission to do that. Please type **/join** instead.'})           
            let format = await Format.findByServerOrChannelId(server, interaction.channelId)
            const tournaments = await Tournament.findByState({[Op.or]: ['pending', 'standby']}, format, interaction.guildId, 'ASC')
            const user = interaction.options.getUser('player')
            const member = await interaction.guild?.members.fetch(user.id)
            const player = await Player.findOne({ where: { discordId: user.id }})
            if (!player) return await interaction.editReply({ content: `That player is not in the database.`})
            if (player.isHidden) return await interaction.reply(`That player is not allowed to play in Format Library sanctioned tournaments.`)

            const tournament = await selectTournament(interaction, tournaments)
            if (!tournament) return

            let entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id }})
            if (!format) format = await Format.findOne({ where: { name: {[Op.iLike]: tournament.formatName } }})
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
                            return await interaction.editReply({ content: `That team already has a player registered for ${format.name} Format. ${format.emoji}` })
                        }
                    }
                }
            }
    
            interaction.editReply({ content: `Please check your DMs.`})
            
            const simName = player.duelingBookName || await askForSimName(interaction.member, player, 'DuelingBook')
            if (!simName) return

            const data = format.category === format.category === 'Speed' ? await getSpeedDeckList(interaction.member, player, format) :
                await getDeckList(interaction.member, player, format, true, !tournament.isRated)

            if (!data) return await interaction.editReplay({ content: `Error processing deck list.` })

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


                await entry.update({ 
                    url: data.url, 
                    ydk: data.ydk || data.opdk, 
                    skillCardId: data.skillCard?.id
                })
                
                interaction.member.send({ content: `Thanks! I have ${player.name}'s updated deck list for the tournament.` }).catch((err) => console.log(err))
                return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `A moderator resubmitted <@${player.discordId}>'s deck list for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
            } else if (!entry && !tournament.isTeamTournament) {
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
                                            
                const { participant } = await postParticipant(server, tournament, player.name)

                if (!participant) {
                    await entry.destroy()
                    return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register ${player.name} on Challonge for ${tournament?.name}. ${tournament.logo}`})
                }

                await entry.update({ participantId: participant.id })
                if (server.tournamentRoleId) {
                    member.roles.add(server.tournamentRoleId).catch((err) => console.log(err))
                }
                interaction.member.send({ content: `Thanks! I have all the information we need for ${player.name}.` }).catch((err) => console.log(err))
                return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `A moderator signed up <@${player.discordId}> for ${tournament?.name}! ${tournament.logo}`}).catch((err) => console.log(err))
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

                member.roles.add(server.tournamentRoleId).catch((err) => console.log(err))
                interaction.member.send({ content: `Thanks! I have all the information we need for ${player.name}.`})
                return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `A moderator signed up <@${player.discordId}> (${team.name}) for ${tournament?.name}! ${tournament.logo}`}).catch((err) => console.log(err))        
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

                member.roles.add(server.tournamentRoleId).catch((err) => console.log(err))
                interaction.member.send({ content: `Thanks! I have all the information we need for ${player.name}.`})
                return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `A moderator signed up <@${player.discordId}> as a Free Agent for ${tournament?.name}! ${tournament.logo}`}).catch((err) => console.log(err))        
            }
        } catch (err) {
            console.log(err)
        }
    }
}