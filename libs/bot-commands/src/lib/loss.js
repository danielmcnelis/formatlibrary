
import { SlashCommandBuilder } from 'discord.js'    
import { 
    checkPairing, getDeckType, getMatches, processMatchResult, processTeamResult, 
    selectTournament, createPlayer, isNewUser, hasPartnerAccess, lookForPotentialPairs,
    updateGeneralStats, updateSeasonalStats, getSeason
} from '@fl/bot-functions'

import { emojis } from '@fl/bot-emojis'
import { Entry, Format, Match, Matchup, Pairing, Player, Pool, Replay, Server, Stats, Tournament } from '@fl/models'
import { Op } from 'sequelize'
import { client } from '../client'

// LOSS COMMAND
export default {
    data: new SlashCommandBuilder()
        .setName('loss')
        .setDescription(`Report a loss to another player. 💀`)
        .addUserOption(option =>
            option
                .setName('opponent')
                .setDescription('Tag the user that you lost against.')
                .setRequired(true)
        )
        .setDMPermission(false),
    async execute(interaction) {
        try {
            await interaction.deferReply()
            const now = new Date()
            const winningUser = interaction.options.getUser('opponent')
            const winningMember = await interaction.guild?.members.fetch(winningUser.id).catch((err) => console.log(err))
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            if (winningUser.id === interaction.user.id) return await interaction.editReply({ content: `You cannot lose a match to yourself.`})
            
            if (await isNewUser(winningUser.id)) await createPlayer(winningMember)
            const serverId = server.hasInternalLadder ? server.id : '414551319031054346'
            const winningPlayer = await Player.findOne({ where: { discordId: winningUser.id } })
            const losingPlayer = await Player.findOne({ where: { discordId: interaction.user.id } })
            
            if (winningUser.bot) return await interaction.editReply({ content: `Sorry, Bots do not play ${format.name} Format... *yet*.`})
            if (losingPlayer.isHidden) return await interaction.reply(`You are not allowed to play in the Format Library rated system.`)
            if (winningPlayer.isHidden) return await interaction.reply(`That user is not allowed to play in the Format Library rated system.`)
                
            let format = await Format.findByServerOrChannelId(server, interaction.channelId)

            // Special condition to determine format in the OCG channel on Format Library server
            if (interaction.channelId === '1326708952309698621') {
                try {
                    let activeOcgPairing = await Pairing.findOne({
                        where: {
                            [Op.or]: [
                                {playerAId: winningPlayer.id, playerBid: losingPlayer.id},
                                {playerAId: losingPlayer.id, playerBid: winningPlayer.id}
                            ],                            
                            status: 'active',
                            '$format.category$': 'OCG'
                        },
                        include: Format
                    })

                    const activeOcgTournament = await Tournament.findOne({
                        where: {
                            '$format.category$': 'OCG',
                            state: 'underway'
                        },
                        include: Format
                    })

                    if (activeOcgPairing) {
                        format = activeOcgPairing.format
                    } else if (activeOcgTournament) {
                        format = activeOcgTournament.format
                    }
                } catch (err) {
                    console.log(err)
                }
            }

            if (!format) return await interaction.editReply({ content: `Try using **/loss** in channels like: <#414575168174948372> or <#629464112749084673>.`})
            
            let winnerStats = await Stats.findOne({
                where: {
                    playerId: winningPlayer.id, 
                    formatId: format.id, 
                    serverId: serverId, 
                }
            })

            if (!winnerStats) {
                winnerStats = await Stats.create({
                    playerName: winningPlayer.name, 
                    playerId: winningPlayer.id, 
                    formatName: format.name, 
                    formatId: format.id, 
                    serverId: serverId, 
                    isInternal: server.hasInternalLadder
                })
            }


            let loserStats = await Stats.findOne({
                where: {
                    playerId: losingPlayer.id, 
                    formatId: format.id, 
                    serverId: serverId, 
                }
            })

            if (!loserStats) {
                loserStats = await Stats.create({
                    playerName: losingPlayer.name, 
                    playerId: losingPlayer.id, 
                    formatName: format.name, 
                    formatId: format.id, 
                    serverId: serverId, 
                    isInternal: server.hasInternalLadder
                })
            }

            const activeTournament = await Tournament.count({ where: { state: 'underway', serverId: interaction.guildId, formatName: {[Op.or]: [format.name, 'Multiple']} }}) 
            let isTournament, winningEntry, losingEntry, tournament, match, challongeMatch

            if (activeTournament) {
                const loserTournamentIds = [...await Entry.findByPlayerIdAndFormatId(losingPlayer.id, format.id)].map((e) => e.tournamentId)
                const winnerTournamentIds = [...await Entry.findByPlayerIdAndFormatId(winningPlayer.id, format.id)].map((e) => e.tournamentId)
                const commonTournamentIds = loserTournamentIds.filter((id) => winnerTournamentIds.includes(id))
                const tournaments = []

                if (commonTournamentIds.length) {
                    for (let i = 0; i < commonTournamentIds.length; i++) {
                        const id = commonTournamentIds[i]
                        tournament = await Tournament.findOne({ where: { id: id, serverId: interaction.guildId }})
                        if (!tournament) continue
                        losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id, tournamentId: tournament.id } })
                        winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id, tournamentId: tournament.id } })
                        if (!losingEntry || !winningEntry) continue
                        const data = await getMatches(server, tournament.id, 'open', losingEntry.participantId)
                        if (!data[0]) continue
                        if (checkPairing(data[0].match, losingEntry.participantId, winningEntry.participantId)) {
                            tournaments.push(tournament)
                            break
                        }
                    }
                }

                if (tournaments.length) {
                    const tournament = await selectTournament(interaction, tournaments, interaction.member.user.id)
                    if (tournament) {
                        isTournament = true
                        if (tournament.state === 'pending') return await interaction.editReply({ content: `Sorry, ${tournament.name} has not started yet.`})
                        if (tournament.state === 'processing') return await interaction.editReply({ content: `Sorry, another API request is processing for ${tournament.name}. Please try again shortly.`})
                        if (tournament.state !== 'underway') return await interaction.editReply({ content: `Sorry, ${tournament.name} is not underway.`})
                        challongeMatch = tournament.isTeamTournament ? await processTeamResult(server, interaction, winningPlayer, losingPlayer, tournament, format) :
                            await processMatchResult(server, interaction, winningUser, winningPlayer, interaction.member.user, losingPlayer, tournament, format)
                        if (!challongeMatch) return
                    } else {
                        return
                    }
                }
            }

            const pairing = await Pairing.findOne({
                where: {
                    formatId: format.id,
                    status: 'active',
                    playerAId: {[Op.or]: [winningPlayer.id, losingPlayer.id]},
                    playerBId: {[Op.or]: [winningPlayer.id, losingPlayer.id]}
                }
            })

            const isSeasonal = pairing && format.useSeasonalElo && format.seasonResetDate < now
            let isRated 
            
            if (isTournament) {
                if (tournament.isRated) {
                    isRated = true
                } else {
                    isRated = false
                }
            } else if (server.hasRatedPermission || server.hasInternalLadder || isSeasonal || pairing) {
                isRated = true
            }
             

            if (isRated) { 
                const [winnerDelta, loserDelta, classicDelta] = await updateGeneralStats(winnerStats, loserStats)
                match = await Match.create({
                    winnerName: winningPlayer.name,
                    winnerId: winningPlayer.id,
                    loserName: losingPlayer.name,
                    loserId: losingPlayer.id,
                    tournamentId: tournament?.id,
                    challongeMatchId: challongeMatch?.id,
                    round: challongeMatch?.round,
                    formatName: format.name,
                    formatId: format.id,
                    winnerDelta: winnerDelta,
                    loserDelta: loserDelta,
                    classicDelta: classicDelta,
                    isTournament: isTournament,
                    isRatedPairing: !!pairing && !isTournament,
                    isSeasonal: isSeasonal,
                    isInternal: server.hasInternalLadder,
                    serverId: serverId,
                    pairingId: pairing?.id
                })
            }
            
            if (isSeasonal) {
                await updateSeasonalStats(winnerStats, loserStats)
            } else if (!isRated && !isTournament) {
                return await interaction.editReply({ content: `Sorry, outside of tournaments and war leagues, rated matches may only be played via the official rated pool.`})
            }

            if (!isTournament && pairing) {
                const winnerIsPlayerA = pairing.playerAId === winningPlayer.id
                const winningDeckFile = winnerIsPlayerA ? pairing.deckFileA : pairing.deckFileB
                const losingDeckFile = winnerIsPlayerA ? pairing.deckFileB : pairing.deckFileA
                const winningDeckType = await getDeckType(winningDeckFile, format.name)
                const losingDeckType = await getDeckType(losingDeckFile, format.name)

                await Matchup.create({
                    winningDeckTypeName: winningDeckType?.name,
                    losingDeckTypeName: losingDeckType?.name,
                    winningDeckTypeId: winningDeckType?.id,
                    losingDeckTypeId: losingDeckType?.id,
                    formatId: format.id,
                    formatName: format.name,
                    matchId: match.id,
                    pairingId: pairing.id,
                    source: 'pool'
                })

                await pairing.update({ status: 'complete' })

                const poolsToUpdate = await Pool.findAll({
                    where: {
                        playerId: {[Op.or]: [winningPlayer.id, losingPlayer.id]},
                        status: 'inactive'
                    },
                    include: [Player, Format]
                }) || []

                for (let d = 0; d < poolsToUpdate.length; d++) {
                    const pool = poolsToUpdate[d]
                    await pool.update({ status: 'pending' })
                    lookForPotentialPairs(client, interaction, pool, pool.player, pool.format)
                }
            }

            if (isTournament && tournament.isRated) {
                setTimeout(async () => {
                    const count = await Replay.count({
                        where: {
                            matchId: match?.id
                        }
                    })

                    if (!count) {
                        return interaction.channel.send(`<@${winningPlayer.discordId}>, reminder: you are required to share the replay of your match against ${losingPlayer.name} (use the **/replay** command). ${emojis.one_week}`)
                    }
                }, 5 * 60 * 1000)
            }

            const season = getSeason(now.getMonth())
            const content = `${losingPlayer.name}, your ${isSeasonal ? `Seasonal ${season} ` : server.hasInternalLadder ? 'Internal ' : ''}${format.name} Format ${format.emoji} ${isRated && isTournament ? 'Tournament 🏆 ' : !isRated && isTournament ? 'Unrated Tournament 🏆 ' :''}loss to <@${winningPlayer.discordId}> has been recorded.`
            return await interaction.editReply({ content })
        } catch (err) {
            console.log(err)
        }
    }
}

