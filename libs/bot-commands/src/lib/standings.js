
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
        const tournaments = [...await Tournament.findByState('underway', format, interaction.guildId)].filter((t) => t.type === 'swiss')
        if (!tournaments.length && format) return await interaction.editReply({ content: `There are no active ${format.name} ${server.emoji || format.emoji} Swiss tournaments.`})
        if (!tournaments.length && !format) return await interaction.editReply({ content: `There are no active Swiss tournaments.`})
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        interaction.editReply(`Calculating standings, please wait.`)
        const matches = await getMatches(server, tournament.id)
        const participants = await getParticipants(server, tournament.id)
        const standings = await calculateStandings(matches, participants)
        const results = [ `${tournament.logo} - ${tournament.name} Standings - ${tournament.emoji}` , `__Rk.  Name  -  Score  (W-L-T)  [Med-Buch / WvT]__`]

        for (let index = 0; index < standings.length; index++) {
            const s = standings[index]
            results.push(`${s.rank}.  ${s.name}  -  ${s.score.toFixed(1)}  (${s.wins}-${s.losses}-${s.ties})${s.byes ? ` +BYE` : ''}  [${s.medianBuchholz.toFixed(1)} / ${s.winsVsTied}]`)
        }

        for (let i = 0; i < results.length; i += 30) {
            interaction.channel.send(results.slice(i, i + 30).join('\n'))
        }

        return
    }
}