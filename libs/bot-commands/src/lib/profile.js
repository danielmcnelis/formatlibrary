
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'    
import { getMedal, ordinalize } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Deck, Event, Format, Player, Server, Stats } from '@fl/models'
import { Op } from 'sequelize'

export default {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription(`Post a player's profile. 🖼️`)
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to check.')
                .setRequired(false)
        )
        .setDMPermission(false),
    async execute(interaction) {
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        const user = interaction.options.getUser('player') || interaction.user
        const discordId = user.id	
        const player = await Player.findOne({ where: { discordId: discordId } })
        if (!player) return await interaction.reply({ content: "That user is not in the database."})

        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        
        if (format) {
            const stats = await stats?.findOne({ 
                where: { 
                    playerId: player.id, 
                    format: {[Op.iLike]: format.name}, 
                    [Op.or]: [
                        { wins: { [Op.not]: null } }, 
                        { losses: { [Op.not]: null } }, 
                    ],
                    internal: false
                }
            })

            const trophies = [...await Deck.findAll({
                where: {
                    playerId: player.id,
                    formatId: format.id,
                    eventName: {[Op.not]: null},
                    placement: {[Op.not]: null},
                    display: true
                },
                include: Event,
                limit: 12,
                order: [["placement", "ASC"], [Event, 'size', 'DESC']]
            })].map((d) => {
                const badge = d.placement === 1 ? emojis.first :
                    d.placement === 2 ? emojis.second :
                    d.placement === 3 ? emojis.third :
                    emojis.placing

                return `${d.event.name}: ${ordinalize(d.placement)} ${badge} of ${d.event.size}`
            }) || []
            
        const embed = new EmbedBuilder()
            .setColor('#38C368')
            .setTitle(`${user.username}'s ${format.name} ${format.emoji} Player Profile`)
            .setThumbnail(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`)
            .addFields(
                { 
                    name: `${format.name} Format Stats`,
                    value: 
                    `Best Medal: ${getMedal(stats ? stats?.bestElo : null, true)}` +
                    `\nHighest Elo: ${stats && stats?.bestElo ? stats?.bestElo.toFixed(2) : '500.00'}` +
                    `${stats?.tournamentPoints ? `\nTournament Points: ${stats?.tournamentPoints}` : ''}` +
                    `\nWinrate: ${stats && (stats?.wins || stats?.losses) ? `${(100 * stats?.wins / (stats?.wins + stats?.losses)).toFixed(2)}%` : 'N/A'}` +
                    `\nVanquished Foes: ${stats ? stats?.vanquished : 0}` +
                    `\nLongest Win Streak: ${stats ? stats?.bestStreak : 0}`
                },
                { 
                    name: `${format.name} Format Trophies`, 
                    value: trophies.length ? trophies.join('\n') : 'N/A'
                },
                { 
                    name: `Misc. Info`,
                    value: player.duelingBook || player.opTcgSim || player.youtube || player.twitch || player.twitter || player.country || player.timeZone ? (
                        `${player.duelingBook ? `DuelingBook: ${player.duelingBook}` : ''}` +
                        `${player.opTcgSim ? `\nOnePieceTCGSim: ${player.opTcgSim}` : ''}` +
                        `${player.youtube ? `\nYouTube: ${player.youtube}` : ''}` +
                        `${player.twitch ? `\nTwitch: ${player.twitch}` : ''}` +
                        `${player.twitter ? `\nTwitter: ${player.twitter}` : ''}` +
                        `${player.country ? `\nCountry: ${player.country}` : ''}` +
                        `${player.timeZone ? `\nTime Zone: ${player.timeZone}` : ''}`
                    ) : 'N/A'
                },
                { name: `Profile Link`, value: `https://formatlibrary.com/players/${user.username.replaceAll(' ', '_')}${user.discriminator 
!== '0' ? `?discriminator=${user.discriminator}` : ''}` }
            )

            return await interaction.reply({ embeds: [embed] })
        } else {
            const allStats = await Stats.findAll({ 
                where: { 
                    playerId: player.id, 
                    [Op.or]: [
                        { wins: { [Op.not]: null } }, 
                        { losses: { [Op.not]: null } }, 
                    ],
                    internal: false
                },
                limit: 5,
                order: [["elo", "DESC"]]
            })
            
            const medals = []
            
            for (let i = 0; i < allStats.length; i++) {
                const stats = allStats[i]
                const format = await Format.findOne({ where: { id: stats?.formatId }})
                if (!format) continue
                const medal = getMedal(stats?.elo, true)
                medals.push(`${format.emoji} ${format.name}: ${medal}`)
            }

            const trophies = [...await Deck.findAll({
                where: {
                    playerId: player.id,
                    eventName: {[Op.not]: null},
                    eventId: {[Op.not]: null},
                    placement: {[Op.not]: null},
                    display: true
                },
                include: [Event, Format],
                limit: 12,
                order: [["placement", "ASC"], [Event, 'size', 'DESC']]
            })].map((d) => {
                const badge = d.placement === 1 ? emojis.first :
                    d.placement === 2 ? emojis.second :
                    d.placement === 3 ? emojis.third :
                    emojis.placing

                return `${d.format.emoji} ${d.eventName}: ${ordinalize(d.placement)} ${badge} of ${d.event.size}`
            })

        const embed = new EmbedBuilder()
            .setColor('#38C368')
            .setTitle(`${user.username}'s Format Library ${emojis.FL} Player Profile`)
            .setThumbnail(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`)
            .addFields(
                { name: `Best Formats`, value: medals.length ? medals.join('\n') : 'N/A' },
                { name: `Best Finishes`, value: trophies.length ? trophies.join('\n') : 'N/A' },
                { 
                    name: `Misc. Info`,
                    value: player.duelingBook || player.opTcgSim || player.youtube || player.twitch || player.twitter || player.country || player.timeZone ? (
                        `${player.duelingBook ? `DuelingBook: ${player.duelingBook}` : ''}` +
                        `${player.opTcgSim ? `OnePieceTCGSim: ${player.opTcgSim}` : ''}` +
                        `${player.youtube ? `\nYouTube: ${player.youtube}` : ''}` +
                        `${player.twitch ? `\nTwitch: ${player.twitch}` : ''}` +
                        `${player.twitter ? `\nTwitter: ${player.twitter}` : ''}` +
                        `${player.country ? `\nCountry: ${player.country}` : ''}` +
                        `${player.timeZone ? `\nTime Zone: ${player.timeZone}` : ''}`
                    ) : 'N/A'
                },
                { name: `Profile Link`, value: `https://formatlibrary.com/players/${user.username.replaceAll(' ', '_')}${user.discriminator 
!== '0' ? `?discriminator=${user.discriminator}` : ''}` }
            )
            
            return await interaction.reply({ embeds: [embed] })
        }
    }
}

