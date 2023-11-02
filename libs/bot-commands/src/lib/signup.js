
import { SlashCommandBuilder } from 'discord.js'
import { Entry, Format, Player, Server, Tournament } from '@fl/models'
import { askForSimName, getDeckList, getOPDeckList, postParticipant, selectTournament } from '@fl/bot-functions'
import { isMod, hasPartnerAccess } from '@fl/bot-functions'
import { Op } from 'sequelize'
import { emojis } from '@fl/bot-emojis'

export default {
	data: new SlashCommandBuilder()
		.setName('signup')
		.setDescription('Mod Only - Sign-up another user for a tournament. 🙋')
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to sign-up.')
                .setRequired(true)
        ),
	async execute(interaction) {
        await interaction.deferReply()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasPartnerAccess(server)) return await interaction.editReply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return await interaction.editReply({ content: 'You do not have permission to do that. Please type **/join** instead.'})           
        let format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const tournaments = await Tournament.findByState({[Op.or]: ['pending', 'standby']}, format, interaction.guildId)
        const user = interaction.options.getUser('player')
        const member = await interaction.guild?.members.fetch(user.id)
        const player = await Player.findOne({ where: { discordId: user.id }})
        if (!player) return await interaction.editReply({ content: `That player is not in the database.`})
        
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        let entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id }})
        if (!format) format = await Format.findOne({ where: { name: {[Op.iLike]: tournament.formatName } }})
        if (!format) return await interaction.editReply(`Unable to determine what format is being played in ${tournament?.name}. Please contact an administrator.`)
        
        interaction.editReply({ content: `Please check your DMs.`})
        
        const simName = format.category === 'OP' ? player.opTcgSim || await askForSimName(interaction.member, player, 'OPTCGSim') :
            player.duelingBook || await askForSimName(interaction.member, player, 'DuelingBook')

        if (!simName) return

        const data = format.category === 'OP' ? await getOPDeckList(interaction.member, player, true) :
            await getDeckList(interaction.member, player, format, true)

        if (!data) return

        if (!entry) {
            try {
                entry = await Entry.create({
                    playerName: player.globalName || player.discordName,
                    url: data.url,
                    ydk: data.ydk || data.opdk,
                    playerId: player.id,
                    tournamentId: tournament.id,
                    compositeKey: player.id + tournament.id
                })
            } catch (err) {
                console.log(err)
                return interaction.member.send({ content: `${emojis.high_alert} Error: Please do not spam bot commands multiple times. ${emojis.one_week}`})
            }
                                           
            const { participant } = await postParticipant(server, tournament, player)
            if (!participant) return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register ${player.globalName || player.discordName} on Challonge for ${tournament?.name}. ${tournament.logo}`})
            await entry.update({ participantId: participant.id })

            member.roles.add(server.tourRole).catch((err) => console.log(err))
            interaction.member.send({ content: `Thanks! I have all the information we need for ${player.globalName || player.discordName}.` }).catch((err) => console.log(err))
            return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `A moderator signed up <@${player.discordId}> for ${tournament?.name}! ${tournament.logo}`}).catch((err) => console.log(err))
        } else if (entry && entry.active === false) {                      
            const { participant } = await postParticipant(server, tournament, player)
            if (!participant) return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register on Challonge for ${tournament?.name}. ${tournament.logo}`})
                      
            await entry.update({
                url: data.url,
                ydk: data.ydk || data.opdk,
                participantId: participant.id,
                active: true
            })
            
            member.roles.add(server.tourRole).catch((err) => console.log(err))
            interaction.member.send({ content: `Thanks! I have all the information we need for ${player.globalName || player.discordName}.`}).catch((err) => console.log(err))
            return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `A moderator signed up <@${player.discordId}> for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
        } else if (entry && entry.active === true) {
            await entry.update({ url: data.url, ydk: data.ydk || data.opdk })
            interaction.member.send({ content: `Thanks! I have ${player.globalName || player.discordName}'s updated deck list for the tournament.` }).catch((err) => console.log(err))
            return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `A moderator resubmitted <@${player.discordId}>'s deck list for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
        }
    }
}