
import { SlashCommandBuilder } from 'discord.js'    
import { createPlayer, getDeckType, postStory, isMod, isNewUser, hasAffiliateAccess, isIronPlayer, isTourPlayer, checkPairing, getMatches, processMatchResult, processTeamResult, selectTournament } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Entry, Format, Iron, Match, Matchup, Pairing, Player, Pool, Server, Stats, Tournament } from '@fl/models'
import { Op } from 'sequelize'

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
        ),
    async execute(interaction) {
        await interaction.deferReply()
        const winner = interaction.options.getUser('winner')
        const winningMember = await interaction.guild.members.fetch(winner.id)
        const loser = interaction.options.getUser('loser')
        const losingMember = await interaction.guild.members.fetch(loser.id)
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasAffiliateAccess(server)) return await interaction.editReply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.`})
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        if (!format) return await interaction.editReply({ content: `Try using **/manual** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        
        const winnerDiscordId = winner.id
        const loserDiscordId = loser.id	
        if (winnerDiscordId === loserDiscordId) return await interaction.editReply({ content: `Please specify 2 different players.`})
        if ((winner.bot) ||  (loser.bot)  ) return await interaction.editReply({ content: `Sorry, Bots do not play ${format.name} Format... *yet*.`})

        if (await isNewUser(winnerDiscordId)) await createPlayer(winningMember)
        if (await isNewUser(loserDiscordId)) await createPlayer(losingMember)

        const serverId = server.internalLadder ? server.id : '414551319031054346'
        const winningPlayer = await Player.findOne({ where: { discordId: winnerDiscordId } })
        const wCount = await Stats.count({ where: { playerId: winningPlayer.id, format: format.name, serverId: serverId } })
        if (!wCount) await Stats.create({ playerId: winningPlayer.id, format: format.name, serverId: serverId, internal: server.internalLadder })
        const winnerStats = await Stats.findOne({ where: { playerId: winningPlayer.id, format: format.name, serverId: serverId } })
        const losingPlayer = await Player.findOne({ where: { discordId: loserDiscordId } })
        const lCount = await Stats.count({ where: { playerId: losingPlayer.id, format: format.name, serverId: serverId } })
        if (!lCount) await Stats.create({ playerId: losingPlayer.id, format: format.name, serverId: serverId, internal: server.internalLadder })
        const loserStats = await Stats.findOne({ where: { playerId: losingPlayer.id, format: format.name, serverId: serverId } })

        if (!losingPlayer || !loserStats) return await interaction.editReply({ content: `Sorry, <@${loserDiscordId}> is not in the database.`})
        if (!winningPlayer || !winnerStats) return await interaction.editReply({ content: `Sorry, <@${winnerDiscordId}> is not in the database.`})

        const loserHasTourRole = await isTourPlayer(server, losingMember)
        const winnerHasTourRole = await isTourPlayer(server, winningMember)
        const activeTournament = await Tournament.count({ where: { state: 'underway', serverId: interaction.guildId, formatName: format.name } }) 
        let isTournament
        let winningEntry
        let losingEntry
        let tournament
        let tournamentId
        let challongeMatch

        const loserHasIronRole = isIronPlayer(losingMember)
        const winnerHasIronRole = isIronPlayer(winningMember)
        const activeIron = await Iron.count({ where: { format: format.name, status: 'active' }})
        let isIronMatch

        if (loserHasTourRole && winnerHasTourRole && activeTournament) {
            const loserEntries = await Entry.findByPlayerIdAndFormatId(losingPlayer.id, format.id)
            const winnerEntries = await Entry.findByPlayerIdAndFormatId(winningPlayer.id, format.id)
            
            if (loserEntries.length && winnerEntries.length) {
                const loserTournamentIds = []
                const winnerTournamentIds = []
                const commonTournamentIds = []
                const tournaments = []

                for (let i = 0; i < loserEntries.length; i++) {
                    const entry = loserEntries[i]
                    loserTournamentIds.push(entry.tournament.id)
                }

                for (let i = 0; i < winnerEntries.length; i++) {
                    const entry = winnerEntries[i]
                    winnerTournamentIds.push(entry.tournament.id)
                }

                for (let i = 0; i < loserTournamentIds.length; i++) {
                    const tournament_id = loserTournamentIds[i]
                    if (winnerTournamentIds.includes(tournament_id)) {
                        commonTournamentIds.push(tournament_id)
                    }
                }
                
                if (commonTournamentIds.length) {
                    for (let i = 0; i < commonTournamentIds.length; i++) {
                        const id = commonTournamentIds[i]
                        tournament = await Tournament.findOne({ where: { id: id, serverId: interaction.guildId }})
                        if (!tournament) continue
                        losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id, tournamentId: tournament.id } })
                        winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id, tournamentId: tournament.id } })
                        if (!losingEntry || !winningEntry) continue
                        const matches = await getMatches(server, tournament.id)
                        if (!matches) continue
                        for (let i = 0; i < matches.length; i++) {
                            const match = matches[i].match
                            if (match.state !== 'open') continue
                            if (checkPairing(match, losingEntry.participantId, winningEntry.participantId)) {
                                tournaments.push(tournament)
                                break
                            }
                        }
                    }
                }
                    
                if (tournaments.length) {
                    const tournament = await selectTournament(interaction, tournaments, interaction.user.id)
                    if (tournament) {
                        isTournament = true
                        tournamentId = tournament.id
                        if (tournament.state === 'pending' || tournament.state === 'standby') return await interaction.editReply({ content: `Sorry, ${tournament.name} has not started yet.`})
                        if (tournament.state !== 'underway') return await interaction.editReply({ content: `Sorry, ${tournament.name} is not underway.`})
                        challongeMatch = tournament.isTeamTournament ? await processTeamResult(server, interaction, winningPlayer, losingPlayer, tournament, format) :
                            await processMatchResult(server, interaction, winningMember, winningPlayer, losingMember, losingPlayer, tournament, format)
                        if (!challongeMatch) return
                    } else {
                        return
                    }
                }
            }
        } else if (loserHasIronRole && winnerHasIronRole && activeIron) {
            const teamA = [...await Iron.findAll({ 
                where: {
                    format: format.name,
                    team: 'A',
                    eliminated: false
                },
                order: [["position", "ASC"]]
            })]
        
            const teamB = [...await Iron.findAll({ 
                where: {
                    format: format.name,
                    team: 'B',
                    eliminated: false
                },
                order: [["position", "ASC"]]
            })]
  
            const ironPersonA = teamA[0]
            const ironPersonB = teamB[0]

            if (winningPlayer.id === ironPersonA.playerId && losingPlayer.id === ironPersonB.playerId) {
                isIronMatch = true
                ironPersonB.eliminated = true
                await ironPersonB.save()
                setTimeout(() => postStory(interaction.channel, format), 5000)
            } else if (winningPlayer.id === ironPersonB.playerId && losingPlayer.id === ironPersonA.playerId) {
                isIronMatch = true
                ironPersonA.eliminated = true
                await ironPersonA.save()
                setTimeout(() => postStory(interaction.channel, format), 5000)
            } else {
                return await interaction.editReply({ content: `Sorry, ${winningPlayer.name} is not ${losingPlayer.name}'s ${format.name} Iron opponent. ${server.emoji || format.emoji} ${emojis.iron}`})
            }
        }
        
        const origEloWinner = winnerStats.elo || 500.00
        const origEloLoser = loserStats.elo || 500.00
        const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origEloWinner - origEloLoser) / 400))))))
        
        winnerStats.elo = origEloWinner + delta
        if (origEloWinner + delta > winnerStats.bestElo) winnerStats.bestElo = origEloWinner + delta
        winnerStats.backupElo = origEloWinner
        winnerStats.wins++
        winnerStats.games++
        winnerStats.inactive = false
        winnerStats.streak++
        if (winnerStats.streak >= winnerStats.bestStreak) winnerStats.bestStreak++
        if (challongeMatch && tournament?.pointsEligible) winnerStats.tournamentPoints += challongeMatch.round + 1
        if (!await Match.checkIfVanquished(format.id, winningPlayer.id, losingPlayer.id)) winnerStats.vanquished++
        await winnerStats.save()

        loserStats.elo = origEloLoser - delta
        loserStats.backupElo = origEloLoser
        loserStats.losses++
        loserStats.games++
        loserStats.inactive = false
        loserStats.streak = 0
        if (challongeMatch?.round === 1 && tournament?.pointsEligible) loserStats.tournamentPoints++
        await loserStats.save()

        const match = await Match.create({
            winner: winningPlayer.name,
            winnerId: winningPlayer.id,
            loser: losingPlayer.name,
            loserId: losingPlayer.id,
            isTournament: isTournament,
            tournamentId: tournamentId,
            challongeMatchId: challongeMatch?.id,
            round: challongeMatch?.round,
            formatName: format.name,
            formatId: format.id,
            delta: delta,
            serverId: serverId,
            internal: server.internalLadder
        })

        if (!isTournament && !isIronMatch) {
            const pairing = await Pairing.findOne({
                where: {
                    formatId: format.id,
                    status: 'active',
                    playerAId: {[Op.or]: [winningPlayer.id, losingPlayer.id]},
                    playerBId: {[Op.or]: [winningPlayer.id, losingPlayer.id]}
                }
            })

            if (pairing) {
                const winnerIsPlayerA = pairing.playerAId === winningPlayer.id
                console.log('winnerIsPlayerA', winnerIsPlayerA)
                const winningDeckFile = winnerIsPlayerA ? pairing.deckFileA : pairing.deckFileB
                const losingDeckFile = winnerIsPlayerA ? pairing.deckFileB : pairing.deckFileA
                console.log('winningDeckFile', winningDeckFile)
                console.log('losingDeckFile', losingDeckFile)
                const winningDeckType = await getDeckType(winningDeckFile, format.name)
                const losingDeckType = await getDeckType(losingDeckFile, format.name)
                console.log('winningDeckType', winningDeckType)
                console.log('losingDeckType', losingDeckType)

                await Matchup.create({
                    winningDeckType: winningDeckType?.name,
                    losingDeckType: losingDeckType?.name,
                    winningDeckTypeId: winningDeckType?.id,
                    losingDeckTypeId: losingDeckType?.id,
                    formatId: format.id,
                    formatName: format.name,
                    matchId: match.id,
                    pairingId: pairing.id,
                    source: 'pool'
                })

                await pairing.update({ status: 'complete' })
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
        }

        return await interaction.editReply({ content: `A manual ${server.internalLadder ? 'Internal ' : ''}${format.name} Format ${server.emoji || format.emoji} ${isTournament ? 'Tournament ' : isIronMatch ? `Iron ${emojis.iron}` : ''}loss by <@${losingPlayer.discordId}>${tournament?.pointsEligible && challongeMatch?.round ? ` (+1 TP)` : ''} to <@${winningPlayer.discordId}>${tournament?.pointsEligible ? ` (+${challongeMatch.round + 1} TP)` : ''} has been recorded.`})		
    }
}