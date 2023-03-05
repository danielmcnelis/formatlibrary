
import { Format, Match, Player, Stats } from '@fl/models'
import axios from 'axios'

// UNDO MATCH
export const undoMatch = async (server, channel, id) => {
    try {
        const match = await Match.findOne({ where: { id }, include: Format})

        if (match.tournament && match.tournamentId && match.tournamentMatchId) {
            try {
                await axios({
                    method: 'put',
                    url: `https://api.challonge.com/v1/tournaments/${match.tournamentId}/matches/${match.tournamentMatchId}.json?api_key=${server.challongeAPIKey}`,
                    data: {
                        match: {
                            winner_id: null,
                            scores_csv: ["0-0"]
                        }
                    }
                })
            } catch (err) {
                console.log(err)
            }
        }
        
        const winnerId = match.winnerId
        const loserId = match.loserId
        const winningPlayer = await Player.findOne({ where: { id: winnerId } })
        const winnerStats = await Stats.findOne({ where: { playerId: winningPlayer.id, format: match.format, serverId: match.serverId } })
        const losingPlayer = await Player.findOne({ where: { id: loserId } })
        const loserStats = await Stats.findOne({ where: { playerId: losingPlayer.id, format: match.format, serverId: match.serverId } })
    
        if (!winnerStats.backupElo) channel.send({ content: `${winningPlayer.name} has no backup stats: Remember to **/recalculate** when finished.`})
        if (!loserStats.backupElo) channel.send({ content: `${losingPlayer.name} has no backup stats: Remember to **/recalculate** when finished.`})

        winnerStats.elo = winnerStats.backupElo
        winnerStats.backupElo = null
        winnerStats.wins--
        winnerStats.games--
        await winnerStats.save()
    
        loserStats.elo = loserStats.backupElo
        loserStats.backupElo = null
        loserStats.losses--
        loserStats.games--
        await loserStats.save()
    
        await match.destroy()
        return channel.send({ content: `The last ${server.internalLadder ? 'Internal ' : ''}${match.format} Format ${server.emoji || match.format?.emoji || ''} ${match.isTournamentMatch ? 'Tournament ' : ''}match in which ${winningPlayer.name} defeated ${losingPlayer.name} has been erased.`})	
    } catch (err) {
        console.log(err)
    }
} 
