
import { SlashCommandBuilder } from 'discord.js'    
import { isProgrammer, isModerator, selectMatch } from '@fl/bot-functions'
import { Entry, Format, Match, Player, Replay, Server, Tournament } from '@fl/models'
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
        )
        .setDMPermission(false),    
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused()
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)
        const memberIsProgrammer = isProgrammer(interaction.member)
        const memberIsMod = isModerator(server, interaction.member)

        const tournaments = memberIsProgrammer ? await Tournament.findAll({
            where: {
                [Op.or]: {
                    name: {[Op.substring]: focusedValue},
                    abbreviation: {[Op.substring]: focusedValue}
                },
                state: {[Op.not]: 'pending'},
                formatId: {[Op.or]: [format?.id, null]}
            },
            limit: 5,
            order: [["createdAt", "DESC"]]
        }) : memberIsMod ?
            await Tournament.findAll({
                where: {
                    [Op.or]: {
                        name: {[Op.substring]: focusedValue},
                        abbreviation: {[Op.substring]: focusedValue}
                    },
                    state: {[Op.not]: 'pending'},
                    formatId: {[Op.or]: [format?.id, null]},
                    serverId: server?.id || null
                },
                limit: 5,
                order: [["createdAt", "DESC"]]
            })
        : await Tournament.findAll({
            where: {
                [Op.or]: {
                    name: {[Op.substring]: focusedValue},
                    abbreviation: {[Op.substring]: focusedValue}
                },
                state: 'underway',
                formatId: {[Op.or]: [format?.id, null]},
                serverId: server?.id || null
            },
            limit: 5,
            order: [["createdAt", "DESC"]]
        })

		await interaction.respond(
			tournaments.map(t => ({ name: t.name, value: t.id })),
		)
    },            
    async execute(interaction) {
        await interaction.deferReply()
        const url = interaction.options.getString('url')
        const tournamentId = interaction.options.getString('tournament')
        const winner = interaction.options.getUser('winner')
        const loser = interaction.options.getUser('loser')
        const tournament = await Tournament.findOne({ where: { id: tournamentId }})
        if (!tournament) return await interaction.editReply({ content: `Error: Could not find tournamentId ${tournamentId}.`})	
        const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
        const format = await Format.findByServerOrChannelId(server, interaction.channelId)

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

        const {data: challongeMatch} = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/matches/${match.challongeMatchId}.json?api_key=${server.challongeApiKey}`).catch((err) => console.log(err))
        if (!challongeMatch) return await interaction.editReply({ content: `Error: Challonge match not found.`})	

        const replay = await Replay.findOne({ where: { matchId: match.id }})
        if (replay && await isModerator(server, interaction.member)) {
            await replay.update({ url })
            return await interaction.editReply({ content: `Replay updated for Round ${challongeMatch?.match?.round} of ${tournament.name} ${tournament.logo}:\nMatch: ${replay.winnerName} vs ${replay.loserName}\nURL: <${url}>`})	
        } else if (replay) {
            return await interaction.editReply({ content: `The replay from this match was already saved:\n<${replay.url}>\n\nIf this link is incorrect, please get a Moderator to help you.`})	
        } else if (!replay) {
            const { data: { tournament: { participants_count } }} = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`).catch((err) => console.log(err))
            const round = challongeMatch?.match?.round
            let roundName

            if (tournament.type === 'single elimination') {
                const totalRounds = Math.ceil(Math.log2(participants_count))
                const roundsRemaining = totalRounds - round
                roundName = roundsRemaining === 0 ? 'Finals' :
                    roundsRemaining === 1 ? 'Semi Finals' :
                    roundsRemaining === 2 ? 'Quarter Finals' :
                    roundsRemaining === 3 ? 'Round of 16' :
                    roundsRemaining === 4 ? 'Round of 32' :
                    roundsRemaining === 5 ? 'Round of 64' :
                    roundsRemaining === 6 ? 'Round of 128' :
                    roundsRemaining === 7 ? 'Round of 256' :
                    null

            } else if (tournament.type === 'double elimination') {
                const totalWinnersRounds = Math.ceil(Math.log2(participants_count)) + 1
                const fullBracketSize = Math.pow(2, Math.ceil(Math.log2(participants_count)))
                const correction = (participants_count - (fullBracketSize / 2)) <= (fullBracketSize / 4) ? -1 : 0
                const totalLosersRounds = (totalWinnersRounds - 2) * 2 + correction
                if (round > 0) {
                    const roundsRemaining = totalWinnersRounds - round
                    roundName = roundsRemaining <= 0 ? 'Grand Finals' :
                        roundsRemaining === 1 ? `Winner's Finals` :
                        roundsRemaining === 2 ? `Winner's Semis` :
                        roundsRemaining === 3 ? `Winner's Quarters` :
                        `Winner's Round of ${Math.pow(2, roundsRemaining)}`
                } else {
                    const roundsRemaining = totalLosersRounds - Math.abs(round)
                    roundName = roundsRemaining === 0 ? `Loser's Finals` :
                        roundsRemaining === 1 ? `Loser's Semis` :
                        roundsRemaining === 2 ? `Loser's Thirds` :
                        roundsRemaining === 3 ? `Loser's Fifths` :
                        roundsRemaining === 3 ? `Loser's Sevenths` :
                        `Loser's Round ${Math.abs(round)}`
                }
            } else {
                roundName = `Round ${challongeMatch?.match?.round}`
            }

            try {
                await Replay.create({
                    url: url,
                    formatName: format.name,
                    formatId: format.id,
                    tournamentId: tournament.id,
                    winnerId: winningPlayer.id,
                    winnerName: winningPlayer.name,
                    loserId: losingPlayer.id,
                    loserName: losingPlayer.name,
                    matchId: match.id,
                    roundInt: round,
                    roundAbs: Math.abs(round),
                    roundName: roundName
                })
                
                return await interaction.editReply({ content: `New replay saved for ${roundName} of ${tournament.name} ${tournament.logo}:\nMatch: ${winningPlayer.name} vs ${losingPlayer.name}\nURL: <${url}>`})	
            } catch (err) {
                console.log(err)
            }
        }

    }
}
