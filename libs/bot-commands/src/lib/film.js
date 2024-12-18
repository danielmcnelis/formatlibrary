
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Replay, Server, Tournament } from '@fl/models'
import { getFilm, checkPairing, getMatches, getRoundName, hasPartnerAccess, selectTournament, isModerator } from '@fl/bot-functions'
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
        
        let format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const tournaments = await Tournament.findByState({[Op.or]:['underway', 'topcut']}, format, interaction.guildId, 'ASC')
        const tournament = await selectTournament(interaction, tournaments, 'ASC')
        
        if (!tournament) {
            return
        } else {
            const discordId = interaction.options.getUser('player').id
            return getFilm(interaction, tournament.id, discordId)
        }
    }
}
