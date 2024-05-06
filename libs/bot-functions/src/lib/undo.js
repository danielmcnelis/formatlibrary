
import { Format, Match, Player, Stats } from '@fl/models'
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
    
        if (!winnerStats.backupElo) {
            if (authorIsMod) {
                interaction.channel.send({ content: `${winningPlayer.globalName || winningPlayer.discordName} has no backup stats: Remember to **/recalculate** when finished.`})
            } else {
                return await interaction.editReply({ content: `Your last opponent, ${winningPlayer.globalName || winningPlayer.discordName}, has no backup stats. Please get a Moderator to help you.`})
            }
        }

        if (!loserStats.backupElo) {
            if (authorIsMod) {
                interaction.channel.send({ content: `${losingPlayer.globalName || losingPlayer.discordName} has no backup stats: Remember to **/recalculate** when finished.`})
            } else {
                return await interaction.editReply({ content: `Your last opponent, ${losingPlayer.globalName || losingPlayer.discordName}, has no backup stats. Please get a Moderator to help you.`})
            }
        }

        if (match.isTournament && match.tournamentId && match.challongeMatchId) {
            try {
                await axios({
                    method: 'post',
                    url: `https://api.challonge.com/v1/tournaments/${match.tournamentId}/matches/${match.challongeMatchId}/reopen.json?api_key=${server.challongeAPIKey}`
                })
            } catch (err) {
                console.log(err)
            }
        }

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
        return interaction.channel.send({ content: `The last ${server.internalLadder ? 'Internal ' : ''}${match.formatName} Format ${server.emoji || match.format?.emoji || ''} ${match.isTournament ? 'Tournament ' : ''}match in which ${winningPlayer.globalName || winningPlayer.discordName} defeated ${losingPlayer.globalName || losingPlayer.discordName} has been erased.`})	
    } catch (err) {
        console.log(err)
    }
} 
