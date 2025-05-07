
import { Format, Match, Pairing, Player, Stats } from '@fl/models'
import axios from 'axios'

// UNDO MATCH
export const undoMatch = async (interaction, server, matchId, authorIsMod) => {
    try {
        const match = await Match.findOne({ where: { id: matchId }, include: Format})
        const winningPlayer = await Player.findOne({ where: { id: match.winnerId } })
        const losingPlayer = await Player.findOne({ where: { id: match.loserId } })
        const winnerStats = await Stats.findOne({ where: { playerId: winningPlayer.id, formatId: match.formatId, serverId: match.serverId } })
        const loserStats = await Stats.findOne({ where: { playerId: losingPlayer.id, formatId: match.formatId, serverId: match.serverId } })
    
        if (!authorIsMod && interaction.user.id !== losingPlayer.discordId) return await interaction.editReply({ content: `You did not report in the last recorded match. Please get a Moderator to help you.`})
    
        if (match.isTournament && match.tournamentId && match.challongeMatchId) {
            try {
                await axios({
                    method: 'post',
                    url: `https://api.challonge.com/v1/tournaments/${match.tournamentId}/matches/${match.challongeMatchId}/reopen.json?api_key=${server.challongeApiKey}`
                })
            } catch (err) {
                console.log(err)
            }
        }
        
        if (!winnerStats.backupElo) {
            if (authorIsMod) {
                interaction.channel.send({ content: `${winningPlayer.name} has no backup stats. They will be recalculated during the nightly maintenance period.`})
            } else {
                return await interaction.editReply({ content: `Your last opponent, ${winningPlayer.name}, has no backup stats. Please get a Moderator to help you.`})
            }
        }

        if (!loserStats.backupElo) {
            if (authorIsMod) {
                interaction.channel.send({ content: `${losingPlayer.name} has no backup stats. They will be recalculated during the nightly maintenance period.`})
            } else {
                return await interaction.editReply({ content: `Your last opponent, ${losingPlayer.name}, has no backup stats. Please get a Moderator to help you.`})
            }
        }

        winnerStats.elo = winnerStats.backupElo
        winnerStats.backupElo = null
        winnerStats.classicElo = winnerStats.backupClassicElo
        winnerStats.backupClassicElo = null
        winnerStats.wins--
        winnerStats.games--

        if (match.isSeasonal && match.format.seasonResetDate < match.createdAt) {
            winnerStats.seasonalWins--
            winnerStats.seasonalGames--
            winnerStats.seasonalElo = winnerStats.backupSeasonalElo
            winnerStats.backupSeasonalElo = null
        }

        await winnerStats.save()
    
        loserStats.elo = loserStats.backupElo
        loserStats.backupElo = null
        loserStats.classicElo = loserStats.backupClassicElo
        loserStats.backupClassicElo = null
        loserStats.losses--
        loserStats.games--

        if (match.isSeasonal && match.format.seasonResetDate < match.createdAt) {
            loserStats.seasonalLosses--
            loserStats.seasonalGames--
            loserStats.seasonalElo = loserStats.backupSeasonalElo
            loserStats.backupSeasonalElo = null
        }

        await loserStats.save()
    
        await match.destroy()
        return interaction.channel.send({ content: `The last ${server.hasInternalLadder ? 'Internal ' : ''}${match.formatName} Format ${match.format?.emoji || ''} ${match.isTournament ? 'Tournament ' : ''}match in which ${winningPlayer.name} defeated ${losingPlayer.name} has been erased.`})	
    } catch (err) {
        console.log(err)
    }
}

// CANCEL PAIRING
export const cancelPairing = async (interaction, pairingId) => {
    try {
        const pairing = await Pairing.findOne({ where: { id: pairingId }, include: Format })
        const formatName = pairing.formatName
        const playerAName = pairing.playerAName
        const playerBName = pairing.playerBName
        await pairing.destroy()
        return interaction.editReply({ content: `The last ${formatName} Format ${pairing.format?.emoji || ''} pairing in which ${playerAName} was paired with ${playerBName} has been canceled.`})	
    } catch (err) {
        console.log(err)
    }
} 
