
import { SlashCommandBuilder } from 'discord.js'    
import { createPlayer, getDeckType, isModerator, isNewUser, hasPartnerAccess, lookForPotentialPairs, checkPairing, getMatches, processMatchResult, processTeamResult, selectTournament } from '@fl/bot-functions'
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
        const wCount = await Stats.count({ where: { playerId: winningPlayer.id, formatId: format.id, serverId: serverId } })
        if (!wCount) await Stats.create({ playerName: winningPlayer.name, playerId: winningPlayer.id, formatName: format.name, formatId: format.id, serverId: serverId, isInternal: server.hasInternalLadder })
        const winnerStats = await Stats.findOne({ where: { playerId: winningPlayer.id, formatId: format.id, serverId: serverId } })
        const losingPlayer = await Player.findOne({ where: { discordId: loserDiscordId } })
        const lCount = await Stats.count({ where: { playerId: losingPlayer.id, formatId: format.id, serverId: serverId } })
        if (!lCount) await Stats.create({ playerName: losingPlayer.name, playerId: losingPlayer.id, formatName: format.name, formatId: format.id, serverId: serverId, isInternal: server.hasInternalLadder })
        const loserStats = await Stats.findOne({ where: { playerId: losingPlayer.id, formatId: format.id, serverId: serverId } })

        if (!losingPlayer || !loserStats) return await interaction.editReply({ content: `Sorry, <@${loserDiscordId}> is not in the database.`})
        if (!losingPlayer) return await interaction.reply(`Sorry, <@${loserDiscordId}> is not allowed to play in the Format Library rated system.`)
        
        if (!winningPlayer || !winnerStats) return await interaction.editReply({ content: `Sorry, <@${winnerDiscordId}> is not in the database.`})
        if (!winningPlayer) return await interaction.reply(`Sorry, <@${winnerDiscordId}> is not allowed to play in the Format Library rated system.`)

        const activeTournament = await Tournament.count({ where: { state: 'underway', serverId: interaction.guildId, formatName: {[Op.or]: [format.name, 'Multiple']} }}) 
        let isTournament
        let winningEntry
        let losingEntry
        let tournament
        let tournamentId
        let challongeMatch

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
                    tournamentId = tournament.id
                    challongeMatch = tournament.isTeamTournament ? await processTeamResult(server, interaction, winningPlayer, losingPlayer, tournament, format) :
                        await processMatchResult(server, interaction, winner, winningPlayer, loser, losingPlayer, tournament, format)
                    if (!challongeMatch) return
                } else {
                    return
                }
            }
        }

        
        let match
        if (!isTournament || tournament?.isRanked) {
            const origEloWinner = winnerStats.elo || 500.00
            const origEloLoser = loserStats.elo || 500.00

            const winnerKFactor = winnerStats.games < 20 && winnerStats.bestElo < 560 ? 25 :
                winnerStats.bestElo < 560 ? 16 : 10

            const loserKFactor = loserStats.games < 20 && loserStats.bestElo < 560 ? 25 :
                loserStats.bestElo < 560 ? 16 : 10

            const winnerDelta = winnerKFactor * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origEloWinner - origEloLoser) / 400))))))
            const loserDelta = loserKFactor * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origEloWinner - origEloLoser) / 400))))))
            
            const origClassicEloWinner = winnerStats.classicElo || 500.00
            const origClassicEloLoser = loserStats.classicElo || 500.00
            const classicDelta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origClassicEloWinner - origClassicEloLoser) / 400))))))

            winnerStats.elo = origEloWinner + winnerDelta
            if (origEloWinner + winnerDelta > winnerStats.bestElo) winnerStats.bestElo = origEloWinner + winnerDelta
            winnerStats.backupElo = origEloWinner
            winnerStats.classicElo = origClassicEloWinner + classicDelta
            winnerStats.wins++
            winnerStats.games++
            winnerStats.isActive = true
            winnerStats.currentStreak++
            if (winnerStats.currentStreak >= winnerStats.bestStreak) winnerStats.bestStreak++
            if (!await Match.checkIfVanquished(format.id, winningPlayer.id, losingPlayer.id)) winnerStats.vanquished++
            await winnerStats.save()
    
            loserStats.elo = origEloLoser - loserDelta
            loserStats.backupElo = origEloLoser
            loserStats.classicElo = origClassicEloLoser - classicDelta
            loserStats.losses++
            loserStats.games++
            loserStats.isActive = true
            loserStats.currentStreak = 0
            await loserStats.save()
    
            match = await Match.create({
                winnerName: winningPlayer.name,
                winnerId: winningPlayer.id,
                loserName: losingPlayer.name,
                loserId: losingPlayer.id,
                isTournament: isTournament,
                tournamentId: tournamentId,
                challongeMatchId: challongeMatch?.id,
                round: challongeMatch?.round,
                formatName: format.name,
                formatId: format.id,
                winnerDelta: winnerDelta,
                loserDelta: loserDelta,
                serverId: serverId,
                isInternal: server.hasInternalLadder
            })
        }
        

        if (!isTournament) {
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

        return await interaction.editReply({ content: `A manual ${server.hasInternalLadder ? 'Internal ' : ''}${format.name} Format ${format.emoji} ${isTournament ? 'Tournament ' : ''}loss by <@${losingPlayer.discordId}>${tournament?.pointsEligible && challongeMatch?.round ? ` (+1 TP)` : ''} to <@${winningPlayer.discordId}>${tournament?.pointsEligible ? ` (+${challongeMatch.round + 1} TP)` : ''} has been recorded.`})		
    }
}