
import { SlashCommandBuilder } from 'discord.js'    
import { isMod, hasAffiliateAccess, selectMatch } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Format, Match, Player, Server, Stats } from '@fl/models'
import { Op } from 'sequelize'
import axios from 'axios'

export default {
    data: new SlashCommandBuilder()
        .setName('undo')
        .setDescription(`Undo a match result. ⏪`),                
    async execute(interaction) {
        await interaction.deferReply()
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
    
        if (!hasAffiliateAccess(server)) return await interaction.editReply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
    
        if (!format) return await interaction.editReply({ content: `Try using **/undo** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        if (!hasAffiliateAccess(server)) return await interaction.editReply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const serverId = server.internalLadder ? server.id : '414551319031054346'
        
        const matches = await Match.findAll({ where: { formatName: format.name, serverId: serverId }, order: [['createdAt', 'DESC']]})
        const authorIsMod = isMod(server, interaction.member)

        const match = authorIsMod ? await selectMatch(interaction, matches.slice(0, 10)) :  matches[0]
        if (!match) return

        if (match.isTournament && match.tournamentId && match.tournamentMatchId) {
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
        const winnerStats = await Stats.findOne({ where: { playerId: winningPlayer.id, format: format.name, serverId: serverId } })
        const losingPlayer = await Player.findOne({ where: { id: loserId } })
        const loserStats = await Stats.findOne({ where: { playerId: losingPlayer.id, format: format.name, serverId: serverId } })

        if (interaction.user.id !== losingPlayer.discordId) return await interaction.editReply({ content: `You did not participate in the last recorded match. Please get a Moderator to help you.`})
        if (!winnerStats.backupElo) return await interaction.editReply({ content: `Your last opponent, ${winningPlayer.name}, has no backup stats. Please get a Moderator to help you.`})
        if (!loserStats.backupElo) return await interaction.editReply({ content: `You have no backup stats. Please get a Moderator to help you.`})

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
        return await interaction.editReply({ content: `The last ${server.internalLadder ? 'Internal ' : ''}${format.name} Format ${server.emoji || format.emoji} ${match.isTournamentMatch ? 'Tournament ' : ''}match in which ${winningPlayer.name} defeated ${losingPlayer.name} has been erased.`})	
    }
}
