
import { SlashCommandBuilder } from 'discord.js'    
import { checkPairing, getDeckType, getMatches, processMatchResult, processTeamResult, selectTournament, postStory, createPlayer, isNewUser, hasAffiliateAccess, isIronPlayer, lookForPotentialPairs } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Entry, Format, Iron, Match, Matchup, Pairing, Player, Pool, Server, Stats, Tournament } from '@fl/models'
import { Op } from 'sequelize'
import { client } from '../client'

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
        await interaction.deferReply()
        const winninguser = interaction.options.getUser('opponent')
        const member = await interaction.guild?.members.fetch(interaction.user.id)
        const winningMember = await interaction.guild?.members.fetch(winninguser.id).catch((err) => console.log(err))
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasAffiliateAccess(server)) return await interaction.editReply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        if (!format) return await interaction.editReply({ content: `Try using /loss in channels like: <#414575168174948372> or <#629464112749084673>.`})
        if (winninguser.id === interaction.user.id) return await interaction.editReply({ content: `You cannot lose a match to yourself.`})
        
        if (await isNewUser(winninguser.id)) await createPlayer(winningMember)
        const winningPlayer = await Player.findOne({ where: { discordId: winninguser.id } })
        const serverId = server.internalLadder ? server.id : '414551319031054346'
        
        const wCount = await Stats.count({ where: { playerId: winningPlayer.id, format: format.name, serverId: serverId } })
        if (!wCount) await Stats.create({ playerId: winningPlayer.id, format: format.name, serverId: serverId, internal: server.internalLadder })
        const winnerStats = await Stats.findOne({ where: { playerId: winningPlayer.id, format: format.name, serverId: serverId } })
        const losingPlayer = await Player.findOne({ where: { discordId: interaction.user.id } })
        const lCount = await Stats.count({ where: { playerId: losingPlayer.id, format: format.name, serverId: serverId } })
        if (!lCount) await Stats.create({ playerId: losingPlayer.id, format: format.name, serverId: serverId, internal: server.internalLadder })
        const loserStats = await Stats.findOne({ where: { playerId: losingPlayer.id, format: format.name, serverId: serverId } })

        if (winninguser.bot) return await interaction.editReply({ content: `Sorry, Bots do not play ${format.name} Format... *yet*.`})
        if (!losingPlayer || !loserStats) return await interaction.editReply({ content: `You are not in the database.`})
        if (!winningPlayer || !winnerStats) return await interaction.editReply({ content: `That user is not in the database.`})

        const activeTournament = await Tournament.count({ where: { state: 'underway', serverId: interaction.guildId, formatName: {[Op.or]: [format.name, 'Multiple']} }}) 
        let isTournament
        let winningEntry
        let losingEntry
        let tournament
        let tournamentId
        let challongeMatch

        const loserHasIronRole = isIronPlayer(member)
        const winnerHasIronRole = isIronPlayer(winningMember)
        const activeIron = await Iron.count({ where: { format: format.name, status: 'active' }})
        let isIronMatch

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
                const tournament = await selectTournament(interaction, tournaments, interaction.member.user.id)
                if (tournament) {
                    isTournament = true
                    tournamentId = tournament.id
                    if (tournament.state === 'pending') return await interaction.editReply({ content: `Sorry, ${tournament.name} has not started yet.`})
                    if (tournament.state !== 'underway') return await interaction.editReply({ content: `Sorry, ${tournament.name} is not underway.`})
                    challongeMatch = tournament.isTeamTournament ? await processTeamResult(server, interaction, winningPlayer, losingPlayer, tournament, format) :
                        await processMatchResult(server, interaction, winninguser, winningPlayer, interaction.member.user, losingPlayer, tournament, format)
                    if (!challongeMatch) return
                } else {
                    return
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
                return await interaction.editReply({ content: `Sorry, ${winningPlayer.globalName || winningPlayer.discordName} is not your ${format.name} Iron opponent. ${server.emoji || format.emoji} ${emojis.iron}`})
            }
        }

        let match
        if (!isTournament || !tournament?.isUnranked) {
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
            if (challongeMatch && tournament?.pointsEligible) winnerStats.tournamentPoints += challongeMatch.round + 1
            if (winnerStats.streak >= winnerStats.bestStreak) winnerStats.bestStreak++
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
    
            match = await Match.create({
                winner: winningPlayer.globalName || winningPlayer.discordName,
                winnerId: winningPlayer.id,
                loser: losingPlayer.globalName || losingPlayer.discordName,
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
        }
            

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
                const winningDeckFile = winnerIsPlayerA ? pairing.deckFileA : pairing.deckFileB
                const losingDeckFile = winnerIsPlayerA ? pairing.deckFileB : pairing.deckFileA
                const winningDeckType = await getDeckType(winningDeckFile, format.name)
                const losingDeckType = await getDeckType(losingDeckFile, format.name)

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
            },
            include: [Player, Format]
        }) || []

        for (let d = 0; d < poolsToUpdate.length; d++) {
            const rPTU = poolsToUpdate[d]
            await rPTU.update({ status: 'pending' })
            lookForPotentialPairs(client, interaction, rPTU, rPTU.player, rPTU.format)
        }

        return await interaction.editReply({ content: `${losingPlayer.globalName || losingPlayer.discordName}${tournament?.pointsEligible && challongeMatch?.round === 1 ? ` (+1 TP)` : ''}, your ${server.internalLadder ? 'Internal ' : ''}${format.name} Format ${server.emoji || format.emoji} ${isTournament ? 'Tournament ' : isIronMatch ? `Iron ${emojis.iron}` : ''}loss to <@${winningPlayer.discordId}>${tournament?.pointsEligible ? ` (+${challongeMatch.round + 1} TP)` : ''} has been recorded.`})
    }
}

