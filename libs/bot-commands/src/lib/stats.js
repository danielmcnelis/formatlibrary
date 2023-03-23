
import { SlashCommandBuilder } from 'discord.js'    
import { hasAffiliateAccess, getMedal } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Format, Player, Server, Stats, TriviaKnowledge } from '@fl/models'
import { Op } from 'sequelize'

export default {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription(`Post a player's stats. 🏅`)
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to check.')
                .setRequired(false)
        ),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasAffiliateAccess(server)) return await interaction.reply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

        if (!format) return await interaction.reply({ content: `Try using **/stats** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const user = interaction.options.getUser('player') || interaction.user
        const discordId = user.id	
        const player = await Player.findOne({ where: { discordId: discordId } })
        if (!player) return await interaction.reply({ content: "That user is not in the database."})
        const serverId = server.internalLadder ? server.id : '414551319031054346'

		// const transformed_knowledges = []

		// const allKnowledges = await Knowledge.findAll()

		// const playerIds = []
		// for (let i = 0; i < allKnowledges.length; i++) {
		// 	const knowledge = allKnowledges[i]
		// 	const playerId = knowledge.playerId
		// 	if (!playerIds.includes(playerId)) playerIds.push(playerId)
		// }

		// for (let i = 0; i < playerIds.length; i++) {
		// 	const playerId = playerIds[i]
		// 	const correct_answers = await Knowledge.count({ where: { playerId: playerId }})
		// 	transformed_knowledges.push([playerId, correct_answers])
		// }

		// transformed_knowledges.sort((a, b) => b[1] - a[1])
		// const index = transformed_knowledges.length ? transformed_knowledges.findIndex((k) => k[0] === playerId) : null
		// const rank = index !== null ? `#${index + 1} out of ${transformed_knowledges.length}` : `N/A`
		// const smarts = transformed_knowledges[index][1]
		
		// return message.channel.send({ content: 
		// 	`${no} --- Trivia Stats --- ${yes}`
		// 	+ `\nName: ${player.name}`
		// 	+ `\nRanking: ${rank}`
		// 	+ `\nCorrectly Answered: ${smarts} ${stoned}`
		// })

        const stats = interaction.channel?.name === 'trivia' ? await TriviaKnowledge.count({ 
            where: { 
                playerId: player.id
            } 
        }) : await Stats.findOne({ 
            where: { 
                playerId: player.id, 
                format: {[Op.iLike]: format.name}, 
                [Op.or]: [
                    { wins: { [Op.not]: null } }, 
                    { losses: { [Op.not]: null } }, 
                ],
                serverId: serverId
            } 
        })

        const allStats = interaction.channel?.name === 'trivia' ? await TriviaKnowledge.findAll() : 
            await Stats.findAll({ 
                where: {
                    format: { [Op.iLike]: format.name }, 
                    games: { [Op.gte]: 3 },
                    serverId: serverId,
                    inactive: false,
                    '$player.hidden$': false
                },
                include: [Player],
                order: [['elo', 'DESC']] 
            })

        // const triviaRankings = 

        const index = allStats.length ? allStats.findIndex((s) => s.playerId === player.id) : null
        const rank = stats && index >= 0 ? `#${index + 1} out of ${allStats.length}` : `N/A`
        const elo = stats ? stats.elo.toFixed(2) : `500.00`
        const medal = getMedal(elo, true)
        const wins = stats ? stats.wins : 0
        const losses = stats ? stats.losses : 0
        const winrate = wins || losses ? `${(100 * wins / (wins + losses)).toFixed(2)}%` : 'N/A'		

        return await interaction.reply({ content: 
            `${server.emoji || format.emoji} --- ${format.name} Stats --- ${server.emoji || format.emoji}`
            + `${server.internalLadder ? `\nServer: ${server.name}` : ''}`
            + `\nName: ${player.name}`
            + `\nMedal: ${medal}`
            + `\nRanking: ${rank}`
            + `\nElo Rating: ${elo}`
            + `\nWins: ${wins}, Losses: ${losses}`
            + `\nWin Rate: ${winrate}`
        })
    }
}