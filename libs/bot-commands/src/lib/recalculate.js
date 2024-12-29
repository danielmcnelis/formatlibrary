
import { SlashCommandBuilder } from 'discord.js'    
import { isModerator, hasPartnerAccess, getNextDateAtMidnight, applyDecay } from '@fl/bot-functions'
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
        try {
            const formatName = interaction.options.getString('format')
            const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
            if (!hasPartnerAccess(server)) return await interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
            if (!isModerator(server, interaction.member)) return await interaction.reply({ content: `You do not have permission to do that.`})
            const format = await Format.findByServerOrInputOrChannelId(server, formatName, interaction.channelId)
            if (!format) return await interaction.reply({ content: `Try using **/recalculate** in channels like: <#414575168174948372> or <#629464112749084673>.`})
            const serverId = server.hasInternalLadder ? server.id : '414551319031054346'
            const count = await Match.count({ where: { formatName: format.name, serverId: serverId }})
            interaction.reply({ content: `Recalculating data from ${count} ${format.name} ${format.emoji} matches. Please wait...`})
            
            const allMatches = await Match.findAll({ 
                where: { formatId: format.id, serverId: '414551319031054346' }, 
                attributes: ['id', 'formatId', 'winnerId', 'loserId', 'winnerDelta', 'loserDelta', 'createdAt'], 
                order: [["createdAt", "ASC"]]
            })
            
            let currentDate = allMatches[0].createdAt
            let nextDate = getNextDateAtMidnight(currentDate)
            
            const allStats = await Stats.findAll({ 
                where: { formatId: format.id, serverId: '414551319031054346' }, 
                attributes: [
                    'id', 'formatName', 'formatId', 'elo', 'bestElo', 'backupElo', 
                    'seasonalElo', 'noDecayElo', 'classicElo', 'wins', 'losses', 'games', 
                    'currentStreak', 'bestStreak', 'vanquished', 'playerId', 'serverId'
                ], 
                include: { model: Player, attributes: ['id', 'name']} 
            })

            for (let j = 0; j < allStats.length; j++) {
                const stats = allStats[j]
                await stats.update({
                    elo: 500.00,
                    classicElo: 500.00,
                    noDecayElo: 500.00,
                    seasonalElo: 500.00,
                    bestElo: 500.00,
                    backupElo: null,
                    wins: 0,
                    losses: 0,
                    games: 0,
                    currentStreak: 0,
                    bestStreak: 0,
                    vanquished: 0
                })
            }

            for (let j = 0; j < allMatches.length; j++) {
                try {
                    const match = allMatches[j]
                    if (match.createdAt > nextDate) {
                        await applyDecay(format, currentDate, match.createdAt)
                        currentDate = match.createdAt
                        nextDate = getNextDateAtMidnight(currentDate)
                    }

                    const winnerId = match.winnerId
                    const loserId = match.loserId
                    const winnerStats = allStats.find((s) => s.playerId === winnerId)
                    const loserStats = allStats.find((s) => s.playerId === loserId)

                    if (!winnerStats) {
                        const stats = await Stats.create({
                            playerName: match.winnerName,
                            playerId: winnerId,
                            formatName: format.name,
                            formatId: format.id,
                            serverId: '414551319031054346',
                            isInternal: false
                        })

                        console.log('created new winner stats', winnerId)
                        allStats.push(stats)
                        j--
                        continue
                    }
        
                    if (!loserStats) {
                        const stats = await Stats.create({
                            playerName: match.loserName,
                            playerId: loserId,
                            formatName: format.name,
                            formatId: format.id,
                            serverId: '414551319031054346',
                            isInternal: false
                        })

                        console.log('created new loser stats:', loserId)
                        allStats.push(stats)
                        j--
                        continue
                    }
        
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
                    if ((origEloWinner + winnerDelta) > winnerStats.bestElo) winnerStats.bestElo = origEloWinner + winnerDelta
                    winnerStats.backupElo = origEloWinner
                    winnerStats.classicElo = origClassicEloWinner + classicDelta
                    winnerStats.wins++
                    winnerStats.games++
                    winnerStats.currentStreak++
                    if (winnerStats.currentStreak >= winnerStats.bestStreak) winnerStats.bestStreak++
                    await winnerStats.save()
            
                    loserStats.elo = origEloLoser - loserDelta
                    loserStats.backupElo = origEloLoser
                    loserStats.classicElo = origClassicEloLoser - classicDelta
                    loserStats.losses++
                    loserStats.games++
                    loserStats.currentStreak = 0
                    await loserStats.save()
        
                    match.winnerDelta = winnerDelta
                    match.loserDelta = loserDelta
                    await match.save()
                    console.log(`${format.name} Match ${j+1}: ${winnerStats.player.name} > ${loserStats.player.name}`)
                } catch (err) {
                    console.log(err)
                }
            }

            for (let j = 0; j < allStats.length; j++) {
                const stats = allStats[j]
                const victories = await Match.findAll({
                    where: {
                        winnerId: stats.playerId,
                        formatId: format.id, 
                        serverId: '414551319031054346'
                    }
                })

                const vanquishedIds = []
                victories.forEach((v) => {
                    if (!vanquishedIds.includes(v.loserId)) vanquishedIds.push(v.loserId)
                })

                console.log(`${stats.player?.name} (${stats.playerId}) has defeated ${vanquishedIds.length} unique opponents`)
                await stats.update({ vanquished: vanquishedIds.length })
            }

            console.log(`Recalculation for ${format.name} Format is complete!`)
            return await interaction.channel.send({ content: `Recalculation complete!`})	
        } catch (err) {
            console.log(err)
        }
    }
}

    