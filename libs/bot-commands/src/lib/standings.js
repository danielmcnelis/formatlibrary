
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server, Tournament } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { hasPartnerAccess } from '@fl/bot-functions'
import { calculateStandings, getMatches, getParticipants, selectTournament } from '@fl/bot-functions'

export default {
    data: new SlashCommandBuilder()
        .setName('standings')
        .setDescription('Post Swiss tournament standings. ⏰')
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const tournaments = [...await Tournament.findByState('underway', format, interaction.guildId, 'ASC')].filter((t) => t.type === 'swiss')
        if (!tournaments.length && format) return await interaction.editReply({ content: `There are no active ${format.name} ${format.emoji} Swiss tournaments.`})
        if (!tournaments.length && !format) return await interaction.editReply({ content: `There are no active Swiss tournaments.`})
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        await interaction.editReply(`Calculating standings, please wait.`)
        const matches = await getMatches(server, tournament.id)
        const participants = await getParticipants(server, tournament.id)
        const standings = await calculateStandings(tournament, matches, participants)
        const abbreviateTieBreakers = (tb) => {
            if (tb === 'median buchholz') {
                return 'MB'
            } else if (tb === 'match wins vs tied') {
                return 'WvT'
            } else if (tb === 'points difference') {
                return 'PD'
            } else if (tb === 'opponents win percentage') {
                return 'OWP'
            } else if (tb === 'opponents opponents win percentage') {
                return 'OOWP'
            } else {
                return ''
            }
        }

        const camelizeTieBreaker = (str) => {
            return str === 'median buchholz' ? 'medianBuchholz' :
                str === 'match wins vs tied' ? 'winsVsTied' :
                str === 'points difference' ? 'pointsDifference' :
                str === 'opponents win percentage' ? 'opponentsWinPercentage' :
                str === 'opponents opponents win percentage' ? 'opponentsOpponentWinPercentage' :
                ''
        }
        
        const tb1 = tournament.tieBreaker1 
        const tb2 = tournament.tieBreaker2
        const tb3 = tournament.tieBreaker3

        const results = [ `${tournament.logo} - ${tournament.name} Standings - ${tournament.emoji}` , `__Rk.  Name  -  Score  (W-L-T)  [${abbreviateTieBreakers(tb1)} / ${abbreviateTieBreakers(tb2)}${tb3 ? '/ ' + abbreviateTieBreakers(tb3) : ''}]__`]

        for (let index = 0; index < standings.length; index++) {
            const s = standings[index]
            const getAndStylizeTBVal = (obj, tb) => {
                return tb === 'median buchholz' ? obj[camelizeTieBreaker(tb)].toFixed(1) :
                    tb === 'match wins vs tied' || tb === 'points difference' ?  obj[camelizeTieBreaker(tb)] : 
                    tb === 'opponents win percentage' || tb === 'opponents opponents win percentage' ? obj[camelizeTieBreaker(tb)].toFixed(3) :
                    obj[camelizeTieBreaker(tb)]
            }
            
            results.push(`${s.rank}.  ${s.name}  -  ${s.score.toFixed(1)}  (${s.wins}-${s.losses}-${s.ties})${s.byes ? ` +BYE` : ''}  [${getAndStylizeTBVal(s, tb1)} / ${getAndStylizeTBVal(s, tb2)}${tb3 ? '/ ' + getAndStylizeTBVal(s, tb3) : ''}]`)
        }

        const channel = interaction.guild?.channels?.cache?.get(server.botSpamChannelId) || interaction.channel
        if (interaction.channel !== channel.id && server.botSpamChannelId === channel.id) await interaction.channel.send(`Please visit <#${channel.id}> to view the ${tournament.name} standings. ${tournament.logo}`)
        
        for (let i = 0; i < results.length; i += 30) {
            channel.send(results.slice(i, i + 30).join('\n'))
        }

        return
    }
}