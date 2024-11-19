
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Replay, Server, Tournament } from '@fl/models'
import { getMatches, getRoundName, hasPartnerAccess, selectTournament } from '@fl/bot-functions'
import { Op } from 'sequelize'
import { emojis } from '@fl/bot-emojis'

export default {
    data: new SlashCommandBuilder()
        .setName('film')
        .setDescription(`View a player's tournament film. 🎥`)
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to check.')
                .setRequired(true)
        )
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        
        const user = interaction.options.getUser('player') || interaction.user    
        const discordId = user.id
        const player = await Player.findOne({ where: { discordId: discordId } })
        if (!player) return await interaction.editReply({ content: "That user is not in the database."})

        let format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const tournaments = await Tournament.findByState({[Op.or]:['underway', 'topcut']}, format, interaction.guildId, 'ASC')
        const tournament = await selectTournament(interaction, tournaments, 'ASC')
        if (!tournament) return

        const entry = await Entry.findOne({
            where: {
                tournamentId: tournament.id,
                playerId: player.id
            }
        })

        const entryCount = await Entry.count({
            where: {
                tournamentId: tournament.id
            }
        })

        if (!entry) return await interaction.editReply({ content: `That user is not in ${tournament.name}.`})

        const matches = [...await getMatches(server, tournament.id)]
            .filter((e) => e.match?.state === 'complete' && (e.match?.player1_id === entry.participantId || e.match?.player2_id === entry.participantId))
            .map((e) => e.match)

        if (tournament.type === 'double elimination') matches.sort((a, b) => a.suggested_play_order - b.suggested_play_order)

        const replays = []
        let n = 0

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i]
            const roundName = getRoundName(tournament, match.round, entryCount)
            n++

            const replay = await Replay.findOne({
                where: {
                    [Op.or]: [
                        { winnerId: player.id },
                        { loserId: player.id }
                    ],
                    roundInt: match.round,
                    tournamentId: tournament.id,
                    '$tournament.state$': {[Op.or]: ['underway', 'topcut']}
                },
                include: Tournament
            })

            if ((tournament.type === 'swiss' || tournament.type === 'round robin') && match.round !== n) {
                replays.push(`Round ${n}: Bye ${emojis.casablanca}`)
                n++
            }
            
            if (replay) {
                replays.push(`${replay.roundName || roundName}: ${replay.winnerId === player.id ? `(W) vs ${replay.loserName}` : `(L) vs ${replay.winnerName}`}: <${replay.url}>`)
            } else if (match.forfeited === true || match.scores_csv === '0-0') {
                if (match.winner_id === entry.participantId) {
                    replays.push(`${roundName}: (W) No-Show ${emojis.sippin}`)
                } else {
                    replays.push(`${roundName}: (L) No-Show ${emojis.waah}`)
                }
            } else {
                replays.push(`${roundName}: Missing ${emojis.skipper}`)
            }
        }

        if (!replays.length) {
            return await interaction.editReply(`No replays found featuring ${player.name} in ${tournament.name}. ${tournament.emoji}`)
        } else {
            return await interaction.editReply(`${player.name}'s ${tournament.name} ${tournament.emoji} replays:\n${replays.join('\n')}`)
        }
    }
}
