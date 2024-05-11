
import { SlashCommandBuilder } from 'discord.js'    
import { createPlayer, isMod, isNewUser, hasPartnerAccess, findNoShowOpponent, getMatches, processMatchResult, processTeamResult, selectTournament } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Entry, Format, Player, Server, Tournament } from '@fl/models'

export default {
    data: new SlashCommandBuilder()
        .setName('noshow')
        .setDescription(`Mod Only - Record a tournament no-show. 🙈`)
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('Tag the user who did not play.')
                .setRequired(true)
        )
        .setDMPermission(false),
    async execute(interaction) {
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return await interaction.editReply({ content: `You do not have permission to do that.`})
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        if (!format) return await interaction.editReply({ content: `Try using **/noShow** in channels like: <#414575168174948372> or <#629464112749084673>.`})

        const noShow = interaction.options.getUser('player')
        if ((noShow.bot)) return await interaction.editReply({ content: `Sorry, Bots do not play ${format.name} Format... *yet*.`})

        const noShowPlayer = await Player.findOne({ where: { discordId: noShow.id } })
        if (!noShowPlayer) return await interaction.editReply({ content: `Sorry, <@${noShow.id}> is not in the database.`})
        const tournaments = [...await Entry.findAll({ where: { playerId: noShowPlayer.id }, include: Tournament })].map((e) => e.tournament).filter((t) => t.serverId === interaction.guildId)
        if (!tournaments.length) return await interaction.editReply({ content: `Sorry, ${noShowPlayer.globalName || noShowPlayer.discordName} is not any tournaments.`})
        
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return
        if (tournament.state === 'pending' || tournament.state === 'standby') return await interaction.editReply({ content: `Sorry, ${tournament.name} has not started yet.`})
        if (tournament.state !== 'underway') return await interaction.editReply({ content: `Sorry, ${tournament.name} is not underway.`})
        
        const noShowEntry = await Entry.findOne({ where: { playerId: noShowPlayer.id, tournamentId: tournament.id } })
        if (!noShowEntry) return await interaction.editReply({ content: `Sorry, I could not find that player's tournament entry in the database.`})

        const matchesArr = await getMatches(server, tournament.id)
        let winnerParticipantId = false
        for (let i = 0; i < matchesArr.length; i++) {
            const match = matchesArr[i].match
            if (match.state !== 'open') continue
            winnerParticipantId = findNoShowOpponent(match, noShowEntry.participantId)
            if (winnerParticipantId) break
        }
        
        if (!winnerParticipantId) return await interaction.editReply({ content: `Error: could not find open match featuring ${noShowEntry.name} in ${tournament.name}.`})

        const winningEntry = await Entry.findOne({ where: { participantId: winnerParticipantId, tournamentId: tournament.id }, include: Player })
        if (!winningEntry) return await interaction.editReply({ content: `Error: could not find opponent.`})
        const winningPlayer = winningEntry.player
        const winner = await interaction.guild?.members.fetch(winningPlayer.discordId)
        const success = tournament.isTeamTournament ? await processTeamResult(server, interaction, winningPlayer, noShowPlayer, tournament, format, true) :
            await processMatchResult(server, interaction, winner.user, winningPlayer, noShow.user, noShowPlayer, tournament, format, true)
        if (!success) return

        return await interaction.editReply({ content: `<@${noShowPlayer.discordId}>, your Tournament loss to <@${winningPlayer.discordId}> has been recorded as a no-show.`})	
    }
}
