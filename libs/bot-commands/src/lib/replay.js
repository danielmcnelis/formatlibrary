
import { SlashCommandBuilder } from 'discord.js'    
import { hasAffiliateAccess, isMod, selectMatch } from '@fl/bot-functions'
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
        // .addStringOption(str =>
        //     str
        //         .setName('tournament')
        //         .setDescription('Enter tournament name or abbreviation.')
        //         .setRequired(true)
        // )
		.addStringOption(option =>
			option.setName('tournament')
				.setDescription('Enter tournament name or abbreviation')
				.setAutocomplete(true)
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
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused()
        console.log('focusedValue', focusedValue)
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        
        const tournaments = await Tournament.findAll({
            where: {
                [Op.or]: {
                    name: {[Op.substring]: focusedValue},
                    abbreviation: {[Op.substring]: focusedValue}
                },
                formatId: format.id,
                serverId: server.id
            }
        })

		await interaction.respond(
			tournaments.map(t => ({ name: t.name, value: t.id })),
		)
    },            
    async execute(interaction) {
        await interaction.deferReply()
        const url = interaction.options.getString('url')
        const tournamentName = interaction.options.getString('tournament')
        const winner = interaction.options.getUser('winner')
        const loser = interaction.options.getUser('loser')
        const tournament = await Tournament.findOne({ where: { name: tournamentName }})
        if (!tournament) return await interaction.editReply({ content: `Error: Could not find tournament "${tournamentName}".`})	

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

        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)

        const matches = await Match.findAll({
            where: {
                formatId: format.id,
                isTournament: true,
                tournamentId: tournament.id,
                winnerId: winningPlayer.id,
                loserId: losingPlayer.id
            },
            order: [['createdAt', 'DESC']]
        })

        if (!matches.length) return await interaction.editReply({ content: `Error: No match report found for ${winner.username} vs ${loser.username}.`})	
        const replayExtension = url.slice(url.indexOf('replay?id=') + 10)
        const match = await selectMatch(interaction, matches, replayExtension)
		if (!match) return

        const {data: challongeMatch} = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/matches/${match.challongeMatchId}.json?api_key=${server.challongeAPIKey}`).catch((err) => console.log(err))
        if (!challongeMatch) return await interaction.editReply({ content: `Error: Challonge match not found.`})	
        const replay = await Replay.findOne({ where: { matchId: match.id }})
        if (replay && await isMod(server, interaction.member)) {
            await replay.update({ url })
            return await interaction.editReply({ content: `Replay updated for Round ${challongeMatch?.match?.round} of ${tournament.name} ${tournament.logo}:\nMatch: ${replay.winnerName} vs ${replay.loserName}\nURL: <${url}>`})	
        } if (replay) {
            return await interaction.editReply({ content: `The replay from this match was already saved:\n<${replay.url}>\n\nIf this link is incorrect, please get a Moderator to help you.`})	
        } else {
            const round = challongeMatch?.match?.round || ''
            let roundName 

            if (tournament.type === 'swiss' || tournament.type === 'round robin') {
                roundName = `Round ${challongeMatch?.match?.round}`
            } else if (tournament.type === 'single elimination') {
                roundName = tournament.rounds - round === 0 ? 'Finals' :
                    tournament.rounds - round === 1 ? 'Semi Finals' :
                    tournament.rounds - round === 2 ? 'Quarter Finals' :
                    tournament.rounds - round === 3 ? 'Round of 16' :
                    tournament.rounds - round === 4 ? 'Round of 32' :
                    tournament.rounds - round === 5 ? 'Round of 64' :
                    tournament.rounds - round === 6 ? 'Round of 128' :
                    tournament.rounds - round === 7 ? 'Round of 256' :
                    null
            } else if (tournament.type === 'double elimination') {
                if (round > 0) {
                    roundName = tournament.rounds - round === 0 ? 'Grand Finals' :
                        tournament.rounds - round === 1 ? `Winner's Finals` :
                        tournament.rounds - round === 2 ? `Winner's Semis` :
                        tournament.rounds - round === 3 ? `Winner's Quarters` :
                        `Winner's Round ${round}`
                } else {
                    roundName = tournament.rounds - Math.abs(round) === -1 ? `Loser's Finals` :
                        tournament.rounds - Math.abs(round) === 0 ? `Loser's Semis` :
                        tournament.rounds - Math.abs(round) === 1 ? `Loser's Quarters` :
                        `Loser's Round ${Math.abs(round)}`
                }
            } else {
                roundName = `${challongeMatch?.match?.round}`
            }
            
            try {
                await Replay.create({
                    url: url,
                    formatName: format.name,
                    formatId: format.id,
                    tournamentId: tournament.id,
                    winnerId: winningPlayer.id,
                    winnerName: winningPlayer.globalName || winningPlayer.discordName,
                    loserId: losingPlayer.id,
                    loserName: losingPlayer.globalName || losingPlayer.discordName,
                    matchId: match.id,
                    suggestedOrder: challongeMatch?.match?.suggested_play_order,
                    round: round,
                    roundName: roundName
                })
                
                return await interaction.editReply({ content: `New replay saved for Round ${roundName} of ${tournament.name} ${tournament.logo}:\nMatch: ${winningPlayer.globalName || winningPlayer.discordName} vs ${losingPlayer.globalName || losingPlayer.discordName}\nURL: <${url}>`})	
            } catch (err) {
                console.log(err)
            }
        }

    }
}
