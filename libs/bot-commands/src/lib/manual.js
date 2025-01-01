
import { SlashCommandBuilder } from 'discord.js'    

import { 
    createPlayer, getDeckType, isModerator, isNewUser, hasPartnerAccess, lookForPotentialPairs, 
    checkPairing, getMatches, processMatchResult, processTeamResult, selectTournament,
    updateGeneralStats, updateSeasonalStats
} from '@fl/bot-functions'

import { emojis } from '@fl/bot-emojis'
import { Entry, Format, Match, Matchup, Pairing, Player, Pool, Replay, Server, Stats, Tournament } from '@fl/models'
import { Op } from 'sequelize'
import { client } from '../client'

export default {
    data: new SlashCommandBuilder()
        .setName('manual')
        .setDescription(`Mod Only - Manually report a match result. 👷`)
        .addUserOption(option =>
            option
                .setName('winner')
                .setDescription('Tag the user who won.')
                .setRequired(true))
        .addUserOption(option =>
            option
                .setName('loser')
                .setDescription('Tag the user who lost.')
                .setRequired(true)
        )
        .setDMPermission(false),
    async execute(interaction) {
        try {
            const now = new Date()
            await interaction.deferReply()
            const winner = interaction.options.getUser('winner')
            const winningMember = await interaction.guild?.members.fetch(winner.id).catch((err) => console.log(err))
            
            const loser = interaction.options.getUser('loser')
            const losingMember = await interaction.guild?.members.fetch(loser.id).catch((err) => console.log(err))
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            if (!isModerator(server, interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.`})
            const format = await Format.findByServerOrChannelId(server, interaction.channelId)
            if (!format) return await interaction.editReply({ content: `Try using **/manual** in channels like: <#414575168174948372> or <#629464112749084673>.`})
            
            const winnerDiscordId = winner.id
            const loserDiscordId = loser.id	
            if (winnerDiscordId === loserDiscordId) return await interaction.editReply({ content: `Please specify 2 different players.`})
            if ((winner.bot) ||  (loser.bot)  ) return await interaction.editReply({ content: `Sorry, Bots do not play ${format.name} Format... *yet*.`})

            if (await isNewUser(winnerDiscordId)) await createPlayer(winningMember)
            if (await isNewUser(loserDiscordId)) await createPlayer(losingMember)

            const serverId = server.hasInternalLadder ? server.id : '414551319031054346'
            const winningPlayer = await Player.findOne({ where: { discordId: winnerDiscordId } })
            const losingPlayer = await Player.findOne({ where: { discordId: loserDiscordId } })

            if (winningPlayer.isHidden) return await interaction.reply(`Sorry, <@${winnerDiscordId}> is not allowed to play in the Format Library rated system.`)
            if (losingPlayer.isHidden) return await interaction.reply(`Sorry, <@${loserDiscordId}> is not allowed to play in the Format Library rated system.`)

            const winnerStats = await Stats.findOrCreate({
                where: {
                    playerName: winningPlayer.name, 
                    playerId: winningPlayer.id, 
                    formatName: format.name, 
                    formatId: format.id, 
                    serverId: serverId, 
                    isInternal: server.hasInternalLadder
                }
            })

            const loserStats = await Stats.findOrCreate({
                where: {
                    playerName: losingPlayer.name, 
                    playerId: losingPlayer.id, 
                    formatName: format.name, 
                    formatId: format.id, 
                    serverId: serverId, 
                    isInternal: server.hasInternalLadder
                }
            })
            
            const activeTournament = await Tournament.count({ where: { state: 'underway', serverId: interaction.guildId, formatName: {[Op.or]: [format.name, 'Multiple']} }}) 
            let isTournament, winningEntry, losingEntry, tournament, tournamentId, match, challongeMatch

            if (activeTournament) {
                const loserTournamentIds = [...await Entry.findByPlayerIdAndFormatId(losingPlayer.id, format.id)].map((e) => e.tournamentId)
                const winnerTournamentIds = [...await Entry.findByPlayerIdAndFormatId(winningPlayer.id, format.id)].map((e) => e.tournamentId)
                const commonTournamentIds = loserTournamentIds.filter((id) => winnerTournamentIds.includes(id))
                const tournaments = []
                
                if (commonTournamentIds.length) {
                    for (let i = 0; i < commonTournamentIds.length; i++) {
                        const id = commonTournamentIds[i]
                        tournament = await Tournament.findOne({ where: { id: id, serverId: interaction.guildId, state: 'underway' }})
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
                    const tournament = await selectTournament(interaction, tournaments, interaction.user.id)
                    if (tournament) {
                        isTournament = true
                        challongeMatch = tournament.isTeamTournament ? await processTeamResult(server, interaction, winningPlayer, losingPlayer, tournament, format) :
                            await processMatchResult(server, interaction, winner, winningPlayer, loser, losingPlayer, tournament, format)
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

            console.log('!!pairing', !!pairing)
            const isRated = (isTournament && tournament?.isRanked) || server.hasRatedPermission || server.hasInternalLadder
            console.log('isRated', isRated)
            const isSeasonal = pairing && format.useSeasonalElo && format.seasonResetDate < now
            console.log('isSeasonal', isSeasonal)

            if (isRated || isSeasonal) { 
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
                    serverId: serverId
                })
            }
            
            if (isSeasonal) {
                await updateSeasonalStats(winnerStats, loserStats)
            } else if (!isRated && !isTournament) {
                return await interaction.editReply({ content: `Sorry, outside of tournaments and war leagues, rated matches may only be played via the official rated pool.`})
            }

            if (!isTournament) {
                if (pairing) {
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
                } else {
                    return await interaction.editReply({ content: `Sorry, aside from tournaments, rated matches may only be played via the official rated pool.`})
                }
            }

            const poolsToUpdate = await Pool.findAll({
                where: {
                    playerId: {[Op.or]: [winningPlayer.id, losingPlayer.id]},
                    status: 'inactive'
                }
            }) || []

            for (let d = 0; d < poolsToUpdate.length; d++) {
                const rPTU = poolsToUpdate[d]
                await rPTU.update({ status: 'pending' })
                lookForPotentialPairs(client, interaction, rPTU, rPTU.player, rPTU.format)
            }

            if (isTournament && tournament.isRanked) {
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
            
            const content = `A manual ${isRated ? 'Rated ' : 'Unrated '}${server.hasInternalLadder ? 'Internal ' : ''}${format.name} Format ${format.emoji} ${isSeasonal ? 'Seasonal ' : isTournament ? 'Tournament ' : ''}loss by <@${losingPlayer.discordId}> to <@${winningPlayer.discordId}> has been recorded.`
            return await interaction.editReply({ content })
        } catch (err) {
            console.log(err)
        }	
    }
}