
import { SlashCommandBuilder } from 'discord.js'
import { Format, Match, Player, Server } from '@fl/models'
const QuickChart = require('quickchart-js')
import { hasAffiliateAccess } from '@fl/bot-functions'
import { Op } from 'sequelize'
import { emojis } from '@fl/bot-emojis'

export default {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription(`View a player's Elo history chart. 📈`)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Tag the user to check.')
                .setRequired(false)
        ),
    async execute(interaction) {
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasAffiliateAccess(server)) return await interaction.reply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        if (!format) return await interaction.reply({ content: `Try using **/history** in channels like: <#414575168174948372> or <#629464112749084673>.`})  

        let x = 250        
        const user = interaction.options.getUser('player') || interaction.user    
        const discordId = user.id
        const player = await Player.findOne({ where: { discordId: discordId } })
        if (!player) return await interaction.reply({ content: "That user is not in the database."})
        let eloHistory = [500]
        const serverId = server.internalLadder ? server.id : '414551319031054346'

        const matches = await Match.findAll({
            where: {
                formatName: format.name,
                [Op.or]: [
                    { winnerId: player.id }, 
                    { loserId: player.id }
                ],
                serverId: serverId
            },
            order: [['createdAt', 'ASC']]
        })

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i]
            const delta = match.delta
            const sign = match.winnerId === player.id ? 1 : -1
            const prevElo = eloHistory.slice(-1)[0] 
            const nextElo = prevElo + (sign * delta)
            eloHistory.push(nextElo)
        }

        if (eloHistory.length < x) x = eloHistory.length
        const data = eloHistory.slice(-x)
        const suggestedMin = Math.round(Math.min(...data) / 25) * 25 - 25
        const suggestedMax = Math.round(Math.max(...data) / 25) * 25 + 25
        const matchNumbers = Array.from({length: x}, (_, k) => x - k)
        const radius = x <= 10 ? 3 : x <= 50 ? 2 : 1
        const chart = new QuickChart()
        chart.setConfig({
            type: 'line',
            data: {
                labels: matchNumbers,
                datasets: [
                    {
                        label: 'Elo',
                        backgroundColor: 'rgb(10, 54, 138)',
                        borderColor: 'rgb(10, 54, 138)',
                        data: data,
                        pointRadius: radius,
                        fill: false,
                    },
                    {
                        label: '500',
                        backgroundColor: 'rgb(186, 186, 186)',
                        borderColor: 'rgb(186, 186, 186)',
                        data: new Array(x).fill(500),
                        pointRadius: 0,
                        fill: false,
                    },
                ],
            },
            options: {
                title: {
                    display: true,
                    text: `${player.name}'s ${format.name} Elo History - Last ${x} Matches`,
                },
                legend: {
                    display: false
                },
                xAxes: [{
                    display: false,
                    gridLines: {
                        display: true,
                    },
                }],
                scales: {
                    yAxes: [
                        {
                            ticks: {
                                suggestedMin: suggestedMin,
                                suggestedMax: suggestedMax,
                            }
                        }
                    ]
                },
            },
        })

        const url = await chart.getShortUrl()
        interaction.reply({ content: `${url}` })
    } 
}
