
import { SlashCommandBuilder } from 'discord.js'
import { Format, Player, Replay, Server, Tournament } from '@fl/models'
import { hasAffiliateAccess, selectTournament } from '@fl/bot-functions'
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
        ),
    async execute(interaction) {
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasAffiliateAccess(server)) return await interaction.editReply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        
        const user = interaction.options.getUser('player') || interaction.user    
        const discordId = user.id
        const player = await Player.findOne({ where: { discordId: discordId } })
        if (!player) return await interaction.editReply({ content: "That user is not in the database."})

        let format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const tournaments = await Tournament.findByState('underway', format, interaction.guildId, 'ASC')
        const tournament = await selectTournament(interaction, tournaments, 'ASC')
        if (!tournament) return

        const replays = [...await Replay.findAll({
            where: {
                [Op.or]: [
                    { winnerId: player.id },
                    { loserId: player.id }
                ],
                tournamentId: tournament.id,
                '$tournament.state$': 'underway'
            },
            include: Tournament,
            order: [['suggestedOrder', 'ASC']]
        })].map((r) => {
            return `${r.roundName || `Round ${r.roundInt}`} ${r.winnerId === player.id ? `(W) vs ${r.loserName}` : `(L) vs ${r.winnerName}`}: <${r.url}>`
        })

        if (!replays.length) {
            return await interaction.editReply(`No replays found featuring ${player.globalName || player.discordName} in ${tournament.name}. ${tournament.emoji}`)
        } else {
            return await interaction.editReply(`${player.globalName || player.discordName}'s ${tournament.name} ${tournament.emoji} replays:\n${replays.join('\n')}`)
        }
    }
}
