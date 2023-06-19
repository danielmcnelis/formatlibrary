
import { SlashCommandBuilder } from 'discord.js'    
import { hasAffiliateAccess } from '@fl/bot-functions'
import { emojis } from '@fl/bot-emojis'
import { Format, Match, Player, Replay, Server, Tournament } from '@fl/models'
import { Op } from 'sequelize'
import axios from 'axios'

export default {
    data: new SlashCommandBuilder()
        .setName('replay')
        .setDescription(`Save a tournament match replay. 💿`)
		.addStringOption(str =>
            str
                .setName('url')
                .setDescription('Enter replay URL.')
                .setRequired(true)
        )
        .addStringOption(str =>
            str
                .setName('tournament')
                .setDescription('Enter tournament name or abbreviation.')
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('winner')
                .setDescription('Tag the winner.')
                .setRequired(true))
        .addUserOption(option =>
            option
                .setName('loser')
                .setDescription('Tag the loser.')
                .setRequired(true)
        ),                
    async execute(interaction) {
        await interaction.deferReply()
        const url = interaction.options.getString('url')
        const input = interaction.options.getString('tournament')
        const collapsedInput = input?.replace(/[\s-]/g, '')
        const winner = interaction.options.getUser('winner')
        const loser = interaction.options.getUser('loser')
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        if (!hasAffiliateAccess(server)) return await interaction.editReply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const isMod = await isMod(server, interaction.member)
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        if (!format) return await interaction.editReply({ content: `Try using **/replay** in channels like: <#414575168174948372> or <#629464112749084673>.`})

        const tournament = await Tournament.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: input},
                    abbreviation: {[Op.iLike]: collapsedInput}
                }
            }
        })

        if (!tournament) return await interaction.editReply({ content: `Error: Could not find tournament "${input}". Be sure to use the correct name or abbreviation.`})	

        const winningPlayer = await Player.findOne({
            where: {
                discordId: winner.id
            }
        })

        if (!winningPlayer) return await interaction.editReply({ content: `Error: Winner (${winner.username}) not found.`})	

        const losingPlayer = await Player.findOne({
            where: {
                discordId: loser.id
            }
        })

        if (!losingPlayer) return await interaction.editReply({ content: `Error: Loser (${loser.username}) not found.`})	

        const match = await Match.findOne({
            where: {
                formatId: format.id,
                isTournament: true,
                tournamentId: tournament.id,
                winnerId: winningPlayer.id,
                loserId: losingPlayer.id
            }
        })

        if (!match) return await interaction.editReply({ content: `Error: No match report found for ${winner.username} vs ${loser.username}.`})	
        const {data: challongeMatch} = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/matches/${match.challongeMatchId}.json?api_key=${server.challongeAPIKey}`).catch((err) => console.log(err))
        if (!challongeMatch) return await interaction.editReply({ content: `Error: Challonge match not found.`})	
        const replay = await Replay.findOne({ where: { matchId: match.id }})
        if (replay && isMod) {
            await replay.update({ url })
            return await interaction.editReply({ content: `Replay updated for Round ${challongeMatch?.match?.round} of ${tournament.name} ${tournament.logo}:\nMatch: ${replay.winner} vs ${replay.loser}\nURL: <${url}>`})	
        } if (replay && !isMod) {
            return await interaction.editReply({ content: `The replay from this match was already saved:\n<${replay.url}>\n\nIf this link is incorrect, please get a Moderator to help you.`})	
        } else {
            try {
                await Replay.create({
                    url: url,
                    formatName: format.name,
                    formatId: format.id,
                    tournamentId: tournament.id,
                    winnerId: winningPlayer.id,
                    winner: winningPlayer.name,
                    loserId: losingPlayer.id,
                    loser: losingPlayer.name,
                    matchId: match.id,
                    round: challongeMatch?.match?.round
                })
                
                return await interaction.editReply({ content: `New replay saved for Round ${challongeMatch?.match?.round} of ${tournament.name} ${tournament.logo}:\nMatch: ${winningPlayer.name} vs ${losingPlayer.name}\nURL: <${url}>`})	
            } catch (err) {
                console.log(err)
            }
        }

    }
}
