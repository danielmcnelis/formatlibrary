
import { SlashCommandBuilder } from 'discord.js'    
import { isMod, hasPartnerAccess } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Format, Match, Player, Server, Stats } from '@fl/models'

// RECALCULATE
// Use this command to recalculate every player's Elo from scratch.
// This is needed after matches are directly added or deleted using postgreSQL.
// It's also required after using the !combine command, but the bot will remind you to do it.
export default {
    data: new SlashCommandBuilder()
        .setName('recalculate')
        .setDescription(`Admin Only - Recalculate player stats. 🧮`)
        .addStringOption(option =>
            option
                .setName('format')
                .setDescription('Format to recalculate.')
                .setRequired(false)
        )
        .setDMPermission(false),
    async execute(interaction) {
        const formatName = interaction.options.getString('format')
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return await interaction.reply({ content: `You do not have permission to do that.`})
        const format = await Format.findByServerOrInputOrChannelId(server, formatName, interaction.channelId)
        if (!format) return await interaction.reply({ content: `Try using **/recalculate** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const serverId = server.internalLadder ? server.id : '414551319031054346'
        const count = await Match.count({ where: { formatName: format.name, serverId: serverId }})
        interaction.reply({ content: `Recalculating data from ${count} ${format.name} ${format.emoji} matches. Please wait...`})
        
        const allMatches = await Match.findAll({ 
            where: { formatId: format.id, serverId: serverId }, 
            attributes: ['id', 'formatId', 'winnerId', 'loserId', 'delta', 'createdAt'], 
            order: [["createdAt", "ASC"]]
        })

        const allStats = await Stats.findAll({ 
            where: { formatId: format.id, serverId: serverId }, 
            attributes: ['id', 'formatName', 'formatId', 'elo', 'bestElo', 'backupElo', 'wins', 'losses', 'games', 'streak', 'bestStreak', 'vanquished', 'playerId', 'serverId'], 
            include: { model: Player, attributes: ['id', 'name']} 
        })

        for (let i = 0; i < allStats.length; i++) {
            const stats = allStats[i]
            await stats.update({
                elo: 500.00,
                bestElo: 500.00,
                backupElo: null,
                wins: 0,
                losses: 0,
                games: 0,
                streak: 0,
                bestStreak: 0,
                vanquished: 0
            })
        }

        for (let i = 0; i < allMatches.length; i++) {
            try {
                const match = allMatches[i]
                const winnerId = match.winnerId
                const loserId = match.loserId
                const winnerStats = allStats.find((s) => s.playerId === winnerId)
                const loserStats = allStats.find((s) => s.playerId === loserId)

                if (!winnerStats) {
                    const stats = await Stats.create({
                        playerId: winnerId,
                        formatName: format.name,
                        formatId: format.id,
                        serverId: '414551319031054346',
                        internal: server.internalLadder
                    })

                    console.log('created new winner stats', winnerId)
                    allStats.push(stats)
                    i--
                    continue
                }
    
                if (!loserStats) {
                    const stats = await Stats.create({
                        playerId: loserId,
                        formatName: format.name,
                        formatId: format.id,
                        serverId: '414551319031054346',
                        internal: server.internalLadder
                    })

                    console.log('created new loser stats:', loserId)
                    allStats.push(stats)
                    i--
                    continue
                }
    
                const origEloWinner = winnerStats.elo || 500.00
                const origEloLoser = loserStats.elo || 500.00
                const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origEloWinner - origEloLoser) / 400))))))
                
                winnerStats.elo = origEloWinner + delta
                if ((origEloWinner + delta) > winnerStats.bestElo) winnerStats.bestElo = origEloWinner + delta
                winnerStats.backupElo = origEloWinner
                winnerStats.wins++
                winnerStats.games++
                winnerStats.streak++
                if (winnerStats.streak >= winnerStats.bestStreak) winnerStats.bestStreak++
                await winnerStats.save()
        
                loserStats.elo = origEloLoser - delta
                loserStats.backupElo = origEloLoser
                loserStats.losses++
                loserStats.games++
                loserStats.streak = 0
                await loserStats.save()
    
                match.delta = delta
                await match.save()
                console.log(`${format.name} Match ${i+1}: ${winnerStats.player.name} > ${loserStats.player.name}`)
            } catch (err) {
                console.log(err)
            }
        }

        for (let i = 0; i < allStats.length; i++) {
            const stats = allStats[i]
            const victories = await Match.findAll({
                where: {
                    winnerId: stats.playerId,
                    formatId: format.id, 
                    serverId: serverId
                }
            })

            const vanquishedIds = []
            victories.forEach((v) => {
                if (!vanquishedIds.includes(v.loserId)) vanquishedIds.push(v.loserId)
            })

            console.log(`${stats.player?.name} (${stats.playerId}) has defeated ${vanquishedIds.length} unique opponents`)
            await stats.update({ vanquished: vanquishedIds.length })
        }

        return await interaction.channel.send({ content: `Recalculation complete!`})	
    }
}

    