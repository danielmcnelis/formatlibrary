
import { SlashCommandBuilder } from 'discord.js'
import { Format, Server, Tournament } from '@fl/models'
import { emojis } from '@fl/bot-emojis'
import { hasPartnerAccess } from '@fl/bot-functions'
import { calculateStandings, getMatches, getParticipants, selectTournament } from '@fl/bot-functions'

export default {
    data: new SlashCommandBuilder()
        .setName('standings')
        .setDescription('Post Swiss tournament standings. ⏰'),
    async execute(interaction) {
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const tournaments = [...await Tournament.findByStateAndFormatAndServerId('underway', format, interaction.guildId)].filter((t) => t.type === 'swiss')
        if (!tournaments.length && format) return await interaction.editReply({ content: `There are no active ${format.name} ${server.emoji || format.emoji} Swiss tournaments.`})
        if (!tournaments.length && !format) return await interaction.editReply({ content: `There are no active Swiss tournaments.`})
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        interaction.editReply(`Calculating standings, please wait.`)
        const matches = await getMatches(server, tournament.id)
        const participants = await getParticipants(server, tournament.id)
        const standings = await calculateStandings(matches, participants)
        console.log('standings', standings)
        const results = [ `${tournament.logo} - ${tournament.name} Standings - ${tournament.emoji}` , `__Rk.  Name  -  Score  (W-L-T)  [Med-Buch / WvT]__`]

        for (let index = 0; index < standings.length; index++) {
            const s = standings[index]
            if (!s) continue
            if (
                (
                    // if at the end or has a better score/tie-breakers than the next player
                    index + 1 === standings.length || (
                        s.score > standings[index + 1].score || 
                        s.score === standings[index + 1].score && s.medianBuchholz > standings[index + 1].medianBuchholz || 
                        s.score === standings[index + 1].score && s.medianBuchholz === standings[index + 1].medianBuchholz && s.winsVsTied > standings[index + 1].winsVsTied
                    )
                ) && (
                    // and at the beginning or not tied with the previous player
                    index === 0 || (
                        s.score !== standings[index - 1].score ||
                        s.medianBuchholz !== standings[index - 1].medianBuchholz || 
                        s.winsVsTied !== standings[index - 1].winsVsTied
                    )
                )
            ) {
                // then assign a unique ranking for this index position
                if (index >= participants.length / 2 || s.losses > 2) break
                s.rank = `${index + 1}`
            } else if (index === 0) {
                // else if at the beginning then assign T1 ranking
                s.rank = 'T1'
            } else if (
                // else if tied with previous player
                s.score === standings[index - 1].score && 
                s.medianBuchholz === standings[index - 1].medianBuchholz && 
                s.winsVsTied === standings[index - 1].winsVsTied
            ) {
                // then assign the same ranking as the previous player
                s.rank = standings[index - 1].rank
            } else {
                // assign a new tied ranking for this index position
                if (index >= participants.length / 2 || s.losses > 2) break
                s.rank = `T${index + 1}`
            }

            results.push(`${s.rank}.  ${s.name}  -  ${s.score.toFixed(1)}  (${s.wins}-${s.losses}-${s.ties})${s.byes ? ` +BYE` : ''}  [${s.medianBuchholz.toFixed(1)} / ${s.winsVsTied}]`)
        }

        for (let i = 0; i < results.length; i += 30) {
            interaction.channel.send(results.slice(i, i + 30).join('\n'))
        }

        return
    }
}