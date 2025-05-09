
//TOURNAMENT FUNCTIONS

//MODULE IMPORTS
import axios from 'axios'
import { Op } from 'sequelize'
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js'
import { Deck, Entry, Event, Format, Match, Player, Replay, Stats, Server, Team, Tournament } from '@fl/models'
import { getIssues, getSkillCard } from './deck.js'
import { createDecks } from './coverage.js'
import { capitalize, drawDeck, generateRandomString, getRoundName, isModerator, shuffleArray } from './utility.js'
import { emojis } from '@fl/bot-emojis'

////// TOURNAMENT REGISTRATION FUNCTIONS ///////

//ASK FOR DB NAME
export const askForSimName = async (member, player, simulator, override = false, error = false, attempt = 1) => {
    const filter = m => m.author.id === (member.id || member.user?.id)
    const pronoun = override ? `${player.name}'s` : 'your'
    const greeting = override ? '' : 'Hi! '
    const prompt = error ? `I think you're getting ahead of yourself. First, I need ${pronoun} ${simulator} name.`
    : `${greeting}This appears to be ${pronoun} first time using our system. Can you please provide ${pronoun} ${simulator} name?`
	const message = await member.send({ content: prompt.toString() }).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    
    return await message.channel.awaitMessages({
        filter,
		max: 1,
        time: 15000
    }).then(async (collected) => {
        const name = collected.first().content
        if (name.toLowerCase().includes("duelingbook.com") || name.toLowerCase().includes("imgur.com")) {
            if (attempt >= 3) {
                member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
                return false
            } else {
                return askForSimName(member, player, simulator, override, true, attempt++)
            }
        } else {
            if (simulator === 'DuelingBook') {
                await player.update({ duelingBookName: name })
            }

            member.send({ content: `Thanks! I saved ${pronoun} ${simulator} name as: ${name}. If that's wrong, go back to the server and type **/username**.`}).catch((err) => console.log(err))
            return name
        }
    }).catch((err) => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}

//ASK FOR TIME ZONE
export const askForTimeZone = async (member, player, override = false, error = false, attempt = 1) => {
    const filter = m => m.author.id === (member.id || member.user?.id)
    const pronoun = override ? `${player.name}'s` : 'your'
    const greeting = override ? '' : 'Hi! '
    const prompt = error ? `I think you're getting ahead of yourself. First, I need ${pronoun} DuelingBook name.`
    : `${greeting}This appears to be ${pronoun} first time using our system. Can you please provide ${pronoun} DuelingBook name?`
	const message = await member.send({ content: prompt.toString() }).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    
    return await message.channel.awaitMessages({
        filter,
		max: 1,
        time: 15000
    }).then(async (collected) => {
        const name = collected.first().content
        if (name.toLowerCase().includes("duelingbook.com") || name.toLowerCase().includes("imgur.com")) {
            if (attempt >= 3) {
                member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
                return false
            } else {
                return askForSimName(member, player, 'DuelingBook', override, true, attempt++)
            }
        } else {
            await player.update({ duelingBookName: name })
            member.send({ content: `Thanks! I saved ${pronoun} DuelingBook name as: ${name}. If that's wrong, go back to the server and type **/username**.`}).catch((err) => console.log(err))
            return name
        }
    }).catch((err) => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}

//GET DECK LIST
export const getDeckList = async (member, player, format, override = false, unranked = false) => {            
    const filter = m => m.author.id === (member.id || member.user?.id)
    const pronoun = override ? `${player.name}'s` : 'your'
    const message = await member.send({ content: `To submit a ${pronoun} tournament deck, please either:\n- copy and paste a **__YDKe code__**\n- upload a **__YDK file__**`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 180000
    }).then(async (collected) => {
        const url = collected.first()?.attachments?.first()?.url
        const ydke = collected.first()?.content
        let ydk

        if (url) {
            const {data} = await axios.get(url)
            ydk = data
        } else {
            const {data} = await axios.put(`https://formatlibrary.com/api/decks/convert-ydke-to-ydk`, { ydke: ydke })
            ydk = data                
        }
        
        if (ydk) {
            const main = ydk.split('#main')[1].split('#extra')[0].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)
            const extra = ydk.split('#extra')[1].split('!side')[0].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)
            const side = ydk.split('!side')[1].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)    
            const minimum = format.category === 'Speed' ? 20 : 40

            if (main?.length < minimum) {
                member.send(`I'm sorry, your deck must contain at least ${minimum} cards.`).catch((err) => console.log(err))    
                return false 
            }
            
            if (format.category === 'OCG' && format.date < '2000-04-20' && side?.length > 10) {
                member.send(`I'm sorry, before Series 2, your side deck cannot contain more than 10 cards.`).catch((err) => console.log(err))    
                return false 
            }

            const deckArr = [...main, ...extra, ...side,]
            const issues = await getIssues(deckArr, format)
            if (!issues) return false

            const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards } = issues
            if (!illegalCards || !forbiddenCards || !limitedCards || !semiLimitedCards || !unrecognizedCards) return false
            
            if (override) {
                member.send({ content: `Thanks, ${member.user.username}, I saved a copy of ${pronoun} deck. ${emojis.legend}`}).catch((err) => console.log(err))
                return { url, ydk }
            } else if (unranked) {
                member.send({ content: `Thanks, ${member.user.username}, ${pronoun} deck has been saved. ${emojis.legend}\n\nPlease note: Decks for unranked tournaments are not checked for legality. Be sure your deck is legal for this tournament!`}).catch((err) => console.log(err))
                return { url, ydk }
            } else if (format.category !== 'TCG' && format.category !== 'OCG' && format.category !== 'Speed') {
                member.send({ content: `Thanks, ${member.user.username}, ${pronoun} deck has been saved. ${emojis.legend}\n\nPlease note: Decks for ${format.category} Formats cannot be verified at this time. Be sure your deck is legal for this tournament!`}).catch((err) => console.log(err))
                return { url, ydk }
            } else if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length) {
                let response = [`I'm sorry, ${member.user.username}, your deck is not legal. ${emojis.mad}`]
                if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
                if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
                if (limitedCards.length) response = [...response, `\nThe following cards are limited:`, ...limitedCards]
                if (semiLimitedCards.length) response = [...response, `\nThe following cards are semi-limited:`, ...semiLimitedCards]
            
                for (let i = 0; i < response.length; i += 50) {
                    if (response[i+50] && response[i+50].startsWith("\n")) {
                        member.send({ content: response.slice(i, i+51).join('\n').toString()}).catch((err) => console.log(err))
                        i++
                    } else {
                        member.send({ content: response.slice(i, i+50).join('\n').toString()}).catch((err) => console.log(err))
                    }
                }
            
                return false
            } else if (unrecognizedCards.length) {
                let response = `I'm sorry, ${member.user.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
                response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
                
                member.send({ content: response.toString() }).catch((err) => console.log(err))
                return false
                } else {
                member.send({ content: `Thanks, ${member.user.username}, ${pronoun} deck is perfectly legal. ${emojis.legend}`}).catch((err) => console.log(err))
                return { url, ydk }
            }
        } else {
            member.send({ content: "Sorry, I only accept **__YDK files__** or **__YDKe codes__**."}).catch((err) => console.log(err))    
            return false  
        }
    }).catch((err) => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}

//GET SPEED DECK LIST
export const getSpeedDeckList = async (member, player, format, override = false) => {      
    const skillCard = await getSkillCard(member, format, true)  
    if (!skillCard) return    

    const filter = m => m.author.id === (member.id || member.user?.id)
    const pronoun = override ? `${player.name}'s` : 'your'
    const message = await member.send({ content: `Please either upload a **__YDK file__** or copy and paste a **__YDKe code__** for ${pronoun} tournament deck.`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 180000
    }).then(async (collected) => {
        const url = collected.first()?.attachments?.first()?.url
        const ydke = collected.first()?.content
        let ydk

        if (url) {
            const {data} = await axios.get(url)
            ydk = data
        } else {
            const {data} = await axios.put(`https://formatlibrary.com/api/decks/convert-ydke-to-ydk`, { ydke: ydke })
            ydk = data                
        }

        if (ydk) {
            const main = ydk.split('#main')[1].split('#extra')[0].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)
            const extra = ydk.split('#extra')[1].split('!side')[0].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)
            const side = ydk.split('!side')[1].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)    
            const minimum = format.category === 'Speed' ? 20 : 40

            if (main?.length < minimum) {
                member.send(`I'm sorry, your deck must contain at least ${minimum} cards.`).catch((err) => console.log(err))    
                return false 
            }

            const deckArr = [...main, ...extra, ...side,]
            const issues = await getIssues(deckArr, format)
            if (!issues) return false

            const { illegalCards, forbiddenCards, limited1Cards, limited2Cards, limited3Cards, unrecognizedCards } = issues
            if (!illegalCards || !forbiddenCards || !limited1Cards || !limited2Cards || !limited3Cards || !unrecognizedCards) return false
            
            if (override) {
                member.send({ content: `Thanks, ${member.user.username}, I saved a copy of ${pronoun} deck. ${emojis.legend}`}).catch((err) => console.log(err))
                return { url, ydk }
            } else if (format.category !== 'TCG' && format.category !== 'Speed') {
                member.send({ content: `Thanks, ${member.user.username}, ${pronoun} deck has been saved. ${emojis.legend}\n\nPlease note: Decks for ${format.category} Formats cannot be verified at this time. Be sure your deck is legal for this tournament!`}).catch((err) => console.log(err))
                return { url, ydk }
            } else if (illegalCards.length || forbiddenCards.length || limited1Cards.length || limited2Cards.length || limited3Cards.length) {
                let response = [`I'm sorry, ${member.user.username}, your deck is not legal. ${emojis.mad}`]
                if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
                if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
                if (limited1Cards.length) response = [...response, `\nThe following cards are limited to 1 slot per deck:`, ...limited1Cards]
                if (limited2Cards.length) response = [...response, `\nThe following cards are limited to 2 slots per deck:`, ...limited2Cards]
                if (limited3Cards.length) response = [...response, `\nThe following cards are limited to 3 slots per deck:`, ...limited3Cards]
                
                for (let i = 0; i < response.length; i += 50) {
                    if (response[i+50] && response[i+50].startsWith("\n")) {
                        member.send({ content: response.slice(i, i+51).join('\n').toString()}).catch((err) => console.log(err))
                        i++
                    } else {
                        member.send({ content: response.slice(i, i+50).join('\n').toString()}).catch((err) => console.log(err))
                    }
                }
            
                return false
            } else if (unrecognizedCards.length) {
                let response = `I'm sorry, ${member.user.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
                response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
                
                member.send({ content: response.toString() }).catch((err) => console.log(err))
                return false
             } else {
                member.send({ content: `Thanks, ${member.user.username}, ${pronoun} deck is perfectly legal. ${emojis.legend}`}).catch((err) => console.log(err))
                return { url, ydk }
            }
        } else {
            member.send({ content: "Sorry, I only accept **__YDK files__** or **__YDKe codes__**."}).catch((err) => console.log(err))    
            return false  
        }
    }).catch((err) => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}

// SEND DECK
export const sendDeck = async (interaction, id) => {
    if (id.startsWith('D')) {
        const deck = await Deck.findOne({ where: { id: id.slice(1) }, include: [{model: Player, as: 'builder'}, Event, Format] })
        interaction.editReply({ content: `Please check your DMs.` })
        const deckAttachments = await drawDeck(deck.ydk) || []
        const ydkFile = new AttachmentBuilder(Buffer.from(deck.ydk), { name: `${deck.builderName}_${deck.eventAbbreviation || deck.event?.name}.ydk` })
        const isAuthor = interaction.user.id === deck.builder.discordId
        deckAttachments.forEach((attachment, index) => {
            if (index === 0) {
                interaction.member.send({ content: `${isAuthor ? 'Your' : `${deck.builderName}'s`} deck for ${deck.event?.name} is:`, files: [attachment] }).catch((err) => console.log(err))
            } else {
                interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
            }
        })

        return await interaction.member.send({ files: [ydkFile]}).catch((err) => console.log(err))
    } else {
        const entry = await Entry.findOne({ where: { id: id.slice(1) }, include: [Player, Tournament] })
        interaction.editReply({ content: `Please check your DMs.` })
        const deckAttachments = await drawDeck(entry.ydk) || []
        const ydkFile = new AttachmentBuilder(Buffer.from(entry.ydk), { name: `${entry.player.name}_${entry.tournament.abbreviation || entry.tournament.name}.ydk` })
        const isAuthor = interaction.user.id === entry.player.discordId

        deckAttachments.forEach((attachment, index) => {
            if (index === 0) {
                interaction.member.send({ content: `${isAuthor ? 'Your' : `${entry.player.name}'s`} deck for ${entry.tournament.name} is:`, files: [attachment] }).catch((err) => console.log(err))
            } else {
                interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
            }
        })

        return await interaction.member.send({ files: [ydkFile]}).catch((err) => console.log(err))
    }
}

// SELECT TOURNAMENT FOR DECK CHECK
export const selectTournamentForDeckCheck = async (interaction, decks, format) => {
    if (!decks.length) {
        interaction.editReply(`That player has not submitted a deck for any ${format.name} Format ${format.emoji} tournaments in this server.`)
        return false
    } else if (decks.length === 1) {
        return decks[0]
    } else {
        const options = decks.map((deck, index) => {
            return {
                label: `(${index + 1}) ${deck.tournamentName}`,
                value: `${deck.id}`,
            }
        })
    
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select')
                    .setPlaceholder('Nothing selected')
                    .addOptions(...options),
            )
    
        interaction.editReply({ content: `Please select a tournament:`, components: [row] })
        return false
    }
}


// SELECT TOURNAMENT
export const selectTournament = async (interaction, tournaments) => {
    if (tournaments.length === 0) {
        interaction.editReply({ content: `There is no tournament that meets this criteria.` })
        return false
    } else if (tournaments.length === 1)  {
        return tournaments[0]
    } else {
        const options = tournaments.map((tournament, index) => {
            return {
                label: `(${index + 1}) ${tournament.name}`,
                value: `${tournaments[index].id}`,
            }
        })

        const user = interaction.options.getUser('player')
        const hours = interaction.options.getNumber('hours')
        const minutes = interaction.options.getNumber('minutes')
    
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(hours || minutes ? `${hours}:${minutes}` : user ? user.id : interaction.member.id)
                    .setPlaceholder('Nothing selected')
                    .addOptions(...options),
            )
    
        interaction.editReply({ content: `Please select a tournament:`, components: [row] })
        return false
    }
}

// GET FILM
export const getFilm = async (interaction, tournamentId, discordId) => {
    const server = await Server.findById(interaction.guildId)
    const tournament = await Tournament.findById(tournamentId)

    const inspectedPlayer = await Player.findOne({ where: { discordId: discordId } })
    if (!inspectedPlayer) return await interaction.editReply({ content: "That user is not in the database."})

    const inspectedEntry = await Entry.findByPlayerIdAndTournamentId(inspectedPlayer.id, tournament.id)
    if (!inspectedEntry) return await interaction.editReply({ content: `That user is not in ${tournament.name}.`})

    const inspectingPlayer = await Player.findOne({ where: { discordId: interaction.user.id } })
    if (!inspectingPlayer) return await interaction.editReply({ content: "You are not in the database."})

    const inspectingEntry = await Entry.findByPlayerIdAndTournamentId(inspectingPlayer.id, tournament.id) || 
        await Entry.findByPlayerIdAndTournamentId(inspectingPlayer.id, tournament.associatedTournamentId)

    // let [openChallongeMatch] = tournament.state === 'underway' ?
    //     [...await getMatches(server, tournament.id, 'open', inspectedEntry.participantId)].map((el) => el.match) :
    //     [...await getMatches(server, tournament.associatedTournamentId, 'open', inspectedEntry.participantId)].map((el) => el.match)

    // const inspectingIsPairedWithInspected = checkPairing(openChallongeMatch, inspectedEntry?.participantId, inspectingEntry?.participantId)
    // const elligibleToView = (isModerator(server, interaction.member) && !inspectingEntry) || inspectingIsPairedWithInspected 
    // if (!elligibleToView) return await interaction.editReply({ content: `You do not have permission to do that.`})

    const elligibleToView = inspectingEntry || inspectingPlayer.isSubscriber || isModerator(server, interaction.member)
    if (!elligibleToView) return await interaction.editReply({ content: `Sorry, you must be a tournament participant, a staff member, or a subscriber to view replays.`})

    const matches = [...await getMatches(server, tournament.id, 'complete', inspectedEntry.participantId)].map((el) => el.match)
    if (tournament.type === 'double elimination') matches.sort((a, b) => a.suggested_play_order - b.suggested_play_order)

    const replays = []
    let n = 0

    const entryCount = await Entry.count({
        where: {
            tournamentId: tournament.id
        }
    })

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i]
        const roundName = getRoundName(tournament, match.round, entryCount)
        n++

        const replay = await Replay.findOne({
            where: {
                [Op.or]: [
                    { winnerId: inspectedPlayer.id },
                    { loserId: inspectedPlayer.id }
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
            replays.push(`${replay.roundName || roundName}: ${replay.winnerId === inspectedPlayer.id ? `(W) vs ${replay.loserName}` : `(L) vs ${replay.winnerName}`}: <${replay.url}>`)
        } else if (match.forfeited === true || match.scores_csv === '0-0') {
            if (match.winner_id === inspectedEntry.participantId) {
                replays.push(`${roundName}: (W) No-Show ${emojis.sippin}`)
            } else {
                replays.push(`${roundName}: (L) No-Show ${emojis.waah}`)
            }
        } else {
            replays.push(`${roundName}: Missing ${emojis.skipper}`)
        }
    }

    if (!replays.length) {
        return await interaction.editReply(`No replays found featuring ${inspectedPlayer.name} in ${tournament.name}. ${tournament.emoji}`)
    } else {
        interaction.member.send(`${inspectedPlayer.name}'s ${tournament.name} ${tournament.emoji} replays:\n${replays.join('\n')}`)
        return await interaction.editReply(`Please check your DMs for ${inspectedPlayer.name}'s ${tournament.name} ${tournament.emoji} replays.`)        
    }
}

// SAVE REPLAY
export const saveReplay = async (server, interaction, match, tournament, url) => {
    const format = await Format.findOne({ where: { id: match.formatId }})
    const winningPlayer = await Player.findOne({ where: { id: match.winnerId }})
    const losingPlayer = await Player.findOne({ where: { id: match.loserId }})

    const {data: {tournament: { participants_count }}} = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`).catch((err) => console.log(err))
    if (!participants_count) return await interaction.channel.send({ content: `Error: Challonge tournament data not found.`})	
    const {data: challongeMatch} = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/matches/${match.challongeMatchId}.json?api_key=${server.challongeApiKey}`).catch((err) => console.log(err))
    if (!challongeMatch) return await interaction.channel.send({ content: `Error: Challonge match data not found.`})	
    const replay = await Replay.findOne({ where: { matchId: match.id }})
    if (replay && await isModerator(server, interaction.member)) {
        await replay.update({ url })
        return await interaction.channel.send({ content: `Replay updated for Round ${challongeMatch?.match?.round} of ${tournament.name} ${tournament.logo}:\nMatch: ${replay.winnerName} vs ${replay.loserName}\nURL: <${url}>`})	
    } if (replay) {
        return await interaction.channel.send({ content: `The replay from this match was already saved:\n<${replay.url}>\n\nIf this link is incorrect, please get a Moderator to help you.`})	
    } else {
        const round = challongeMatch?.match?.round || ''
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


// CLOSE TOURNAMENT 
export const closeTournament = async (interaction, tournamentId) => {
    const tournament = await Tournament.findOne({ where: { id: tournamentId }})
    await tournament.update({ state: 'standby' })
    return await interaction.editReply({ content: `Registration for ${tournament.name} ${tournament.logo} is now closed.`})
}

// OPEN TOURNAMENT
export const openTournament = async (interaction, tournamentId) => {
    const tournament = await Tournament.findOne({ where: { id: tournamentId }})
    await tournament.update({ state: 'pending' })
    return await interaction.editReply({ content: `Registration for ${tournament.name} ${tournament.logo} is now open.`})
}

// JOIN TOURNAMENT 
export const joinTournament = async (interaction, tournamentId) => {
    const player = await Player.findOne({
        where: {
            discordId: interaction.user?.id
        }
    })

    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        },
        include: Format
    })

    const server = await Server.findOne({
        where: {
            name: interaction.guild.name
        }
    })

    let format = await Format.findByServerOrChannelId(server, interaction.channelId)
    
    if (tournament.isPremiumTournament && (!player.isSubscriber || player.subscriberTier === 'Supporter')) {
        return await interaction.editReply({ content: `Sorry, premium tournaments are only open to premium subscribers.`})
    } else if (tournament.requiredRoleId && !interaction.member?._roles.includes(tournament.requiredRoleId) && !interaction.member?._roles.includes(tournament.alternateRoleId)) {
        return await interaction.editReply({ content: `Sorry, you must have the <@&${tournament?.requiredRoleId}> role to join ${tournament.name}.`})
    }

    const team = tournament.isTeamTournament ? await Team.findOne({
        where: {
            tournamentId: tournament.id,
            [Op.or]: {
                playerAId: player.id,
                playerBId: player.id,
                playerCId: player.id,
            }
        }
    }) : null

    let entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournamentId }})
    interaction.editReply({ content: `Please check your DMs.` })
    
    if (tournament.name?.includes('Multi-Format') && !format?.name?.includes('Goat') && !format?.name?.includes('Edison') && !format?.name?.includes('Tengu') ) {        
        return await interaction.editReply({ content: `To register for ${tournament.name} ${tournament.logo} you must submit a deck for Goat, Edison, or Tengu Plant Format.` })
    }

    if (tournament.name?.includes('Multi-Format') && !entry) {
        const count = await Entry.count({
            where: {
                teamId: team.id,
                slot: format.name
            }
        })

        if (count) {
            return await interaction.editReply({ content: `Sorry, your team already has a player registered for ${format.name} Format. ${format.emoji}` })
        }
    }

    const simName = player.duelingBookName || await askForSimName(interaction.member, player, 'DuelingBook')
    if (!simName) return

    const data = await getDeckList(interaction.member, player, tournament.format || format, false, !tournament.isRated)
    if (!data) return

    if (!entry && tournament.isTeamTournament && team) {
        const slot = tournament.name?.includes('Multi-Format') ? format.name :
                team.playerAId === player.id ? 'A' :
                team.playerBId === player.id ? 'B' :
                team.playerCId === player.id ? 'C' :
                null
                
        try { 
            await Entry.create({
                playerName: player.name,
                url: data.url,
                ydk: data.ydk || data.opdk,
                participantId: team.participantId,
                playerId: player.id,
                tournamentId: tournament.id,
                compositeKey: player.id + tournament.id,
                slot: slot,
                teamId: team.id
            })
        } catch (err) {
            console.log(err)
            return interaction.member.send({ content: `${emojis.high_alert} Error: Please do not spam bot commands multiple times. ${emojis.one_week}`})
        }

        const deckAttachments = await drawDeck(data.ydk) || []
        if (server.tournamentRoleId) {
            interaction.member.roles.add(server.tournamentRoleId).catch((err) => console.log(err))
        }
        interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in ${tournament.name}! ${tournament.logo}`})
        deckAttachments.forEach((attachment, index) => {
            if (index === 0) {
                interaction.member.send({ content: `FYI, this is the deck you submitted:`, files: [attachment] }).catch((err) => console.log(err))
            } else {
                interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
            }
        })
        
        return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> (${team.name}) is now registered for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
    } else if (!entry && !tournament.isTeamTournament) {
        // if (tournament.isPremiumTournament && player.subscriberTier === 'Premium') {
        //     const alreadyEntered = await Entry.count({
        //         where: {
        //             playerId: player.id,
        //             '$tournament.isPremiumTournament$': true
        //         },
        //         include: Tournament
        //     })

        //     if (alreadyEntered > 2) {
        //         return interaction.member.send({ content: `Sorry, you may only enter two (2) Premium Tournaments this month with your current subscription.`})
        //     }
        // }

        try {
            entry = await Entry.create({
                playerName: player.name,
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
                            
        const { participant } = await postParticipant(server, tournament, player.name).catch((err) => console.log(err))
        
        if (!participant) {
            await entry.destroy()
            return await interaction.member.send({ content: `Error: Unable to register on Challonge for ${tournament.name}. ${tournament.logo}`})
        }

        await entry.update({ participantId: participant.id })

        const deckAttachments = await drawDeck(data.ydk) || []
        if (server.tournamentRoleId) {
            interaction.member.roles.add(server.tournamentRoleId).catch((err) => console.log(err))
        }
        interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in ${tournament.name}! ${tournament.logo}`})
        deckAttachments.forEach((attachment, index) => {
            if (index === 0) {
                interaction.member.send({ content: `FYI, this is the deck you submitted:`, files: [attachment] }).catch((err) => console.log(err))
            } else {
                interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
            }
        })

        return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> is now registered for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
    } else if (entry && entry.isActive === false && tournament.isTeamTournament) {
        await entry.update({
            url: data.url,
            ydk: data.ydk || data.opdk,
            isActive: true
        })

        const deckAttachments = await drawDeck(data.ydk) || []
        if (server.tournamentRoleId) {
            interaction.member.roles.add(server.tournamentRoleId).catch((err) => console.log(err))
        }
        interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in ${tournament.name}! ${tournament.logo}`})
        deckAttachments.forEach((attachment, index) => {
            if (index === 0) {
                interaction.member.send({ content: `FYI, this is the deck you submitted:`, files: [attachment] }).catch((err) => console.log(err))
            } else {
                interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
            }
        })

        return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> is now registered for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
    } else if (entry) {
        if (!entry.participantId) {
            const { participant } = await postParticipant(server, tournament, player.name).catch((err) => console.log(err))
    
            if (!participant) {
                await entry.destroy()
                return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register on Challonge for ${tournament.name}. ${tournament.logo}`})
            } else {
                await entry.update({ participantId: participant.id })
            }
        }

        await entry.update({ url: data.url, ydk: data.ydk || data.opdk })
        const deckAttachments = await drawDeck(data.ydk) || []
        if (server.tournamentRoleId) {
            interaction.member.roles.add(server.tournamentRoleId).catch((err) => console.log(err))
        }
        interaction.member.send({ content: `Thanks! I have your updated deck list for ${tournament.name}! ${tournament.logo}`})
        deckAttachments.forEach((attachment, index) => {
            if (index === 0) {
                interaction.member.send({ content: `FYI, this is the deck you resubmitted:`, files: [attachment] }).catch((err) => console.log(err))
            } else {
                interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
            }
        })
        
        return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> resubmitted their deck list for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
    }
}


// SIGNUP FOR TOURNAMENT 
export const signupForTournament = async (interaction, tournamentId, userId) => {
    if (!userId) userId = await interaction.options.getUser('player').id
    const member = await interaction.guild?.members.fetch(userId)

    const player = await Player.findOne({
        where: {
            discordId: userId
        }
    })

    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        },
        include: Format
    })

    const server = await Server.findOne({
        where: {
            name: interaction.guild.name
        }
    })

    let entry
    entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournamentId }})
    interaction.editReply({ content: `Please check your DMs.` })
    
    const simName = player.duelingBookName || await askForSimName(interaction.member, player, 'DuelingBook')
    if (!simName) return

    const data = await getDeckList(interaction.member, player, tournament.format, true, !tournament.isRated)

    if (!data) return

    if (!entry) {
        try {
            entry = await Entry.create({
                playerName: player.name,
                url: data.url,
                ydk: data.ydk || data.opdk,
                playerId: player.id,
                tournamentId: tournament.id,
                compositeKey: player.id + tournament.id,
            }) 
        } catch (err) {
            console.log(err)
            return interaction.member.send({ content: `${emojis.high_alert} Error: Please do not spam bot commands multiple times. ${emojis.one_week}`})
        }
                  
        const { participant } = await postParticipant(server, tournament, player.name)
        if (!participant) return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register on Challonge for ${tournament.name}. ${tournament.logo}`})        
        await entry.update({ participantId: participant.id })

        if (server.tournamentRoleId) {
            member.roles.add(server.tournamentRoleId).catch((err) => console.log(err))
        }
        interaction.member.send({ content: `Thanks! I have all the information we need for ${player.name}.` }).catch((err) => console.log(err))
        return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `A moderator signed up <@${player.discordId}> for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
    } else if (entry && entry.isActive === false) {
        const { participant } = await postParticipant(server, tournament, player.name)
        if (!participant) return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register on Challonge for ${tournament.name}. ${tournament.logo}`})
        
        await entry.update({
            url: data.url,
            ydk: data.ydk || data.opdk,
            participantId: participant.id,
            isActive: true
        })

        if (server.tournamentRoleId) {
            member.roles.add(server.tournamentRoleId).catch((err) => console.log(err))
        }
        interaction.member.send({ content: `Thanks! I have all the information we need for ${player.name}.` }).catch((err) => console.log(err))
        return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `A moderator signed up <@${player.discordId}> for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
    } else if (entry && entry.isActive === true) {
        await entry.update({ url: data.url, ydk: data.ydk || data.opdk })
        interaction.member.send({ content: `Thanks! I have ${player.name}'s updated deck list for the tournament.` }).catch((err) => console.log(err))
        return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `A moderator resubmitted <@${player.discordId}>'s deck list for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))   
    }
}

// CHECK TIMER
export const checkTimer = async (interaction, tournamentId) => {
    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        }
    }) 

    const now = new Date()
    const difference = tournament.deadline - now

    if (difference < 0) return await interaction.editReply(`The deadline has passed.`)
    if (difference < 60 * 1000) return await interaction.editReply(`Remaining time: less than 1 minute.`)

    let hours = Math.floor(difference / (1000 * 60 * 60))
    const word1 = hours === 1 ? 'hour' : 'hours'
    let minutes = Math.round((difference - (hours * (1000 * 60 * 60))) / (1000 * 60))
    
    while (minutes >= 60) {
        hours++
        minutes-= 60
    }

    if (hours < 1) {
        const word2 = minutes === 1 ? 'minute' : 'minutes'
        return await interaction.editReply(`Remaining time: ${minutes} ${word2}.`)
    } else {
        const word2 = minutes === 1 ? 'minute' : 'minutes'
        return await interaction.editReply(`Remaining time: ${hours} ${word1} and ${minutes} ${word2}.`)
    }
}

// SET TIMER FOR TOURNAMENT
export const setTimerForTournament = async (interaction, tournamentId, hours, minutes) => {
    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        },
        include: Format
    }) 

    const server = await Server.findOne({
        where: {
            name: interaction.guild.name
        }
    })

    const timestamp = Date.now()
    const timeRemaining = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000)
    const deadline = new Date(timestamp + timeRemaining)
    await tournament.update({ deadline })

    while (minutes >= 60) {
        hours++
        minutes-= 60
    }

    const word1 = hours === 1 ? 'hour' : 'hours'
    const word2 = minutes === 1 ? 'minute' : 'minutes'

    if (hours < 1) {
        interaction.editReply(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} The next round begins now! You have ${minutes} ${word2} to complete your match. ${emojis.thinkygo}`)
    } else {
        interaction.editReply(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} The next round begins now! You have ${hours} ${word1} and ${minutes} ${word2} to complete your match. ${emojis.thinkygo}`)
    }

    if (tournament.isTeamTournament) {
        sendTeamPairings(interaction.guild, server, tournament, true)
    } else {
        sendPairings(interaction.guild, server, tournament, true)
    }

    return setTimeout(async () => {
        return await interaction.editReply(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} Time is up in the round! ${emojis.vince}`)
    }, timeRemaining)
}

////// TOURNAMENT HOST FUNCTIONS ///////

// CREATE SHEET DATA
export const createSheetData = async (tournament) => {
    try {
        const entries = await Entry.findAll({ where: { tournamentId: tournament.id}, include: Player })
        const typeData = {}
        const catData = {}
        const sheet1Data = [['Player', 'Deck', 'Type', 'Link']]
        const sheet2DataA = [['Deck', 'Entries', 'Percent']]
        const sheet2DataB = [[], ['Category', 'Entries', 'Percent']]
    
        entries.forEach((e) => {
            typeData[e.deck_type] ? typeData[e.deck_type]++ : typeData[e.deck_type] = 1
            catData[e.deck_category] ? catData[e.deck_category]++ : catData[e.deck_category] = 1
            sheet1Data.push([e.playerName, e.deck_name, e.deck_type, e.url])            
        })
    
        let typeDataArr = Object.entries(typeData).sort((b, a) => b[0].localeCompare(a[0]))
        let catDataArr = Object.entries(catData).sort((b, a) => b[0].localeCompare(a[0]))
    
        let typeDataArr2 = typeDataArr.map((e) => [e[0], e[1], `${(e[1], e[1] / entries.length * 100).toFixed(2)}%`])
        let catDataArr2 = catDataArr.map((e) =>[capitalize(e[0]), e[1], `${(e[1], e[1] / entries.length * 100).toFixed(2)}%`])
    
        const sheet2Data = [...sheet2DataA, ...typeDataArr2, ...sheet2DataB, ...catDataArr2]
    
        const data = {
            sheet1Data,
            sheet2Data
        }

        return data
    } catch (err) {
        console.log(err)
        return {}
    }
}

//REMOVE PARTICIPANT
export const removeParticipant = async (server, interaction, member, entry, tournament, drop = false) => {  
    const playerId = entry.playerId
    const playerName = member?.user?.username || entry.playerName
    const initialState = tournament.state
    const matches = await getMatches(server, tournament.id, 'open')
    let openMatch, opponentEntry

    const swissAndUnderway = await Tournament.count({ where: { id: tournament.id, type: 'swiss', state: 'underway' }})
    if (swissAndUnderway && !matches?.length) {
        return await interaction.editReply({ content: `Error: Cannot ${drop ? 'drop' : 'remove participants'} while generating pairings for the next round. Please try again in a moment.`})
    } else {
        openMatch = findOpenMatch(matches, entry.participantId)
        opponentEntry = await findNextOpponent(tournament.id, matches, openMatch.id, entry.participantId)
    }
 
    const processing = await Tournament.count({ where: { id: tournament.id, state: 'processing' }})
    if (processing) {
        return await interaction.editReply({ content: `Error: Processing another API request for this tournament. Please try again shortly.`})
    }

    try {
        await tournament.update({ state: 'processing' })
        // DELETE PARTICIPANT FROM CHALLONGE BRACKET 
        await axios({
            method: 'delete',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/${entry.participantId}.json?api_key=${server.challongeApiKey}`
        })
        
        // DE-ACTIVATE ENTRY DATA IF UNDERWAY, OTHERWISE DELETE ENTRY DATA
        if (initialState === 'underway') {
            await entry.update({ isActive: false, roundDropped: await getCurrentRound(server, tournament.id) })
        } else {
            await entry.destroy()
        }

        const count = await Entry.count({ 
            where: {
                playerId: playerId,
                isActive: true,
                '$tournament.serverId$': server.id
            },
            include: Tournament
        })

        // REMOVE TOURNAMENT PARTICIPANT ROLE IF NOT IN ANY OTHER TOURNAMENTS ON THE SERVER
        if (!count && server.tournamentRoleId) member?.roles?.remove(server.tournamentRoleId)

        // NOTIFY OPPONENT IF MATCH WAS OPEN
        if (opponentEntry) {
            const opposingMember = await interaction.guild?.members.fetch(opponentEntry.player.discordId)
            const participants_count = await Entry.count({
                where: {
                    tournamentId: tournament.id
                }
            })

            const roundName = getRoundName(tournament, openMatch?.round, participants_count)
            opposingMember.user.send(
                `Pairing update: Your opponent for ${roundName} of ${tournament.name} ${tournament.logo || tournament.emoji} (${entry.name}) dropped. ${emojis.woe} Enjoy the free win! ${emojis.koolaid}`
            )
        }
        
        // REPLY WITH AN AFFIRMATIVE RESPONSE
        if (drop && tournament.state !== 'underway') {
            return await interaction.editReply({ content: `I removed you from ${tournament.name}. We hope to see you next time! ${tournament.emoji}`})
        } else if (drop) {
            return await interaction.editReply({ content: `I removed you from ${tournament.name}. Better luck next time! ${tournament.emoji}`})
        } else {
            return await interaction.editReply({ content: `${playerName} has been removed from ${tournament.name}. ${tournament.emoji}`})
        }
    } catch (err) {
        console.log(err)
        // REPLY WITH AN ERROR MESSAGE
        if (drop) {
            return await interaction.editReply({ content: `Hmm... I don't see you in the participants list for ${tournament.name}. ${tournament.emoji}`})
        } else {
            return await interaction.editReply({ content: `I could not find ${playerName} in the participants list for ${tournament.name}. ${tournament.emoji}`})
        }
    } finally {
        await tournament.update({ state: initialState })
    }
}

//REMOVE TEAM
export const removeTeam = async (server, interaction, team, entries, tournament, drop = false) => {   
    const initialState = tournament.state
    const processing = await Tournament.count({ where: { id: tournament.id, state: 'processing' }})
    if (processing) {
        return await interaction.editReply({ content: `Error: Processing another API request for this tournament. Please try again shortly.`})
    }
    
    try {
        await tournament.update({ state: 'processing' })
        const success = await axios({
            method: 'delete',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/${team.participantId}.json?api_key=${server.challongeApiKey}`
        })

        if (success) {
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]

                if (tournament.state === 'underway') {
                    await entry.update({
                        isActive: false,
                        roundDropped: await getCurrentRound(server, entry.tournament.id)
                    })

                    if (!team.roundDropped || entry.roundDropped > team.roundDropped) {
                        await team.update({ roundDropped: entry.roundDropped })
                    }
                } else {
                    await entry.destroy()
                }
            }
        
            if (drop) {
                await interaction.editReply({ content: `I removed ${team.name} from ${tournament.name}. Better luck next time! ${tournament.emoji}`})
            } else {
                await interaction.editReply({ content: `${team.name} has been removed from ${tournament.name}. ${tournament.emoji}`})
            }

            if (tournament.state !== 'underway') await team.destroy()
            return
        } else if (!success && drop) {
            return await interaction.editReply({ content: `Hmm... I don't see ${team.name} in the participants list for ${tournament.name}. ${tournament.emoji}`})
        } else if (!success && !drop) {
            return await interaction.editReply({ content: `Could not find ${team.name} in the participants list for ${tournament.name}. ${tournament.emoji}`})
        }
    } catch (err) {
        console.log(err)
        if (drop) {
            return await interaction.editReply({ content: `Hmm... I don't see ${team.name} in the participants list for ${tournament.name}. ${tournament.emoji}`})
        } else {
            return await interaction.editReply({ content: `Could not find ${team.name} in the participants list for ${tournament.name}. ${tournament.emoji}`})
        }
    } finally {
        await tournament.update({ state: initialState })
    }
}

//SEED
export const seed = async (interaction, tournamentId, shuffle = false) => {
    const server = await Server.findOne({ where: { id: interaction.guildId }})
    const tournament = await Tournament.findOne({ where: { id: tournamentId }})

    if (shuffle) {
        try {
            await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/randomize.json?api_key=${server.challongeApiKey}`
            })
            
            interaction.channel.send(`Success! Your seeds 🌱 have been shuffled! 🎲`)
        } catch (err) {
            interaction.channel.send(`Error: Your seeds 🥀 have not been shuffled. 😢`)
        }
    } else {
        interaction.channel.send({ content: `Seeding 🌱 in progress, please wait. 🙏`})

        const entries = await Entry.findAll({ where: { isActive: true, tournamentId: tournament.id } })  
        const serverId = server.hasInternalLadder ? server.id : '414551319031054346'  
        const expEntries = []
        const newbieEntries = []
    
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]
            const playerId = entry.playerId
            const stats = await Stats.findOne({ where: { formatId: tournament.formatId, playerId, serverId }})
            
            if (stats) {
                expEntries.push([entry.participantId, entry.playerName, stats.elo])
            } else {
                newbieEntries.push([entry.participantId, entry.playerName, null])
            }
        }
    
        const seeds = [...expEntries.sort((a, b) => b[2] - a[2]), ...shuffleArray(newbieEntries)]  
        let count = 0
        const results = []
        let e = 0
    
        for (let i = 0; i < seeds.length; i++) {
            const participantId = seeds[i][0]
            const name = seeds[i][1]
    
            try {
                await axios({
                    method: 'put',
                    url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/${participantId}.json?api_key=${server.challongeApiKey}`,
                    data: {
                        participant: {
                            seed: i+1
                        }
                    }
                })
                
                console.log(`${name} is now the ${i+1} seed.`)
                results.push(`${name} is now the ${i+1} seed.`)
                count++
            } catch (err) {
                e++
                if (e >= (seeds.length * 10)) {
                    console.log(`Error: Failed to set ${name} (participantId: ${participantId}) as the ${i+1} seed.`)
                    results.push(`Error: Failed to set ${name} (participantId: ${participantId}) as the ${i+1} seed.`)
                } else {
                    console.log(`Error: Failed to set ${name} (participantId: ${participantId}) as the ${i+1} seed.`)
                    i--
                }
            }
        }
    
        for (let i = 0; i < results.length; i += 30) interaction.channel.send({ content: results.slice(i, i + 30).join('\n').toString()})
        if (count !== seeds.length) interaction.channel.send({ content: `Error seeding 🥀 tournament. Please fix seeds manually if desired. 🤠`})
        return
    }
}


////// TOURNAMENT MANAGEMENT FUNCTIONS ///////

//CHECK PAIRING
export const checkPairing = (match, p1, p2) => (match?.player1_id === p1 && match?.player2_id === p2) || (match?.player1_id === p2 && match?.player2_id === p1)

//FIND NEXT MATCH
export const findNextMatch = (matchesArr = [], matchId, participantId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        // if (match.state === 'complete') continue
        if (match.prerequisite_match_ids_csv.includes(matchId) && (match.player1_id === participantId || match.player2_id === participantId)) {
            if (match.state === 'complete') {
                return findNextMatch(matchesArr, match.id, participantId)
            } else {
                return match.id
            }
        }
    }

    return false
}

//FIND NEXT MATCH
export const findOpenMatch = (matchesArr = [], participantId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.state === 'open' && (match?.player1_id === participantId || match?.player2_id === participantId)) {
            return match
        } else {
            continue
        }
    }

    return false
}

//FIND NEXT OPPONENT
export const findNextOpponent = async (tournamentId, matchesArr = [], matchId, participantId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.id === matchId) {
            const player1_id = match.player1_id
            const player2_id = match.player2_id
            if (player1_id === participantId) {
                if (!player2_id) return false
                const opponentEntry = await Entry.findOne({
                    where: {
                        tournamentId: tournamentId,
                        participantId: player2_id
                    },
                    include: Player
                })

                return opponentEntry
            } else if (player2_id === participantId) {
                if (!player1_id) return false
                const opponentEntry = await Entry.findOne({
                    where: {
                        tournamentId: tournamentId,
                        participantId: player1_id
                    },
                    include: Player
                }) 

                return opponentEntry
            }
        }
    }

    return false
}

//FIND NEXT TEAM
export const findNextTeam = async (tournamentId, matchesArr = [], matchId, participantId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.id === matchId) {
            const player1_id = match.player1_id
            const player2_id = match.player2_id
            if (player1_id === participantId) {
                if (!player2_id) return false
                const team = await Team.findOne({
                    where: {
                        tournamentId: tournamentId,
                        participantId: player2_id
                    }
                })

                return team
            } else if (player2_id === participantId) {
                if (!player1_id) return false
                const team = await Team.findOne({
                    where: {
                        tournamentId: tournamentId,
                        participantId: player1_id
                    }
                }) 

                return team
            }
        }
    }

    return false
}

//FIND NO SHOW OPPONENT
export const findNoShowOpponent = (match, noShowParticipantId) => {
    if (match.player1_id === noShowParticipantId) return match.player2_id
    if (match.player2_id === noShowParticipantId) return match.player1_id
    else return false
}

//FIND OTHER PRE REQ MATCH
export const findOtherPreReqMatch = (matchesArr = [], nextMatchId, completedMatchId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.id === nextMatchId) {
            const pre_reqs = match.prerequisite_match_ids_csv.split(",").map((e) => parseInt(e))
            if (pre_reqs[0] === completedMatchId) {
                const pairing = getPairing(matchesArr, pre_reqs[1])
                return pairing
            } else if (pre_reqs[1] === completedMatchId) {
                const pairing = getPairing(matchesArr, pre_reqs[0])
                return pairing
            } 
            else return false
        }
    }

    return false
}

//GET MATCHES
export const getMatches = async (server, tournamentId, state = 'all', participantId) => {
    let url = `https://api.challonge.com/v1/tournaments/${tournamentId}/matches.json?api_key=${server.challongeApiKey}&state=${state}`
    if (participantId) url += `&participant_id=${participantId}`

    try {
        const { data } = await axios({
            method: 'get',
            url: url
        })
        
        return data
    } catch (err) {
        console.log(err)
        return []
    }
}

//GET CURRENT ROUND 
export const getCurrentRound = async (server, tournamentId) => {
    try {
        const { data } = await axios({
            method: 'get',
            url: `https://api.challonge.com/v1/tournaments/${tournamentId}/matches.json?api_key=${server.challongeApiKey}&state=open`
        })

        return data[0]?.match?.round
    } catch (err) {
        console.log(err)
        return false
    }
}

//GET PARTICIPANTS
export const getParticipants = async (server, tournamentId) => {
    try {
        const { data } = await axios({
            method: 'get',
            url: `https://api.challonge.com/v1/tournaments/${tournamentId}/participants.json?api_key=${server.challongeApiKey}`
        })
        
        return data
    } catch (err) {
        console.log(err)
        return []
    }   
}

//GET TOURNAMENT
export const getTournament = async (server, tournamentId) => {
    try {
        const { data } = await axios({
            method: 'get',
            url: `https://api.challonge.com/v1/tournaments/${tournamentId}.json?api_key=${server.challongeApiKey}`
        })
        
        return data
    } catch (err) {
        console.log(err)
        return []
    }
}

//GET PAIRING
export const getPairing = (matchesArr = [], matchId) => {
    let p1 = null
    let p2 = null

    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.id === matchId) {
            p1 = match.player1_id
            p2 = match.player2_id
            break
        }
    }

    const pairing = {
        p1,
        p2
    }

    return pairing
}

//POST PARTICIPANT
export const postParticipant = async (server, tournament, name) => {
    try {
        const { data } = await axios({
            method: 'post',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeApiKey}`,
            data: {
                participant: {
                    name: name
                }
            }
        })

        return data
    } catch (err) {
        console.log(err)
    }   
}

//PROCESS MATCH RESULT
export const processMatchResult = async (server, interaction, winner, winningPlayer, loser, losingPlayer, tournament, format, noshow = false) => {
    const losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id, tournamentId: tournament.id }, include: Player })
    const winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id, tournamentId: tournament.id }, include: Player })
    
    if (!losingEntry || !winningEntry) {
        interaction.editReply({ content: `Sorry, I could not find your tournament in the database.`})
        return false
    }

    const gameCount = noshow ? [0, 0] : [1, 0]
    if (!gameCount || !gameCount.length) {
        interaction.editReply({ content: `Please specify a valid game count.`})
        return false
    }

    const data = await getMatches(server, tournament.id, 'open', losingEntry.participantId) || []
    let matchId = false
    let scores = false
    const match = data[0].match
 
    if (match && checkPairing(match, losingEntry.participantId, winningEntry.participantId)) {
        matchId = match.id    
        scores = match.player1_id === winningEntry.participantId ? `${gameCount[0]}-${gameCount[1]}` : `${gameCount[1]}-${gameCount[0]}`
    } else {
        interaction.editReply({ content: `Error: could not find open match between ${losingPlayer.name} and ${winningPlayer.name} in ${tournament.name}.`})
        return false
    }

    const processing = await Tournament.count({ where: { id: tournament.id, state: 'processing' }})
    
    if (processing) {
        interaction.editReply({ content: `Error: Processing another API request for this tournament. Please try again shortly.`})
        return false
    }

    let success

    try {
        await tournament.update({ state: 'processing' })
        success = await axios({
            method: 'put',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/matches/${matchId}.json?api_key=${server.challongeApiKey}`,
            data: {
                match: {
                    winner_id: winningEntry.participantId,
                    scores_csv: scores
                }
            }
        })
    } catch (err) {
        console.log(err)
    } finally {
        await tournament.update({ state: 'underway' })
    }

    if (!success) {
        interaction.editReply({ content: `Error: could not update bracket for ${tournament.name}.`})
        return false
    }
 
    losingEntry.losses++
    losingEntry.isActive = true
    await losingEntry.save()
    
    winningEntry.wins++
    winningEntry.isActive = true
    await winningEntry.save()
    
    if (tournament.type === 'single elimination' || tournament.type === 'double elimination') {
        const updatedMatchesArr = await getMatches(server, tournament.id) || []
        const winnerNextMatch = findNextMatch(updatedMatchesArr, matchId, winningEntry.participantId)
        const winnerNextOpponent = winnerNextMatch ? await findNextOpponent(tournament.id, updatedMatchesArr, winnerNextMatch, winningEntry.participantId) : null
        const winnerMatchWaitingOn = winnerNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, winnerNextMatch, matchId) 
        const winnerWaitingOnP1 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: winnerMatchWaitingOn.p1 }, include: Player }) : null
        const winnerWaitingOnP2 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: winnerMatchWaitingOn.p2 }, include: Player }) : null

        const loserEliminated = tournament.type === 'single elimination' ? true :
            tournament.type === 'double elimination' && losingEntry.losses >= 2 ? true :
            false

        if (loserEliminated) {
            const playerId = losingEntry.player.id
            const discordId = losingEntry.player.discordId
            const member = interaction.guild.members.cache.get(discordId)
            losingEntry.isActive = false
            await losingEntry.save()

            const count = await Entry.count({
                where: {
                    playerId: playerId,
                    isActive: true,
                    '$tournament.serverId$': server.id
                },
                include: Tournament
            })

            if (member && !count && server.tournamentRoleId) member.roles.remove(server.tournamentRoleId).catch((err) => console.log(err))
        }

        const loserNextMatch = loserEliminated ? null : findNextMatch(updatedMatchesArr, matchId, losingEntry.participantId)
        const loserNextOpponent = loserNextMatch ? await findNextOpponent(tournament.id, updatedMatchesArr, loserNextMatch, losingEntry.participantId) : null
        const loserMatchWaitingOn = loserNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, loserNextMatch, matchId) 
        const loserWaitingOnP1 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p1 }, include: Player }) : null
        const loserWaitingOnP2 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p2 }, include: Player }) : null

        setTimeout(async () => {
            if (loserEliminated) {
                return await interaction.channel.send({ content: `${losingPlayer.name}, You are eliminated from the tournament. Better luck next time!`})
            } else if (loserNextOpponent) {
                const loserNextOpponentGlobalName = loserNextOpponent.player.globalName
                const loserNextOpponentDiscordName = loserNextOpponent.player.discordName
                try {
                    loser.send(
                        `New pairing for ${tournament.name}! ${tournament.logo}` +
                        `\nServer: ${server.name} ${server.logo}` +
                        `\nChannel: <#${tournament.channelId}>` +
                        `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                        `\nDiscord Name: ${loserNextOpponentGlobalName ? `${loserNextOpponentGlobalName} (${loserNextOpponentDiscordName})` : loserNextOpponentDiscordName}` +
                        `\nDuelingbook Name: ${loserNextOpponent.player.duelingBookName}`
                    )
                } catch (err) {
                    console.log(err)
                }

                try {
                    const member = await interaction.guild?.members.fetch(loserNextOpponent.player.discordId)
                    member.user.send(
                        `New Match for ${tournament.name}! ${tournament.logo}` +
                        `\nServer: ${server.name} ${server.logo}` +
                        `\nChannel: <#${tournament.channelId}>` +
                        `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                        `\nDiscord Name: ${losingPlayer.globalName ? `${losingPlayer.globalName} (${losingPlayer.discordName})` : losingPlayer.discordName}` +
                        `\nDuelingbook Name: ${losingPlayer.duelingBookName}`
                    )
                } catch (err) {
                    console.log(err)
                }

                return await interaction.channel.send(`New Match: <@${losingPlayer.discordId}> (DB: ${losingPlayer.duelingBookName}) vs. <@${loserNextOpponent.player.discordId}> (DB: ${loserNextOpponent.player.duelingBookName}). Good luck to both duelists.`)
            } else if (loserMatchWaitingOn && loserWaitingOnP1 && loserWaitingOnP2) {
                const content = `${losingPlayer.name}, You are waiting for the result of ${loserWaitingOnP1.player.name} (DB: ${loserWaitingOnP1.player.duelingBookName}) vs ${loserWaitingOnP2.player.name} (DB: ${loserWaitingOnP2.player.duelingBookName}).`
                return await interaction.channel.send({ content: content })
            } else {
                return await interaction.channel.send({ content: `${losingPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
            }
        }, 2000)
        
        if (!winnerNextMatch || (winnerNextMatch && loserNextMatch !== winnerNextMatch)) {
            setTimeout(async () => {
                if (!winnerNextMatch) {
                    return await interaction.channel.send({ content: `<@${winningPlayer.discordId}>, You won the tournament! Congratulations on your stellar performance! ${emojis.legend}`})
                } else if (winnerNextOpponent) {
                    try {
                        const name = winnerNextOpponent.player.name
                        const content = 
                            `New Match for ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                            `\nDiscord Name: ${name}` +
                            `\nDuelingbook Name: ${winnerNextOpponent.player.duelingBookName}`
                        winner.send({ content: content })
                    } catch (err) {
                        console.log(err)
                    }

                    try {
                        const member = await interaction.guild?.members.fetch(winnerNextOpponent.player.discordId)
                        const name = winningPlayer.name
                        const content = 
                            `New Match for ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                            `\nDiscord Name: ${name}` +
                            `\nDuelingbook Name: ${winningPlayer.duelingBookName}`
                        member.user.send({ content: content })
                    } catch (err) {
                        console.log(err)
                    }
                    
                    const content = `New Match: <@${winningPlayer.discordId}> (DB: ${winningPlayer.duelingBookName}) vs. <@${winnerNextOpponent.player.discordId}> (DB: ${winnerNextOpponent.player.duelingBookName}). Good luck to both duelists.`
                    return await interaction.channel.send({ content: content })
                } else if (winnerMatchWaitingOn && winnerWaitingOnP1 && winnerWaitingOnP2) {
                    const content = `${winningPlayer.name}, You are waiting for the result of ${winnerWaitingOnP1.player.name} (DB: ${winnerWaitingOnP1.player.duelingBookName}) vs ${winnerWaitingOnP2.player.name} (DB: ${winnerWaitingOnP2.player.duelingBookName}).`
                    return await interaction.channel.send({ content: content})
                } else {
                    return await interaction.channel.send({ content: `${winningPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
                }
            }, 4000)
        }
    }
    
    return match
}

//PROCESS TEAM RESULT
export const processTeamResult = async (server, interaction, winningPlayer, losingPlayer, tournament, format, noshow = false) => {
    const losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id, tournamentId: tournament.id }, include: [Player, Team] })
    const winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id, tournamentId: tournament.id }, include: [Player, Team] })

    if (!losingEntry || !winningEntry) {
        await interaction.editReply({ content: `Sorry, I could not find your tournament in the database.`})
        return false
    }

    if (losingEntry.slot !== winningEntry.slot) {
        await interaction.editReply({ content: `Sorry, ${losingEntry.playerName} (Player ${losingEntry.slot}) and ${winningEntry.playerName} (Player ${winningEntry.slot}) are not paired for ${tournament.name}.`})
        return false
    }

    const losingTeam = losingEntry.team
    const winningTeam = winningEntry.team

    await losingTeam.update({ matchLosses: losingTeam.matchLosses + 1 })
    await winningTeam.update({ matchWins: winningTeam.matchWins + 1 })
    const margin = `${winningTeam.matchWins}-${winningTeam.matchLosses}`

    const losingEntries = await Entry.findAll({
        where: {
            tournamentId: tournament.id,
            teamId: losingTeam.id
        },
        include: Player
    })


    const data = await getMatches(server, tournament.id, 'open', losingEntry.participantId) || []
    let matchId = false
    let scores = false
    const match = data[0].match
 
    if (match && checkPairing(match, losingEntry.participantId, winningEntry.participantId)) {
        matchId = match.id    
        scores =  match.player1_id === winningEntry.participantId ? 
            `${winningTeam.matchWins}-${winningTeam.matchLosses}` : 
            `${winningTeam.matchLosses}-${winningTeam.matchWins}`
    } else {
        interaction.editReply({ content: `Error: could not find open match between ${losingTeam.name} and ${winningTeam.name} in ${tournament.name}.`})
        return false
    }

    const processing = await Tournament.count({ where: { id: tournament.id, state: 'processing' }})
    
    if (processing) {
        interaction.editReply({ content: `Error: Processing another API request for this tournament. Please try again shortly.`})
        return false
    }

    let success

    if (winningTeam.matchWins >= 2) {
        try {
            await tournament.update({ state: 'processing' })
            success = await axios({
                method: 'put',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}/matches/${matchId}.json?api_key=${server.challongeApiKey}`,
                data: {
                    match: {
                        winner_id: winningEntry.participantId,
                        scores_csv: scores
                    }
                }
            })

            await losingTeam.update({
                matchWins: 0,
                matchLosses: 0,
                teamLosses: losingTeam.teamLosses + 1
            })

            await winningTeam.update({
                matchWins: 0,
                matchLosses: 0,
                teamWins: winningTeam.teamWins + 1
            })
        } catch (err) {
            console.log(err)
        } finally {
            await tournament.update({ state: 'underway' })
        }
        
        if (!success) {
            await interaction.editReply({ content: `Error: could not update bracket for ${tournament.name}.`})
            return false
        } else {
            await interaction.channel.send({ content: `Congrats! ${winningTeam.name} has defeated ${losingTeam.name} by a score of ${margin}!`})
            await interaction.channel.send({ content: `${emojis.koolaid}  ${emojis.dj}  ${emojis.cavebob}`})
        }

        if (tournament.type === 'single elimination' || tournament.type === 'double elimination') {
            const updatedMatchesArr = await getMatches(server, tournament.id) || []
            const winnerNextMatch = findNextMatch(updatedMatchesArr, matchId, winningEntry.participantId)
            const winnerNextTeam = winnerNextMatch ? await findNextTeam(tournament.id, updatedMatchesArr, winnerNextMatch, winningEntry.participantId) : null
            const winnerMatchWaitingOn = winnerNextTeam ? null : findOtherPreReqMatch(updatedMatchesArr, winnerNextMatch, matchId) 
            const winnerWaitingOnTeam1 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Team.findOne({ where: { tournamentId: tournament.id, participantId: winnerMatchWaitingOn.p1 } }) : null
            const winnerWaitingOnTeam2 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Team.findOne({ where: { tournamentId: tournament.id, participantId: winnerMatchWaitingOn.p2 } }) : null

            const loserEliminated = tournament.type === 'single elimination' ? true :
                tournament.type === 'double elimination' && losingTeam.teamLosses >= 2 ? true :
                false

            if (loserEliminated) {
                for (let i = 0; i < losingEntries.length; i++) {
                    const playerId = losingEntries[i].playerId
                    const discordId = losingEntries[i].player.discordId
                    const member = interaction.guild.members.cache.get(discordId)
                    await losingEntries[i].update({ isActive: false})
    
                    const count = await Entry.count({
                        where: {
                            playerId: playerId,
                            isActive: true,
                            '$tournament.serverId$': server.id
                        },
                        include: Tournament
                    })
    
                    if (member && !count && server.tournamentRoleId) member.roles.remove(server.tournamentRoleId).catch((err) => console.log(err))
                }
            }

            const loserNextMatch = loserEliminated ? null : findNextMatch(updatedMatchesArr, matchId, losingEntry.participantId)
            const loserNextTeam = loserNextMatch ? await findNextTeam(tournament.id, updatedMatchesArr, loserNextMatch, losingEntry.participantId) : null
            const loserMatchWaitingOn = loserNextTeam ? null : findOtherPreReqMatch(updatedMatchesArr, loserNextMatch, matchId) 
            const loserWaitingOnTeam1 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Team.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p1 } }) : null
            const loserWaitingOnTeam2 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Team.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p2 } }) : null

            setTimeout(async () => {
                if (loserEliminated) {
                    return await interaction.channel.send({ content: `${losingTeam.name}, You are eliminated from the tournament. Better luck next time!`})
                } else if (loserNextTeam) {
                    const round = tournament.type === 'double elimination' && loserNextMatch.round < 0 ? `Losers Round ${Math.abs(loserNextMatch.round)}` :
                        tournament.type === 'double elimination' && loserNextMatch.round > 0 ? `Winners Round ${Math.abs(loserNextMatch.round)}` :
                        `Round ${loserNextMatch.round}`

                    const entryA1 = await Entry.findOne({ where: { teamId: losingTeam.id, tournamentId: tournament.id, slot: {[Op.or]: ['A', 'Goat']}}, include: Player })
                    const entryA2 = await Entry.findOne({ where: { teamId: loserNextTeam.id, tournamentId: tournament.id, slot: {[Op.or]: ['A', 'Goat']}}, include: Player})
                    const playerA1 = entryA1?.player
                    const playerA2 = entryA2?.player

                    try {
                        const pA1Member = await interaction.guild?.members.fetch(playerA1.discordId)
                        const pA2DiscordUsername =  playerA2.discordName
                        pA1Member.user.send(
                            `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName || 'Goat <:bluesheep:646866933605466131>'} ${tournament.emoji}` +
                            `\nDiscord Name: ${playerA2.globalName ? `${playerA2.globalName} (${pA2DiscordUsername})` : pA2DiscordUsername}` +
                            `\nDuelingbook Name: ${playerA2.duelingBookName}`
                        )
                    } catch (err) {
                        console.log(err)
                    }

                    try {
                        const pA2Member = await interaction.guild?.members.fetch(playerA2.discordId)
                        const pA1DiscordUsername = playerA1.discordName
                        pA2Member.user.send(
                            `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName || 'Goat <:bluesheep:646866933605466131>'} ${tournament.emoji}` +
                            `\nDiscord Name: ${playerA1.globalName ? `${playerA1.globalName} (${pA1DiscordUsername})` : pA1DiscordUsername}` +
                            `\nDuelingbook Name: ${playerA1.duelingBookName}`
                        )
                    } catch (err) {
                        console.log(err)
                    }

                    const entryB1 = await Entry.findOne({ where: { teamId: losingTeam.id, tournamentId: tournament.id, slot: {[Op.or]: ['B', 'Edison']}}, include: Player})
                    const entryB2 = await Entry.findOne({ where: { teamId: loserNextTeam.id, tournamentId: tournament.id, slot: {[Op.or]: ['B', 'Edison']}}, include: Player})
                    const playerB1 = entryB1?.player
                    const playerB2 = entryB2?.player

                    try {
                        const pB1Member = await interaction.guild?.members.fetch(playerB1.discordId)
                        const pB2DiscordUsername = playerB2.discordName
                        pB1Member.user.send(
                            `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName || 'Edison <:dandy:647150339388211201>'} ${tournament.emoji}` +
                            `\nDiscord Name: ${playerB2.globalName ? `${playerB2.globalName} (${pB2DiscordUsername})` : pB2DiscordUsername}` +
                            `\nDuelingbook Name: ${playerB2.duelingBookName}`
                        )
                    } catch (err) {
                        console.log(err)
                    }

                    try {
                        const pB2Member = await interaction.guild?.members.fetch(playerB2.discordId)
                        const pB1DiscordUsername = playerB1.discordName
                        pB2Member.user.send(
                            `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName || 'Edison <:dandy:647150339388211201>'} ${tournament.emoji}` +
                            `\nDiscord Name: ${playerB1.globalName ? `${playerB1.globalName} (${pB1DiscordUsername})` : pB1DiscordUsername}` +
                            `\nDuelingbook Name: ${playerB1.duelingBookName}`
                        )
                    } catch (err) {
                        console.log(err)
                    }

                    const entryC1 = await Entry.findOne({ where: { teamId: losingTeam.id, tournamentId: tournament.id, slot: {[Op.or]: ['C', 'Tengu Plant']}}, include: Player})
                    const entryC2 = await Entry.findOne({ where: { teamId: loserNextTeam.id, tournamentId: tournament.id, slot: {[Op.or]: ['C', 'Tengu Plant']}}, include: Player})
                    const playerC1 = entryC1?.player
                    const playerC2 = entryC2?.player

                    try {
                        const pC1Member = await interaction.guild?.members.fetch(playerC1.discordId)
                        const pC2DiscordUsername = playerC2.discordName
                        pC1Member.user.send(
                            `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName || 'Tengu Plant <:spore:647198947185524746>'} ${tournament.emoji}` +
                            `\nDiscord Name: ${playerC2.globalName ? `${playerC2.globalName} (${pC2DiscordUsername})` : pC2DiscordUsername}` +
                            `\nDuelingbook Name: ${playerC2.duelingBookName}`
                        )
                    } catch (err) {
                        console.log(err)
                    }

                    try {
                        const pC2Member = await interaction.guild?.members.fetch(playerC2.discordId)
                        const pC1DiscordUsername = playerC1.discordName
                        pC2Member.user.send(
                            `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName || 'Tengu Plant <:spore:647198947185524746>'} ${tournament.emoji}` +
                            `\nDiscord Name: ${playerC1.globalName ? `${playerC1.globalName} (${pC1DiscordUsername})` : pC1DiscordUsername}` +
                            `\nDuelingbook Name: ${playerC1.duelingBookName}`
                        )
                    } catch (err) {
                        console.log(err)
                    }

                    const [labelA, labelB, labelC] = tournament.formatId ? ['Duel A', 'Duel B', 'Duel C'] : ['Goat <:bluesheep:646866933605466131>', 'Edison <:dandy:647150339388211201>', 'Tengu Plant <:spore:647198947185524746>']

                    await interaction.channel.send({ 
                        content: `New Team Match: ${losingTeam.name} vs. ${loserNextTeam.name}. Good luck to both teams.` + 
                            `\n${labelA}: <@${playerA1.discordId}> vs <@${playerA2.discordId}>`+ 
                            `\n${labelB}: <@${playerB1.discordId}> vs <@${playerB2.discordId}>`+ 
                            `\n${labelC}: <@${playerC1.discordId}> vs <@${playerC2.discordId}>`
                    })
                } else if (loserMatchWaitingOn && loserWaitingOnTeam1 && loserWaitingOnTeam2) {
                    return await interaction.channel.send({ content: `${losingTeam.name}, You are waiting for the result of ${loserWaitingOnTeam1.name} vs ${loserWaitingOnTeam2.name}.`})
                } else {
                    return await interaction.channel.send({ content: `${losingTeam.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
                }
            }, 2000)
        
            if (!winnerNextMatch || (winnerNextMatch && loserNextMatch !== winnerNextMatch)) {
                setTimeout(async () => {
                    if (!winnerNextMatch) {
                        return await interaction.channel.send({ content: `${winningTeam.name}, You won the tournament! Congratulations on your stellar performance! ${emojis.legend}`})
                    } else if (winnerNextTeam) {
                        const round = tournament.type === 'double elimination' && winnerNextMatch.round < 0 ? `Losers Round ${Math.abs(winnerNextMatch.round)}` :
                            tournament.type === 'double elimination' && winnerNextMatch.round > 0 ? `Winners Round ${Math.abs(winnerNextMatch.round)}` :
                            `Round ${winnerNextMatch.round}`
    
                        const entryA1 = await Entry.findOne({ where: { teamId: winningTeam.id, tournamentId: tournament.id, slot: {[Op.or]: ['A', 'Goat']}}, include: Player })
                        const entryA2 = await Entry.findOne({ where: { teamId: winnerNextTeam.id, tournamentId: tournament.id, slot: {[Op.or]: ['A', 'Goat']}}, include: Player})
                        const playerA1 = entryA1?.player
                        const playerA2 = entryA2?.player
    
                        try {
                            const pA1Member = await interaction.guild?.members.fetch(playerA1.discordId)
                            const pA2DiscordUsername = playerA2.discordName
                            pA1Member.user.send(
                                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                                `\nServer: ${server.name} ${server.logo}` +
                                `\nChannel: <#${tournament.channelId}>` +
                                `\nFormat: ${tournament.formatName || 'Goat <:bluesheep:646866933605466131>'} ${tournament.emoji}` +
                                `\nDiscord Name: ${playerA2.globalName ? `${playerA2.globalName} (${pA2DiscordUsername})` : pA2DiscordUsername}` +
                                `\nDuelingbook Name: ${playerA2.duelingBookName}`
                            )
                        } catch (err) {
                            console.log(err)
                        }
    
                        try {
                            const pA2Member = await interaction.guild?.members.fetch(playerA2.discordId)
                            const pA1DiscordUsername = playerA1.discordName
                            pA2Member.user.send(
                                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                                `\nServer: ${server.name} ${server.logo}` +
                                `\nChannel: <#${tournament.channelId}>` +
                                `\nFormat: ${tournament.formatName || 'Goat <:bluesheep:646866933605466131>'} ${tournament.emoji}` +
                                `\nDiscord Name: ${playerA1.globalName ? `${playerA1.globalName} (${pA1DiscordUsername})` : pA1DiscordUsername}` +
                                `\nDuelingbook Name: ${playerA1.duelingBookName}`
                            )
                        } catch (err) {
                            console.log(err)
                        }

                        const entryB1 = await Entry.findOne({ where: { teamId: winningTeam.id, tournamentId: tournament.id, slot: {[Op.or]: ['B', 'Edison']}}, include: Player})
                        const entryB2 = await Entry.findOne({ where: { teamId: winnerNextTeam.id, tournamentId: tournament.id, slot: {[Op.or]: ['B', 'Edison']}}, include: Player})
                        const playerB1 = entryB1?.player
                        const playerB2 = entryB2?.player
    
                        try {
                            const pB1Member = await interaction.guild?.members.fetch(playerB1.discordId)
                            const pB2DiscordUsername = playerB2.discordName
                            pB1Member.user.send(
                                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                                `\nServer: ${server.name} ${server.logo}` +
                                `\nChannel: <#${tournament.channelId}>` +
                                `\nFormat: ${tournament.formatName || 'Edison <:dandy:647150339388211201>'} ${tournament.emoji}` +
                                `\nDiscord Name: ${playerB2.globalName ? `${playerB2.globalName} (${pB2DiscordUsername})` : pB2DiscordUsername}` +
                                `\nDuelingbook Name: ${playerB2.duelingBookName}`
                            )
                        } catch (err) {
                            console.log(err)
                        }
    
                        try {
                            const pB2Member = await interaction.guild?.members.fetch(playerB2.discordId)
                            const pB1DiscordUsername = playerB1.discordName
                            pB2Member.user.send(
                                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                                `\nServer: ${server.name} ${server.logo}` +
                                `\nChannel: <#${tournament.channelId}>` +
                                `\nFormat: ${tournament.formatName || 'Edison <:dandy:647150339388211201>'} ${tournament.emoji}` +
                                `\nDiscord Name: ${playerB1.globalName ? `${playerB1.globalName} (${pB1DiscordUsername})` : pB1DiscordUsername}` +
                                `\nDuelingbook Name: ${playerB1.duelingBookName}`
                            )
                        } catch (err) {
                            console.log(err)
                        }

                        const entryC1 = await Entry.findOne({ where: { teamId: winningTeam.id, tournamentId: tournament.id, slot: {[Op.or]: ['C', 'Tengu Plant']}}, include: Player})
                        const entryC2 = await Entry.findOne({ where: { teamId: winnerNextTeam.id, tournamentId: tournament.id, slot: {[Op.or]: ['C', 'Tengu Plant']}}, include: Player})
                        const playerC1 = entryC1?.player
                        const playerC2 = entryC2?.player
    
                        try {
                            const pC1Member = await interaction.guild?.members.fetch(playerC1.discordId)
                            const pC2DiscordUsername = playerC2.discordName
                            pC1Member.user.send(
                                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                                `\nServer: ${server.name} ${server.logo}` +
                                `\nChannel: <#${tournament.channelId}>` +
                                `\nFormat: ${tournament.formatName || 'Tengu Plant <:spore:647198947185524746>'} ${tournament.emoji}` +
                                `\nDiscord Name: ${playerC2.globalName ? `${playerC2.globalName} (${pC2DiscordUsername})` : pC2DiscordUsername}` +
                                `\nDuelingbook Name: ${playerC2.duelingBookName}`
                            )
                        } catch (err) {
                            console.log(err)
                        }
    
                        try {
                            const pC2Member = await interaction.guild?.members.fetch(playerC2.discordId)
                            const pC1DiscordUsername = playerC1.discordName
                            pC2Member.user.send(
                                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                                `\nServer: ${server.name} ${server.logo}` +
                                `\nChannel: <#${tournament.channelId}>` +
                                `\nFormat: ${tournament.formatName || 'Tengu Plant <:spore:647198947185524746>'} ${tournament.emoji}` +
                                `\nDiscord Name: ${playerC1.globalName ? `${playerC1.globalName} (${pC1DiscordUsername})` : pC1DiscordUsername}` +
                                `\nDuelingbook Name: ${playerC1.duelingBookName}`
                            )
                        } catch (err) {
                            console.log(err)
                        }

                        const [labelA, labelB, labelC] = tournament.formatId ? ['Duel A', 'Duel B', 'Duel C'] : ['Goat <:bluesheep:646866933605466131>', 'Edison <:dandy:647150339388211201>', 'Tengu Plant <:spore:647198947185524746>']

                        await interaction.channel.send({
                            content: `New Team Match: ${winningTeam.name} vs. ${winnerNextTeam.name}. Good luck to both teams.` + 
                                `\n${labelA}: <@${playerA1.discordId}> vs <@${playerA2.discordId}>`+ 
                                `\n${labelB}: <@${playerB1.discordId}> vs <@${playerB2.discordId}>`+ 
                                `\n${labelC}: <@${playerC1.discordId}> vs <@${playerC2.discordId}>`
                        })
                    } else if (winnerMatchWaitingOn && winnerWaitingOnTeam1 && winnerWaitingOnTeam2) {
                        return await interaction.channel.send({ content: `${winningTeam.name}, You are waiting for the result of ${winnerWaitingOnTeam1.name} vs ${winnerWaitingOnTeam2.name}.`})
                    } else {
                        return await interaction.channel.send({ content: `${winningTeam.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
                    }
                }, 4000)
            }
        }
    }

    await losingEntry.update({ losses: losingEntry.losses + 1 })
    await winningEntry.update({ wins: winningEntry.wins + 1 })   
    return match
}

//SEND TEAM PAIRINGS
export const sendTeamPairings = async (guild, server, tournament, ignoreRound1) => {
    const matches = [...await getMatches(server, tournament.id)].map((el) => el.match).filter((match) => match.state === 'open')
    
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i]
        if (ignoreRound1 && match.round === 1) continue
        const round = tournament.type === 'double elimination' && match.round < 0 ? `Losers Round ${Math.abs(match.round)}` :
            tournament.type === 'double elimination' && match.round > 0 ? `Winners Round ${Math.abs(match.round)}` :
            `Round ${match.round}`
  
        const entryA1 = await Entry.findOne({ where: { participantId: match.player1_id, tournamentId: tournament.id, slot: {[Op.or]: ['A', 'Goat']}}, include: Player })
        const entryA2 = await Entry.findOne({ where: { participantId: match.player2_id, tournamentId: tournament.id, slot: {[Op.or]: ['A', 'Goat']}}, include: Player })
        const playerA1 = entryA1?.player
        const playerA2 = entryA2?.player

        try {
            const pA1Member = await guild.members.fetch(playerA1.discordId)
            const pA2DiscordUsername = playerA2.discordName
            pA1Member.user.send(
                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${tournament.channelId}>` +
                `\nFormat: ${tournament.formatName || 'Goat <:bluesheep:646866933605466131>'} ${tournament.emoji}` +
                `\nDiscord Name: ${playerA2.globalName ? `${playerA2.globalName} (${pA2DiscordUsername})` : pA2DiscordUsername}` +
                `\nDuelingbook Name: ${playerA2.duelingBookName}`
            )
        } catch (err) {
            console.log(err)
        }

        try {
            const pA2Member = await guild.members.fetch(playerA2.discordId)
            const pA1DiscordUsername = playerA1.discordName
            pA2Member.user.send(
                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${tournament.channelId}>` +
                `\nFormat: ${tournament.formatName || 'Goat <:bluesheep:646866933605466131>'} ${tournament.emoji}` +
                `\nDiscord Name: ${playerA1.globalName ? `${playerA1.globalName} (${pA1DiscordUsername})` : pA1DiscordUsername}` +
                `\nDuelingbook Name: ${playerA1.duelingBookName}`
            )
        } catch (err) {
            console.log(err)
        }

        const entryB1 = await Entry.findOne({ where: { participantId: match.player1_id, tournamentId: tournament.id, slot: {[Op.or]: ['B', 'Edison']}}, include: Player })
        const entryB2 = await Entry.findOne({ where: { participantId: match.player2_id, tournamentId: tournament.id, slot: {[Op.or]: ['B', 'Edison']}}, include: Player })
        const playerB1 = entryB1?.player
        const playerB2 = entryB2?.player

        try {
            const pB1Member = await guild.members.fetch(playerB1.discordId)
            const pB2DiscordUsername = playerB2.discordName
            pB1Member.user.send(
                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${tournament.channelId}>` +
                `\nFormat: ${tournament.formatName || 'Edison <:dandy:647150339388211201>'} ${tournament.emoji}` +
                `\nDiscord Name: ${playerB2.globalName ? `${playerB2.globalName} (${pB2DiscordUsername})` : pB2DiscordUsername}` +
                `\nDuelingbook Name: ${playerB2.duelingBookName}`
            )
        } catch (err) {
            console.log(err)
        }

        try {
            const pB2Member = await guild.members.fetch(playerB2.discordId)
            const pB1DiscordUsername = playerB1.discordName
            pB2Member.user.send(
                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${tournament.channelId}>` +
                `\nFormat: ${tournament.formatName || 'Edison <:dandy:647150339388211201>'} ${tournament.emoji}` +
                `\nDiscord Name: ${playerB1.globalName ? `${playerB1.globalName} (${pB1DiscordUsername})` : pB1DiscordUsername}` +
                `\nDuelingbook Name: ${playerB1.duelingBookName}`
            )
        } catch (err) {
            console.log(err)
        }

        const entryC1 = await Entry.findOne({ where: { participantId: match.player1_id, tournamentId: tournament.id, slot: {[Op.or]: ['C', 'Tengu Plant']}}, include: Player })
        const entryC2 = await Entry.findOne({ where: { participantId: match.player2_id, tournamentId: tournament.id, slot: {[Op.or]: ['C', 'Tengu Plant']}}, include: Player })
        const playerC1 = entryC1?.player
        const playerC2 = entryC2?.player

        try {
            const pC1Member = await guild.members.fetch(playerC1.discordId)
            const pC2DiscordUsername = playerC2.discordName
            pC1Member.user.send(
                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${tournament.channelId}>` +
                `\nFormat: ${tournament.formatName || 'Tengu Plant <:spore:647198947185524746>'} ${tournament.emoji}` +
                `\nDiscord Name: ${playerC2.globalName ? `${playerC2.globalName} (${pC2DiscordUsername})` : pC2DiscordUsername}` +
                `\nDuelingbook Name: ${playerC2.duelingBookName}`
            )
        } catch (err) {
            console.log(err)
        }

        try {
            const pC2Member = await guild.members.fetch(playerC2.discordId)
            const pC1DiscordUsername = playerC1.discordName
            pC2Member.user.send(
                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${tournament.channelId}>` +
                `\nFormat: ${tournament.formatName || 'Tengu Plant <:spore:647198947185524746>'} ${tournament.emoji}` +
                `\nDiscord Name: ${playerC1.globalName ? `${playerC1.globalName} (${pC1DiscordUsername})` : pC1DiscordUsername}` +
                `\nDuelingbook Name: ${playerC1.duelingBookName}`
            )
        } catch (err) {
            console.log(err)
        }
    }      
}

// SEND PAIRINGS
export const sendPairings = async (guild, server, tournament, ignoreRound1) => {
    const openMatches = [...await getMatches(server, tournament.id)].map((el) => el.match).filter((match) => match.state === 'open')
    const participantIds = []
    const firstOpenMatchFound = openMatches[0]

    const round = tournament.type === 'double elimination' && firstOpenMatchFound.round < 0 ? `Losers Round ${Math.abs(firstOpenMatchFound.round)}` :
            tournament.type === 'double elimination' && firstOpenMatchFound.round > 0 ? `Winners Round ${Math.abs(firstOpenMatchFound.round)}` :
            `Round ${firstOpenMatchFound.round}`
            
    for (let i = 0; i < openMatches.length; i++) {
        const match = openMatches[i]
        participantIds.push(match.player1_id, match.player2_id)
        if (ignoreRound1 && match.round === 1) continue
        
        try {
            const { player: player1 } = await Entry.findOne({
                where: {
                    tournamentId: tournament.id,
                    participantId: match.player1_id
                },
                include: Player
            })
    
            const { player: player2 } = await Entry.findOne({
                where: {
                    tournamentId: tournament.id,
                    participantId: match.player2_id
                },
                include: Player
            })
    
            try {
                const p1Member = await guild.members.fetch(player1.discordId)
                const p2DiscordUsername = player2.discordName
                p1Member.user.send(
                    `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                    `\nServer: ${server.name} ${server.logo}` +
                    `\nChannel: <#${tournament.channelId}>` +
                    `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                    `\nDiscord Name: ${player2.globalName ? `${player2.globalName} (${p2DiscordUsername})` : p2DiscordUsername}` +
                    `\nDuelingbook Name: ${player2.duelingBookName}`
                )
            } catch (err) {
                console.log(err)
            }
    
            try {
                const p2Member = await guild.members.fetch(player2.discordId)
                const p1DiscordUsername = player1.discordName
                p2Member.user.send(
                    `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                    `\nServer: ${server.name} ${server.logo}` +
                    `\nChannel: <#${tournament.channelId}>` +
                    `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                    `\nDiscord Name: ${player1.globalName ? `${player1.globalName} (${p1DiscordUsername})` : p1DiscordUsername}` +
                    `\nDuelingbook Name: ${player1.duelingBookName}`
                )
            } catch (err) {
                console.log(err)
            }
        } catch (err) {
            console.log(err)
        }
    }

    if (tournament.type === 'swiss') {
        const completedMatches = [...await getMatches(server, tournament.id)].map((el) => el.match).filter((match) => match.round === firstOpenMatchFound.round && match.state === 'complete')

        for (let i = 0; i < completedMatches.length; i++) {
            const match = completedMatches[i]
            participantIds.push(match.player1_id, match.player2_id)
        }

        const playersWithByes = [...await Entry.findAll({
            where: {
                tournamentId: tournament.id,
                isActive: true
            },
            include: Player
        })].filter((e) => !participantIds.includes(e.participantId)).map((e) => e.player)

        // SEND MESSAGE TO INFORM PLAYERS THEY HAVE A BYE
        for (let i = 0; i < playersWithByes.length; i++) {
            const player = playersWithByes[i]

            try {
                const member = await guild.members.fetch(player.discordId)

                member.user.send(
                    `Congrats! ${emojis.casablanca} You have a Bye for ${round} of ${tournament.name}! ${tournament.logo}` +
                    `\nServer: ${server.name} ${server.logo}` +
                    `\nChannel: <#${tournament.channelId}>` +
                    `\nFormat: ${tournament.formatName} ${tournament.emoji}`
                )
            } catch (err) {
                console.log(err)
            }        
        }
    }
}

// CALCULATE STANDINGS 
export const calculateStandings = async (tournament, matches, participants) => {
    if (tournament.type !== 'swiss') return null
    const data = {}
    let currentRound = 1

    const camelizeTieBreaker = (str) => {
        return str === 'median buchholz' ? 'medianBuchholz' :
            str === 'match wins vs tied' ? 'winsVsTied' :
            str === 'points difference' ? 'pointsDifference' :
            str === 'opponents win percentage' ? 'opponentsWinPercentage' :
            str === 'opponents opponents win percentage' ? 'opponentsOpponentWinPercentage' :
            ''
    }

    const tieBreaker1 = camelizeTieBreaker(tournament.tieBreaker1)
    const tieBreaker2 = camelizeTieBreaker(tournament.tieBreaker2)
    const tieBreaker3 = camelizeTieBreaker(tournament.tieBreaker3)

    for (let i = 0; i < participants.length; i++) {
        const p = participants[i]

        const entry = await Entry.findOne({
            where: {
                participantId: p.participant.id
            }
        })

        if (!entry) {
            console.log(`no entry:`, p.participant?.name)
            data[p.participant.id] = {
                participantId: p.participant.id,
                name: p.participant.name,
                rank: '',
                wins: 0,
                losses: 0,
                ties: 0,
                byes: 0,
                score: 0,
                topCutResult: 0,
                isActive: p.participant.active,
                roundDropped: null,
                roundsWithoutBye: [],
                opponents: [],
                opponentScores: [],
                opponentWins: [],
                opponentLosses: [],
                opponentTies: [],
                defeated: [],
                winsVsTied: 0,
                rawBuchholz: 0,
                medianBuchholz: 0,
                pointsDifference: 0,
                opponentsWinPercentage: 0,
                opponentsOpponentWinPercentage: 0
            }
        } else {
            data[p.participant.id] = {
                participantId: p.participant.id,
                name: entry.playerName,
                rank: '',
                wins: 0,
                losses: 0,
                ties: 0,
                byes: 0,
                score: 0,
                topCutResult: 0,
                isActive: entry.isActive,
                roundDropped: entry.roundDropped,
                roundsWithoutBye: [],
                opponents: [],
                opponentScores: [],
                opponentWins: [],
                opponentLosses: [],
                opponentTies: [],
                defeated: [],
                winsVsTied: 0,
                rawBuchholz: 0,
                medianBuchholz: 0,
                pointsDifference: 0,
                opponentsWinTotal: 0,
                opponentsLossTotal: 0,
                opponentsOpponentWinTotal: 0,
                opponentsOpponentLossTotal: 0,
                opponentsWinPercentage: 0,
                opponentsOpponentWinPercentage: 0
            }
        }
    }

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i].match
        if (match.state === 'pending') continue
        const round = parseInt(match.round)
        if (round > currentRound) currentRound = round

        if (match.state === 'open') {
            data[match.player1_id].roundsWithoutBye.push(round)
            data[match.player2_id].roundsWithoutBye.push(round)
        } else if (match.state === 'complete' && match.winner_id && match.loser_id) {
            data[match.winner_id].wins++
            data[match.winner_id].defeated.push(match.loser_id)
            data[match.winner_id].opponents.push(match.loser_id)
            data[match.winner_id].roundsWithoutBye.push(round)
            data[match.loser_id].pointsDifference++
            data[match.loser_id].losses++
            data[match.loser_id].opponents.push(match.winner_id)
            data[match.loser_id].roundsWithoutBye.push(round)
            data[match.loser_id].pointsDifference-=1
        } else if (match.state === 'complete') {
            // The following if-statement addresses a duplicate pairing bug introduced to challonge.com in March 2024
            if (
                data[match.player1_id].opponents.includes(match.player2_id) || 
                data[match.player2_id].opponents.includes(match.player1_id)
            ) continue

            data[match.player1_id].ties++
            data[match.player1_id].opponents.push(match.player2_id)
            data[match.player1_id].roundsWithoutBye.push(round)
            data[match.player2_id].ties++
            data[match.player2_id].opponents.push(match.player1_id)
            data[match.player2_id].roundsWithoutBye.push(round)
        }
    }
    
    const keys = Object.keys(data)

    keys.forEach((k) => {
        for (let j = 1; j <= currentRound; j++) {
            if (!data[k].roundsWithoutBye.includes(j) && (data[k].isActive || data[k].roundDropped > j)) {
                data[k].byes++
                // This would add a tiebreaker penalty for byes:
                // data[k].opponentScores.push(0)
                // data[k].opponentWins.push(0)
                // data[k].opponentLosses.push(currentRound)
            }
        }
    })

    keys.forEach((k) => {
        data[k].score = (data[k].wins * tournament.pointsPerMatchWin) + (data[k].ties * tournament.pointsPerMatchTie) + (data[k].byes * tournament.pointsPerBye)
    })

    keys.forEach((k) => {
        for (let i = 0; i < data[k].opponents.length; i++) {
            const opponentId = data[k].opponents[i]
            data[k].opponentScores.push(data[opponentId].score)
            data[k].opponentWins.push(data[opponentId].wins)
            data[k].opponentLosses.push(data[opponentId].losses)
            data[k].opponentTies.push(data[opponentId].ties)
        }

        for (let i = 0; i < data[k].defeated.length; i++) {
            const opponentId = data[k].defeated[i]
            if (data[opponentId].score === data[k].score) data[k].winsVsTied++
        }

        const arr = [...data[k].opponentScores.sort()]
        arr.shift()
        arr.pop()
        data[k].rawBuchholz = data[k].opponentScores.reduce((accum, val) => accum + val, 0)
        data[k].medianBuchholz = arr.reduce((accum, val) => accum + val, 0)
        data[k].opponentsWinTotal = data[k].opponentWins.reduce((accum, val) => accum + val, 0)
        data[k].opponentsLossTotal = data[k].opponentLosses.reduce((accum, val) => accum + val, 0)
        data[k].opponentsWinPercentage = data[k].opponentsWinTotal / (data[k].opponentsWinTotal + data[k].opponentsLossTotal)
    })

    keys.forEach((k) => {
        for (let i = 0; i < data[k].opponents.length; i++) {
            const opponentId = data[k].opponents[i]
            data[k].opponentsOpponentWinTotal += data[opponentId].opponentsWinTotal
            data[k].opponentsOpponentLossTotal += data[opponentId].opponentsLossTotal
        }

        data[k].opponentsOpponentWinPercentage = data[k].opponentsOpponentWinTotal / (data[k].opponentsOpponentWinTotal + data[k].opponentsOpponentLossTotal)
    })

    const standings = shuffleArray(Object.values(data)).sort((a, b) => {
        if (a.topCutResult > b.topCutResult) {
            return -1
        } if (a.score > b.score) {
            return -1
        } else if (a.score < b.score) {
            return 1
        } else if (a[tieBreaker1] > b[tieBreaker1]) {
            return -1
        } else if (a[tieBreaker1] < b[tieBreaker1]) {
            return 1
        } else if (a[tieBreaker2] > b[tieBreaker2]) {
            return -1
        } else if (a[tieBreaker2] < b[tieBreaker2]) {
            return 1
        } else if (a[tieBreaker3] > b[tieBreaker3]) {
            return -1
        } else if (a[tieBreaker3] < b[tieBreaker3]) {
            return 1
        } else {
            return 0
        }
    })

    for (let index = 0; index < standings.length; index++) {
        const s = standings[index]
        if (!s) continue
        if (
            (
                // if at the end or has a better score/tie-breakers than the next player
                index + 1 === standings.length || (
                    s.score > standings[index + 1].score || 
                    s.score === standings[index + 1].score && s[tieBreaker1] > standings[index + 1][tieBreaker1] || 
                    s.score === standings[index + 1].score && s[tieBreaker1] === standings[index + 1][tieBreaker1] && s[tieBreaker2] > standings[index + 1][tieBreaker2] || 
                    s.score === standings[index + 1].score && s[tieBreaker1] === standings[index + 1][tieBreaker1] && s[tieBreaker2] === standings[index + 1][tieBreaker2] && s[tieBreaker3] > standings[index + 1][tieBreaker3]
                )
            ) && (
                // and at the beginning or not tied with the previous player
                index === 0 || (
                    s.score !== standings[index - 1].score ||
                    s[tieBreaker1] !== standings[index - 1][tieBreaker1] || 
                    s[tieBreaker2] !== standings[index - 1][tieBreaker2] || 
                    s[tieBreaker3] !== standings[index - 1][tieBreaker3]
                )
            )
        ) {
            // then assign a unique ranking for this index position
            s.rank = `${index + 1}`
        } else if (index === 0) {
            // else if at the beginning then assign T1 ranking
            s.rank = 'T1'
        } else if (
            // else if tied with previous player
            s.score === standings[index - 1].score && 
            s[tieBreaker1] === standings[index - 1][tieBreaker1] && 
            s[tieBreaker2] === standings[index - 1][tieBreaker2] && 
            s[tieBreaker3] === standings[index - 1][tieBreaker3]
        ) {
            // then assign the same ranking as the previous player
            s.rank = standings[index - 1].rank
        } else {
            // assign a new tied ranking for this index position
            s.rank = `T${index + 1}`
        }
    }

    console.log('tiebreakers:', tieBreaker1, tieBreaker2, tieBreaker3)
    console.log('standings:', '\n', standings.map((s) => `${s.rank}. ${s.name} ${s.wins}-${s.losses}-${s.ties}${s.byes > 0 ? ` +${s.byes} BYE` : ''} [${s[tieBreaker1] || ''} ${s[tieBreaker2] || ''} ${s[tieBreaker3] || ''}]`).join('\n'))
    return standings
}

// GET PARTICIPANT FINAL RANK
export const getParticipantFinalRank = async (server, tournament, participantName) => {
    console.log('participantName', participantName)
    const participants = await getParticipants(server, tournament.id)
    console.log('participants.length', participants.length)
    
    for (let i = 0; i < participants.length; i++) {
        const {participant} = participants[i]
        if (participant.name === participantName) {
            console.log('NAME MATCH -> RETURN', participant.name, participant.final_rank)
            return participant.final_rank
        }
    }

    return null
}

// AUTO REGISTER TOP CUT
export const autoRegisterTopCut = async (server, tournament, topCutTournament, standings) => {
    const topCut = standings.filter((s) => {
        const rawRankValue = parseInt(s.rank.replace(/^\D+/g, ''))
        if (rawRankValue <= tournament.topCutSize) return s
    })

    const size = topCut.length
    let errors = [`Unable to register the following players on Challonge for ${topCutTournament.name}:`]

    for (let i = 0; i < topCut.length; i++) {
        const s = topCut[i]

        try {
            const entry = await Entry.findOne({
                where: {
                    tournamentId: tournament.id,
                    participantId: s.participantId
                },
                include: Player
            })

            const topCutEntry = await Entry.create({
                playerName: entry.playerName,
                playerId: entry.playerId,
                tournamentId: topCutTournament.id,
                compositeKey: `${entry.playerId}${topCutTournament.id}`,
                url: entry.url,
                ydk: entry.ydk
            })
            
            const { participant } = await postParticipant(server, topCutTournament, entry.player.name)
            if (!participant) errors.push(`- ${entry.name} (${i + 1} seed`)        
            await topCutEntry.update({ participantId: participant.id })
        } catch (err) {
            console.log(err)
        }
    }

    return {errors, size}
}

// CREATE TOURNAMENT
export const createTournament = async (interaction, formatName, name, abbreviation, tournament_type, channelName, isRated, isLive) => {
    const server = await Server.findOne({ where: { id: interaction.guildId }})
    const format = await Format.findOne({
        where: {
            [Op.or]: {
                name: { [Op.iLike]: server.formatName || formatName },
                channelId: interaction.channelId,   
            }
        }
    })

    const game_name = 'Yu-Gi-Oh!'
    const description = `${format.name} Format`
    const channel = interaction.guild.name !== 'Format Library' ? await interaction.guild?.channels.cache.find((channel) => channel.name === channelName) : {}
    const channelId = interaction.guild.name === 'Format Library' ? format.channelId || format.categoryChannelId : channel?.id
    if (!channelId) return

    const str = generateRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz')

    const logo = name.toLowerCase().includes('format library championship') ? emojis.FL :
        name.toLowerCase().includes('retro series') ? emojis.mlady :
        name.toLowerCase().includes('drama llama') ? emojis.lmfao :
        name.toLowerCase().includes('digbic') ? emojis.stoned :
        name.toLowerCase().includes('ellietincan') ? emojis.lipton :
        name.toLowerCase().includes('ajtbls') ? emojis.toad :
        name.toLowerCase().includes('ke$ha') ? emojis.UredU :
        name.toLowerCase().includes('crown') ? emojis.king :
        name.toLowerCase().includes('patron battle royale') ? emojis.cheers :
        name.toLowerCase().includes('dark side') ? emojis.evil :
        name.toLowerCase().includes('woawa') ? '🦉 ⚽' :
        name.toLowerCase().includes('gigachad') ? emojis.gigachad :
        name.toLowerCase().includes('retro world') ? emojis.celtic :
        name.toLowerCase().includes('future world') ? emojis.farqred :
        name.toLowerCase().includes('blazing cheaters') ? emojis.speeder :
        server.logo || emojis.legend
    
    try {
        const tournament = server.challongeSubdomain ? {
            name: name,
            url: abbreviation || str,
            subdomain: server.challongeSubdomain,
            tournament_type: tournament_type,
            description: description,
            game_name: game_name,
            pts_for_match_win: "1.0",
            pts_for_match_tie: "0.0",
            pts_for_bye: "1.0"
        } : {
            name: name,
            url: abbreviation || str,
            tournament_type: tournament_type,
            description: description,
            game_name: game_name,
            pts_for_match_win: "1.0",
            pts_for_match_tie: "0.0",
            pts_for_bye: "1.0"
        }
        
        const { status, data } = await axios({
            method: 'post',
            url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeApiKey}`,
            data: {
                tournament
            }
        })
        
        if (status === 200 && data) {
            await Tournament.create({ 
                id: data.tournament.id,
                name: name,
                abbreviation: abbreviation,
                state: 'pending',
                type: tournament_type,
                formatName: format.name,
                formatId: format.id,
                logo: logo,
                emoji: format.emoji,
                url: data.tournament.url,
                channelId: channelId,
                serverId: interaction.guildId,
                communityName: server.communityName,
                isLive: isLive,
                isRated: isRated,
                pointsPerMatchWin: '1.0',
                pointsPerMatchTie: '0.0',
                pointsPerBye: '1.0',
                tieBreaker1: 'opponents win percentage',
                tieBreaker2: 'opponents opponents win percentage',
                tieBreaker3: null
            })

            return await interaction.editReply({ content: 
                `You created a new tournament:` + 
                `\nName: ${name} ${logo}` + 
                `\nFormat: ${format.name} ${format.emoji}` + 
                `\nType: ${tournament.isLive ? 'Live' : 'Multi-Day'}, ${capitalize(data.tournament.tournament_type, true)}${!tournament.isRated ? ' (Unranked)' : ''}` +
                tournament_type === 'swiss' ? `\nTie Breakers: TB1: OWP, TB2: OOWP, TB3: N/A` : '' +
                `\nBracket: https://challonge.com/${data.tournament.url}`
            })
        } 
    } catch (err) {
        console.log(err)
        try {
            const tournament = server.challongeSubdomain ? {
                name: name,
                url: str,
                subdomain: server.challongeSubdomain,
                tournament_type: tournament_type,
                description: description,
                game_name: game_name,
                pts_for_match_win: "1.0",
                pts_for_match_tie: "0.0",
                pts_for_bye: "1.0"
            } : {
                name: name,
                url: str,
                tournament_type: tournament_type,
                description: description,
                game_name: game_name,
                pts_for_match_win: "1.0",
                pts_for_match_tie: "0.0",
                pts_for_bye: "1.0"
            }
            
            const { status, data } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeApiKey}`,
                data: {
                    tournament
                }
            })
            
            if (status === 200 && data) {
                await Tournament.create({ 
                    id: data.tournament.id,
                    name: name,
                    abbreviation: abbreviation,
                    state: 'pending',
                    type: tournament_type,
                    formatName: format.name,
                    formatId: format.id,
                    logo: logo,
                    emoji: format.emoji,
                    url: data.tournament.url,
                    channelId: channelId,
                    serverId: interaction.guildId,
                    communityName: server.communityName,
                    isLive: isLive,
                    isRated: isRated,
                    pointsPerMatchWin: '1.0',
                    pointsPerMatchTie: '0.0',
                    pointsPerBye: '1.0',
                    tieBreaker1: 'opponents win percentage',
                    tieBreaker2: 'opponents opponents win percentage',
                    tieBreaker3: null
                })

                return await interaction.editReply({ content: 
                    `You created a new tournament:` + 
                    `\nName: ${name} ${logo}` + 
                    `\nFormat: ${format.name} ${format.emoji}` + 
                    `\nType: ${tournament.isLive ? 'Live' : 'Multi-Day'}, ${capitalize(data.tournament.tournament_type, true)}${!tournament.isRated ? ' (Unranked)' : ''}` +
                    tournament_type === 'swiss' ? `\nTie Breakers: TB1: OWP, TB2: OOWP, TB3: N/A` : '' +
                    `\nBracket: https://challonge.com/${data.tournament.url}`
                })
            } 
        } catch (err) {
            console.log(err)
            return await interaction.editReply({ content: `Unable to connect to Challonge account.`})
        }
    }
}

// UPDATE TOURNAMENT
export const updateTournament = async (interaction, tournamentId, name, tournament_type, url, isRated, isLive) => {
    const server = await Server.findOne({ where: { id: interaction.guildId }})
    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        }
    })

    if (interaction.fields.fields.get('ranked')) {
        await tournament.update({ isRated: isRated })
    } 

    if (interaction.fields.fields.get('duration')) {
        await tournament.update({ isLive: isLive })
    }

    try {
        const { status, data } = await axios({
            method: 'put',
            url: `https://api.challonge.com/v1/tournaments/${tournamentId}.json?api_key=${server.challongeApiKey}`,
            data: {
                tournament: {
                    name: name || tournament.name,
                    url: url || tournament.url,
                    tournament_type: tournament_type || tournament.type,
                }
            }
        })
        
        if (status === 200 && data) {
            await tournament.update({ 
                name: data.tournament.name,
                url: data.tournament.url,
                type: data.tournament.tournament_type
            })

            return await interaction.editReply({ content: 
                `Updated tournament settings:` + 
                `\nName: ${data.tournament.name} ${tournament.logo}` + 
                `\nType: ${tournament.isLive ? 'Live' : 'Multi-Day'}, ${capitalize(data.tournament.tournament_type, true)}${!tournament.isRated ? ' (Unranked)' : ''}` +
                `\nBracket: https://challonge.com/${data.tournament.url}`
            })
        } else {
            return await interaction.editReply({ content: `Unable to update tournament on Challonge.com.`})
        }
    } catch (err) {
        console.log(err)
        return await interaction.editReply({ content: `Unable to connect to Challonge.com.`})
    }
}

// EDIT TIE-BREAKERS 
export const editTieBreakers = async (interaction, tournamentId, tieBreaker1, tieBreaker2, tieBreaker3) => {
    const server = await Server.findOne({ where: { id: interaction.guildId }})
    const tie_breaks = [tieBreaker1, tieBreaker2, tieBreaker3]
    
    tie_breaks.forEach((tb, index) => {
        if (tb?.includes('win percentage')) tie_breaks[index] = null
    })

    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        }
    })

    try {
        const { status } = await axios({
            method: 'put',
            url: `https://api.challonge.com/v1/tournaments/${tournamentId}.json?api_key=${server.challongeApiKey}`,
            data: {
                tournament: {
                    tie_breaks: tie_breaks
                }
            }
        })
        
        if (status === 200) {
            await tournament.update({ 
                tieBreaker1: tieBreaker1,
                tieBreaker2: tieBreaker2,
                tieBreaker3: tieBreaker3
            })

            return await interaction.editReply({ content: 
                `Tie-breakers updated for ${tournament.name} ${tournament.logo}:` + 
                `\nTB1: ${capitalize(tieBreaker1, true)}` + 
                `\nTB2: ${capitalize(tieBreaker2, true)}` + 
                `\nTB3: ${capitalize(tieBreaker3 || 'None', true)}`
            })
        } 
    } catch (err) {
        console.log(err)
        return await interaction.editReply({ content: `Unable to connect to Challonge account.`})
    }
}

// EDIT POINTS SYSTEM
export const editPointsSystem = async (interaction, tournamentId, pointsPerMatchWin, pointsPerMatchTie, pointsPerBye) => {
    const server = await Server.findOne({ where: { id: interaction.guildId }})
    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        }
    })

    try {
        const { status } = await axios({
            method: 'put',
            url: `https://api.challonge.com/v1/tournaments/${tournamentId}.json?api_key=${server.challongeApiKey}`,
            data: {
                tournament: {
                    pts_for_match_win: pointsPerMatchWin,
                    pts_for_match_tie: pointsPerMatchTie,
                    pts_for_bye: pointsPerBye    
                }
            }
        })
        
        if (status === 200) {
            await tournament.update({ 
                pointsPerMatchWin,
                pointsPerMatchTie,
                pointsPerBye
            })

            return await interaction.editReply({ content: 
                `Points System updated for ${tournament.name} ${tournament.logo}:` + 
                `\nMatch Wins: ${pointsPerMatchWin}` + 
                `\nMatch Ties: ${pointsPerMatchTie}` + 
                `\nByes: ${pointsPerBye}`
            })
        } 
    } catch (err) {
        console.log(err)
        return await interaction.editReply({ content: `Unable to connect to Challonge account.`})
    }
}

// REMOVE FROM TOURNAMENT
export const removeFromTournament = async (interaction, tournamentId, userId) => {
    const server = await Server.findOne({ where: { id: interaction.guildId }})
    const member = userId ? await interaction.guild?.members.fetch(userId) : interaction.member
    
    const entry = await Entry.findOne({
        where: { 
            '$player.discordId$': userId, 
            tournamentId: tournamentId 
        }, 
        include: [Player, Tournament] 
    })

    return removeParticipant(server, interaction, member, entry, entry.tournament, false)
}

// DROP FROM TOURNAMENT
export const dropFromTournament = async (interaction, tournamentId) => {
    const tournament = await Tournament.findOne({ where: { id: tournamentId }})
    const player = await Player.findOne({ where: { discordId: interaction.user.id }})
    if (!player) return
    const server = await Server.findOne({ where: { id: interaction.guildId }})
    if (!server) return

    if (tournament.isTeamTournament) {
        const isCaptain = await Team.count({
            where: {
                captainId: player.id, 
                tournamentId: tournament.id
            }
        })

        if (isCaptain) {
            const team = await Team.findOne({ 
                where: { 
                    captainId: player.id, 
                    tournamentId: tournament.id
                }
            })

            const entries = await Entry.findAll({
                where: {
                    teamId: team.id,
                    tournamentId: tournament.id
                }
            })
    
            return removeTeam(server, interaction, team, entries, tournament, true)
        } else {
            const isOnTeam = await Team.count({
                where: {
                    tournamentId: tournament.id,
                    [Op.or]: {
                        playerAId: player.id,
                        playerBId: player.id,
                        playerCId: player.id
                    }
                }
            })
            
            if (isOnTeam) {
                return await interaction.editReply({ content: `Only the team captain can drop the team from a team tournament.`})    
            } else {
                const entry = await Entry.findOne({ 
                    where: { 
                        playerId: player.id, 
                        tournamentId: tournament.id
                    }
                })

                if (!entry) {
                    return await interaction.editReply({ content: `Hmm... I don't see you in the participants list for ${tournament.name}. ${tournament.emoji}`})
                } else {
                    await entry.destroy()
                    return await interaction.editReply({ content: `I removed you from ${tournament.name}. ${tournament.emoji}`})
                }
            }
        }
    } else {
        let success = (tournament.state === 'pending' || tournament.state === 'standby')
        if (!success) {
            const matches = await Match.findAll({
                where: { 
                    isTournament: true,
                    tournamentId: tournament.id
                },
                limit: 5,
                order: [["createdAt", "DESC"]] 
            })
    
            matches.forEach((match) => {
                if (match.winnerId === player.id || match.loserId === player.id) success = true 
            })
    
            if (!success) return await interaction.editReply({ content: `If you played a match, please report the result before dropping. Otherwise ask a Moderator to remove you.`})
        }
    
        const entry = await Entry.findOne({ 
            where: { 
                playerId: player.id, 
                tournamentId: tournamentId
            }
        })
    
        return removeParticipant(server, interaction, interaction.member, entry, tournament, true)   
    }
}

// START CHALLONGE BRACKET
export const startChallongeBracket = async (interaction, tournamentId) => {
    const server = await Server.findOne({ where: { id: interaction.guild?.id }})
    const tournament = await Tournament.findOne({ where: { id: tournamentId }, include: Format })
    if (!tournament) return await interaction.channel.send({ content: `Tournament not found.`})

    try {
        const {data} = await axios({
            method: 'post',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/start.json?api_key=${server.challongeApiKey}`
        })

        await tournament.update({ state: 'underway', startedAt: data?.tournament?.started_at })
        interaction.channel.send({ content: `Let's go! Your tournament is starting now: https://challonge.com/${tournament.url} ${tournament.emoji}`})
        
        if (tournament.isTeamTournament) {
            return sendTeamPairings(interaction.guild, server, tournament, false)
        } else {
            return sendPairings(interaction.guild, server, tournament, false)
        }
    } catch (err) {
        console.log(err)
        return await interaction.channel.send({ content: `Error connecting to Challonge.`})
    }
}

// START TOURNAMENT
export const startTournament = async (interaction, tournamentId) => {
    const server = await Server.findOne({ where: { id: interaction.guildId }})
    const tournament = await Tournament.findOne({ where: { id: tournamentId }})
    const unregistered = await Entry.findAll({ where: { participantId: null, tournamentId } })
    const entryCount = await Entry.count({ where: { tournamentId } })

    if (unregistered.length) {
        const names = unregistered.map((e) => e.playerName)
        return await interaction.editReply({ content: `Error: The following player(s) are not properly registered with the bot:\n${names.join('\n')}`})
    }

    if (!entryCount) {
        return await interaction.editReply({ content: `Error: No entrants found.`})
    } else if (entryCount < 2) {
        return await interaction.editReply({ content: `At least 2 players are required to start a tournament.`})
    }
    
    if (tournament?.type?.toLowerCase() === 'swiss') {
        try {
            const [rounds, topCutSize] = entryCount <= 2 ? [1, null] :
                entryCount >= 3 && entryCount <= 4 ? [2, null] :
                entryCount >= 5 && entryCount <= 7 ? [3, null] :
                entryCount === 8 ? [3, 4] :
                entryCount >= 9 && entryCount <= 12 ? [4, 4] :
                entryCount >= 13 && entryCount <= 21 ? [5, 4] :
                entryCount >= 22 && entryCount <= 32 ? [5, 8] :
                entryCount >= 33 && entryCount <= 64 ? [6, 8] :
                entryCount >= 65 && entryCount <= 96 ? [7, 8] :
                entryCount >= 97 && entryCount <= 128 ? [7, 16] :
                entryCount >= 129 && entryCount <= 256 ? [8, 16] :
                [9, 16]

            await tournament.update({ rounds, topCutSize })

            await axios({
                method: 'put',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`,
                data: {
                    tournament: {
                        swiss_rounds: rounds,
                    }
                }
            })
        } catch (err) {
            console.log(err)
            return await interaction.channel.send({ content: `Error connecting to Challonge.`})
        }
    } else if (tournament?.type?.toLowerCase() === 'double elimination') {
        const rounds = Math.ceil(Math.log(entryCount) / Math.log(2)) + 1
        await tournament.update({ rounds })
    } else if (tournament?.type?.toLowerCase() === 'single elimination') {
        const rounds = Math.ceil(Math.log(entryCount) / Math.log(2))
        await tournament.update({ rounds })
    }

    try {
        const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`)
    
        if (data?.tournament?.state === 'underway') {
            await tournament.update({ state: 'underway', startedAt: data?.tournament?.started_at })
            interaction.editReply({ content: `Your tournament was already underway on Challonge.com: https://challonge.com/${tournament.url} ${tournament.emoji}`})

            if (tournament.isTeamTournament) {
                return sendTeamPairings(interaction.guild, server, tournament, false)
            } else {
                return sendPairings(interaction.guild, server, tournament, false)
            }
        } else {
            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Y-${interaction.user?.id}-${tournament.id}`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )
    
                .addComponents(new ButtonBuilder()
                    .setCustomId(`N-${interaction.user?.id}-${tournament.id}`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )
    
                .addComponents(new ButtonBuilder()
                    .setCustomId(`S-${interaction.user?.id}-${tournament.id}`)
                    .setLabel('Shuffle')
                    .setStyle(ButtonStyle.Primary)
                )
    
            await interaction.editReply({ content: `Should this tournament be seeded by Format Library ${emojis.FL} rankings?`, components: [row] })
        }
    } catch (err) {
        console.log(err)
        return await interaction.channel.send({ content: `Error connecting to Challonge.`})
    }
}

// CREATE TOP CUT
export const createTopCut = async(interaction, tournamentId) => {
    const primaryTournament = await Tournament.findOne({ where: { id: tournamentId }, include: Format }) 
    
    if (primaryTournament.associatedTournamentId) {
        return await interaction.channel.send({ content: `Error: Top cut tournament was already created. ${emojis.megaphone}` })
    }

    const server = await Server.findOne({ where: { id: interaction.guildId }})  
    const game_name = 'Yu-Gi-Oh!'
    const description = `${primaryTournament.format?.name} Format`
    const str = generateRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz')
    const name = `${primaryTournament.name} - Top ${primaryTournament.topCutSize}`
    const abbreviation = primaryTournament.abbreviation ? `${primaryTournament.abbreviation}_Top${primaryTournament.topCutSize}` : null
    let topCutTournament

    try {
        const tournament = server.challongeSubdomain ? {
            name: name,
            url: abbreviation || str,
            subdomain: server.challongeSubdomain,
            tournament_type: 'single elimination',
            description: description,
            game_name: game_name,
            pts_for_match_tie: "0.0"
        } :  {
            name: name,
            url: abbreviation || str,
            tournament_type: 'single elimination',
            description: description,
            game_name: game_name,
            pts_for_match_tie: "0.0"
        }

        const { status, data } = await axios({
            method: 'post',
            url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeApiKey}`,
            data: {
                tournament
            }
        })
        
        if (status === 200 && data) {
            topCutTournament = await Tournament.create({ 
                id: data.tournament.id,
                name: name,
                abbreviation: abbreviation,
                state: 'pending',
                type: 'single elimination',
                formatName: primaryTournament.formatName,
                formatId: primaryTournament.formatId,
                logo: primaryTournament.logo,
                emoji: primaryTournament.emoji,
                url: data.tournament.url,
                channelId: primaryTournament.channelId,
                serverId: primaryTournament.serverId,
                communityName: primaryTournament.communityName,
                associatedTournamentId: primaryTournament.id,
                seriesId: primaryTournament.seriesId,
                isPremiumTournament: primaryTournament.isPremiumTournament,
                isRated: primaryTournament.isRated,
                isInternal: primaryTournament.isInternal,
                isLive: primaryTournament.isLive,
                isTopCutTournament: true
            })
        } 
    } catch (err) {
        console.log(err)
        try {
            const tournament = server.challongeSubdomain ? {
                name: name,
                url: str,
                subdomain: server.challongeSubdomain,
                tournament_type: 'single elimination',
                description: description,
                game_name: game_name,
                pts_for_match_tie: "0.0"
            } : {
                name: name,
                url: str,
                tournament_type: 'single elimination',
                description: description,
                game_name: game_name,
                pts_for_match_tie: "0.0"
            }
             
            const { status, data } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeApiKey}`,
                data: {
                    tournament
                }
            })
            
            if (status === 200 && data) {
                topCutTournament = await Tournament.create({ 
                    id: data.tournament.id,
                    name: name,
                    state: 'pending',
                    type: 'single elimination',
                    formatName: primaryTournament.formatName,
                    formatId: primaryTournament.formatId,
                    logo: primaryTournament.logo,
                    emoji: primaryTournament.emoji,
                    url: data.tournament.url,
                    channelId: primaryTournament.channelId,
                    serverId: primaryTournament.serverId,
                    communityName: primaryTournament.communityName,
                    associatedTournamentId: primaryTournament.id,
                    seriesId: primaryTournament.seriesId,
                    isPremiumTournament: primaryTournament.isPremiumTournament,
                    isRated: primaryTournament.isRated,
                    isInternal: primaryTournament.isInternal,
                    isLive: primaryTournament.isLive,
                    isTopCutTournament: true
                })
            }
        } catch (err) {
            console.log(err)
            return await interaction.channel.send({ content: `Error generating top cut tournament on Challonge.com. ${emojis.high_alert}` })
        }
    }

    interaction.channel.send({ content: 
        `Created a new top cut tournament:` + 
        `\nName: ${topCutTournament.name} ${topCutTournament.logo}` + 
        `\nFormat: ${topCutTournament.formatName} ${topCutTournament.emoji}` + 
        `\nType: ${capitalize(topCutTournament.type, true)}` +
        `\nBracket: https://challonge.com/${topCutTournament.url}`
    })

    await primaryTournament.update({ state: 'topcut', associatedTournamentId: topCutTournament.id })

    try {
        const matches = await getMatches(server, primaryTournament.id)
        const participants = await getParticipants(server, primaryTournament.id)
        const standings = await calculateStandings(primaryTournament, matches, participants)
        const {errors, size} = await autoRegisterTopCut(server, primaryTournament, topCutTournament, standings)
        if (errors.length > 1) {
            return interaction.channel.send({ content: errors })
        } else {
            return interaction.channel.send({ content: `Successfully registered the Top ${size} players in the new bracket! Please review the bracket and type **/start** if everything looks good. ${emojis.mlday}` })
        }
    } catch (err) {
        console.log(err)
        return interaction.channel.send({ content: `Oops! An unknown error occurred when registering the top cut players on Challonge. ${emojis.high_alert}` })
    }
}

// INITIATE END TOURNAMENT
export const initiateEndTournament = async (interaction, tournamentId) => {
    const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
    const tournament = await Tournament.findOne({ where: { id: tournamentId }})    
    if (tournament.state === 'pending' || tournament.state === 'standby') return await interaction.editReply({ content: `This tournament has not begun.`})
    if (tournament.state === 'complete' || tournament.state === 'topcut') return await interaction.editReply({ content: `This tournament has already ended.`})

    // Finalize tournament on Challonge.com if not yet finalized
    try {
        const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`)
        if (data.tournament.state !== 'complete') {
            const { status } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}/finalize.json?api_key=${server.challongeApiKey}`
            })

            if (status === 200) {   
                interaction.channel.send({ content: `Congrats! The results of ${tournament.name} ${tournament.logo} have been finalized on Challonge.com.`})
            } else {
                interaction.channel.send({ content: `Unable to finalize ${tournament.name} ${tournament.logo} on Challonge.com.`})
            }
        }
    } catch (err) {
        console.log(err)
        interaction.channel.send({ content: `Unable to finalize ${tournament.name} ${tournament.logo} on Challonge.com.`})
    }

    if (tournament.type === 'swiss' && !tournament.associatedTournamentId) {
        // If tournament is Swiss and no top cut tournament has been created, ask to create a top cut tournament
        const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
                .setCustomId(`Y-${interaction.user?.id}-${tournamentId}`)
                .setLabel('Yes')
                .setStyle(ButtonStyle.Primary)
            )

            .addComponents(new ButtonBuilder()
                .setCustomId(`N-${interaction.user?.id}-${tournamentId}`)
                .setLabel('No')
                .setStyle(ButtonStyle.Primary)
            )

        return await interaction.editReply({ content: `Do you wish to create a top cut for this tournament?`, components: [row] })
    } else if (!tournament.isTopCutTournament) {
        // If tournament is not a top cut tournament, find or create an event
        let event = await Event.findOne({ where: { primaryTournamentId: tournament.id }})

        if (!event) {
            event = await Event.create({
                name: tournament.name,
                abbreviation: tournament.abbreviation,
                formatName: tournament.formatName,
                formatId: tournament.formatId,
                referenceUrl: `https://challonge.com/${tournament.url}`,
                display: false,
                primaryTournamentId: tournament.id,
                topCutTournamentId: tournament.associatedTournamentId,
                type: tournament.type,
                isTeamEvent: tournament.isTeamTournament,
                communityName: tournament.communityName,
                serverId: tournament.serverId
            })
        }

        // If nobody is marked as a winner, find and mark a winner
        if (event && !event.winnerId) {
            try {
                const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${event.topCutTournamentId || tournament.id}/participants.json?api_key=${server.challongeApiKey}`)
                let winnerParticipantId = null
                for (let i = 0; i < data.length; i++) {
                    const participant = data[i].participant
                    if (participant.final_rank === 1) {
                        winnerParticipantId = participant.id
                        break
                    }
                }

                if (event.isTeamEvent) {
                    const winningTeam = await Team.findOne({ where: { participantId: parseInt(winnerParticipantId) }})
                    await event.update({ 
                        winningTeamName: winningTeam.name,
                        winningTeamId: winningTeam.id
                     })
                    console.log(`Marked ${winningTeam.name} as the winner of ${event.name}.`)
                } else {
                    const winningEntry = await Entry.findOne({ where: { participantId: parseInt(winnerParticipantId) }})
                    await event.update({
                        winnerName: winningEntry.playerName,
                        winnerId: winningEntry.playerId
                    })
                    console.log(`Marked ${winningEntry.playerName} as the winner of ${event.name}.`)
                }
            } catch (err) {
                console.log(err)
            }
        }

        // If event information is incomplete, get and save that information
        if (event && (!event.size || !event.startedAt || !event.endDate)) {
            try {
                const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`)
                const size = event.size || data.tournament.participants_count
                const startedAt = data.tournament.started_at ? `${data.tournament.started_at.slice(0, 10)} ${data.tournament.started_at.slice(11, 26)}` : ''
                const endDate = data.tournament.completed_at ? `${data.tournament.completed_at.slice(0, 10)} ${data.tournament.completed_at.slice(11, 26)}` : ''

                await event.update({
                    size,
                    startedAt,
                    endDate
                })

                console.log(`Recorded size, start date, and end date for ${event.name}`)
            } catch (err) {
                console.log(err)
            }
        }

        // If the number of decks saved for the event is less than the size of the event, create the remaining decks:
        let count = await Deck.count({ where: { eventId: event.id }})
        if (event && event.size > 0 && ((!event.isTeamEvent && event.size !== count) || (event.isTeamEvent && (event.size * 3) !== count))) {
            try {
                const { data: matches } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/matches.json?api_key=${server.challongeApiKey}`)
                const { data: participants } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeApiKey}`)
                const standings = await calculateStandings(tournament, matches, participants)          
                const success = await createDecks(interaction, event, participants, standings)
                if (!success) {
                    return await interaction.editReply(`Failed to save all decks.`)
                } else {
                    count = event.size
                }
            } catch (err) {
                console.log(err)
                return await interaction.editReply(`Failed to save all decks.`)
            }
        }
        
        // If the number of decks saved for the event is equal to the size of the event:
        // (1) delete all of this tournament's participant entries saved in the database
        // (2) remove tournament roles if user is not in another tournament on server
        // (3) mark tournament as complete in the database
        if (event && event.size > 0 && ((!event.isTeamEvent && event.size === count) || (event.isTeamEvent && (event.size * 3) === count))) {
            const entries = await Entry.findAll({ where: { tournamentId: tournament.id }, include: Player })
    
            for (let i = 0; i < entries.length; i++) {
                try {            
                    const entry = entries[i]
                    const playerName = entry.playerName
                    const playerId = entry.playerId
                    const discordId = entry.player.discordId	
                    console.log(`Deleting ${entry.playerName}'s entry for ${event.name}.`)
                    await entry.destroy()
                    
                    if (!server.tournamentRoleId) continue
                    const count = await Entry.count({ 
                        where: {
                            playerId: playerId,
                            isActive: true,
                            '$tournament.serverId$': server.id
                        },
                        include: Tournament,
                    })

                    if (!count) {
                        const member = await interaction.guild?.members.fetch(discordId)
                        if (!member) continue
                        console.log(`Removing ${playerName}'s tournament role on ${server.name}.`)
                        member.roles.remove(server.tournamentRoleId)
                    }
                } catch (err) {
                    console.log(err)
                }
            }

            await tournament.update({ state: 'complete' })
            return await interaction.editReply({ content: `Congrats! The results of ${tournament.name} ${tournament.logo} have been finalized.`})
        }
    } else if (tournament.isTopCutTournament) {
        // If tournament is a top cut tournament, find or create an event
        const primaryTournament = await Tournament.findOne({ where: { id: tournament.associatedTournamentId }})
        let event = await Event.findOne({ where: { primaryTournamentId: primaryTournament.id }})

        if (!event) {
            event = await Event.create({
                name: primaryTournament.name,
                abbreviation: primaryTournament.abbreviation,
                formatName: primaryTournament.formatName,
                formatId: primaryTournament.formatId,
                referenceUrl: `https://challonge.com/${primaryTournament.url}`,
                display: false,
                primaryTournamentId: primaryTournament.id,
                topCutTournamentId: tournament.id,
                type: primaryTournament.type,
                isTeamEvent: primaryTournament.isTeamTournament,
                communityName: primaryTournament.communityName,
                serverId: tournament.serverId
            })
        }

        // Update winner
        if (event) {
            try {
                const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeApiKey}`)
                let winnerParticipantId = null
                for (let i = 0; i < data.length; i++) {
                    const participant = data[i].participant
                    if (participant.final_rank === 1) {
                        winnerParticipantId = participant.id
                        break
                    }
                }

                if (event.isTeamEvent) {
                    const winningTeam = await Team.findOne({ where: { participantId: parseInt(winnerParticipantId) }})
                    await event.update({ 
                        winningTeamName: winningTeam.name,
                        winningTeamId: winningTeam.id
                     })
                    console.log(`Marked ${winningTeam.name} as the winner of ${event.name}.`)
                } else {
                    const winningEntry = await Entry.findOne({ where: { participantId: parseInt(winnerParticipantId) }})
                    await event.update({
                        winnerName: winningEntry.playerName,
                        winnerId: winningEntry.playerId
                    })

                    console.log(`Marked ${winningEntry.playerName} as the winner of ${event.name}.`)
                }
            } catch (err) {
                console.log(err)
            }
        }

        // Update event information
        if (event) {
            try {
                const { data: primaryTournamentData } = await axios.get(`https://api.challonge.com/v1/tournaments/${primaryTournament.id}.json?api_key=${server.challongeApiKey}`)
                const { data: topCutTournamentData } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`)
                const size = primaryTournamentData.tournament.participants_count || event.size
                const startedAt = primaryTournamentData.tournament.started_at ? `${primaryTournamentData.tournament.started_at.slice(0, 10)} ${primaryTournamentData.tournament.started_at.slice(11, 26)}` : ''
                const endDate = topCutTournamentData.tournament.completed_at ? `${topCutTournamentData.tournament.completed_at.slice(0, 10)} ${topCutTournamentData.tournament.completed_at.slice(11, 26)}` : ''

                await event.update({
                    size,
                    startedAt,
                    endDate
                })

                console.log(`Recorded size, start date, and end date for ${event.name}`)
            } catch (err) {
                console.log(err)
            }
        }
        
        // If the number of decks saved for the event is less than the size of the event, create the remaining decks:
        let count = await Deck.count({ where: { eventId: event.id }})
        if (event && event.size > 0 && ((!event.isTeamEvent && event.size !== count) || (event.isTeamEvent && (event.size * 3) !== count))) {
            try {                    
                const { data: matches } = await axios.get(`https://api.challonge.com/v1/tournaments/${primaryTournament.id}/matches.json?api_key=${server.challongeApiKey}`)
                const { data: participants } = await axios.get(`https://api.challonge.com/v1/tournaments/${primaryTournament.id}/participants.json?api_key=${server.challongeApiKey}`)
                const standings = await calculateStandings(tournament, matches, participants)                
                const success = await createDecks(interaction, event, participants, standings, tournament.size, tournament.id, server.challongeApiKey)

                if (!success) {
                    return await interaction.editReply(`Failed to save all decks.`)
                } else {
                    count = event.size
                }
            } catch (err) {
                console.log(err)
                return await interaction.editReply(`Failed to save all decks.`)
            }
        }
        
        // If the number of decks saved for the event is equal to the size of the event:
        // (1) delete all of this tournament's participant entries saved in the database
        // (2) remove tournament roles if user is not in another tournament on server
        // (3) mark tournament as complete in the database
        if (event && event.size > 0 && ((!event.isTeamEvent && event.size === count) || (event.isTeamEvent && (event.size * 3) === count))) {
            try {      
                const topCutEntries = await Entry.findAll({ where: { tournamentId: tournament.id }, include: Player })
                const { data: participants } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeApiKey}`)

                for (let i = 0; i < topCutEntries.length; i++) {
                    const entry = topCutEntries[i]
                    const participant = participants.map((p) => p.participant).find((p) => p.id === entry.participantId)
                    const placement = participant?.final_rank
                    const deck = await Deck.findOne({ where: { eventId: event.id, builderId: entry.playerId }})
                    await deck.update({ placement: placement })
                }
            } catch (err) {
                console.log(err)
                return await interaction.editReply(`Failed to update placements of top cut participants.`)
            }
            
            const entries = await Entry.findAll({ where: { tournamentId: {[Op.or]: [tournament.id, primaryTournament.id] }}, include: Player })
    
            for (let i = 0; i < entries.length; i++) {
                try {    
                    const entry = entries[i]
                    const playerName = entry.playerName
                    const playerId = entry.playerId
                    const discordId = entry.player.discordId	
                    console.log(`Deleting ${entry.playerName}'s entry for ${tournament.name}.`)
                    await entry.destroy()

                    if (!server.tournamentRoleId) continue
                    const count = await Entry.count({ 
                        where: {
                            playerId: playerId,
                            isActive: true,
                            '$tournament.serverId$': server.id
                        },
                        include: Tournament,
                    })

                    if (!count) {
                        const member = await interaction.guild?.members.fetch(discordId)
                        if (!member) continue
                        console.log(`Removing ${playerName}'s tournament role on ${server.name}.`)
                        member.roles.remove(server.tournamentRoleId)
                    }
                } catch (err) {
                    console.log(err)
                }
            }

            await tournament.update({ state: 'complete' })
            await primaryTournament.update({ state: 'complete' })
            return await interaction.editReply({ content: `Congrats! The results of ${event.name} ${primaryTournament.logo} have been finalized.`})
        }
    }
}


// END SWISS TOURNAMENT WITHOUT PLAYOFF
export const endSwissTournamentWithoutPlayoff = async (interaction, tournamentId) => {
    await interaction.deferReply()
    const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
    const tournament = await Tournament.findOne({ where: { id: tournamentId }, include: Format })
    if (!tournament) return
    
    if (tournament.type !== 'swiss') return await interaction.editReply({ content: `Error: this is not a Swiss tournament.`})
    if (tournament.associatedTournamentId) return await interaction.editReply({ content: `Error: this tournament is already associated with a top cut tournament.`})
    if (tournament.state === 'pending' || tournament.state === 'standby') return await interaction.editReply({ content: `This tournament has not begun.`})
    if (tournament.state === 'complete') return await interaction.editReply({ content: `This tournament has already ended.`})

    // Finalize tournament on Challonge.com if not yet finalized
    try {
        const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`)
        if (data.tournament.state !== 'complete') {
            const { status } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}/finalize.json?api_key=${server.challongeApiKey}`
            })

            if (status === 200) {   
                interaction.channel.send({ content: `Congrats! The results of ${tournament.name} ${tournament.logo} have been finalized on Challonge.com.`})
            } else {
                return await interaction.editReply({ content: `Unable to finalize ${tournament.name} ${tournament.logo} on Challonge.com.`})
            }
        }
    } catch (err) {
        console.log(err)
        return await interaction.editReply({ content: `Unable to finalize on Challonge.com.`})
    }

   // Find or create an event
    let event = await Event.findOne({ where: { primaryTournamentId: tournament.id }})

    if (!event) {
        event = await Event.create({
            name: tournament.name,
            abbreviation: tournament.abbreviation,
            formatName: tournament.formatName,
            formatId: tournament.formatId,
            referenceUrl: `https://challonge.com/${tournament.url}`,
            display: false,
            primaryTournamentId: tournament.id,
            topCutTournamentId: tournament.associatedTournamentId, 
            type: tournament.type,
            isTeamEvent: tournament.isTeamTournament,
            communityName: tournament.communityName,
            serverId: tournament.serverId
        })
    }

    // If nobody is marked as a winner, find and mark a winner
    if (event && !event.winnerId) {
        try {
            const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${event.topCutTournamentId || tournament.id}/participants.json?api_key=${server.challongeApiKey}`)
            let winnerParticipantId = null
            for (let i = 0; i < data.length; i++) {
                const participant = data[i].participant
                if (participant.final_rank === 1) {
                    winnerParticipantId = participant.id
                    break
                }
            }

            if (event.isTeamEvent) {
                const winningTeam = await Team.findOne({ where: { participantId: parseInt(winnerParticipantId) }})
                await event.update({
                    winningTeamName: winningTeam.name,
                    winningTeamId: winningTeam.id
                 })
                console.log(`Marked ${winningTeam.name} as the winner of ${event.name}.`)
            } else {
                const winningEntry = await Entry.findOne({ where: { participantId: parseInt(winnerParticipantId) }})
                await event.update({
                    winnerName: winningEntry.playerName,
                    winnerId: winningEntry.playerId
                })
                console.log(`Marked ${winningEntry.playerName} as the winner of ${event.name}.`)
            }
        } catch (err) {
            console.log(err)
        }
    }

    // If event information is incomplete, get and save that information
    if (event && !event.size) {
        try {
            const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`)
            const size = event.size || data.tournament.participants_count
            const startedAt = data.tournament.started_at ? `${data.tournament.started_at.slice(0, 10)} ${data.tournament.started_at.slice(11, 26)}` : ''
            const endDate = data.tournament.completed_at ? `${data.tournament.completed_at.slice(0, 10)} ${data.tournament.completed_at.slice(11, 26)}` : ''

            await event.update({
                size,
                startedAt,
                endDate
            })

            console.log(`Recorded size, start date, and end date for ${event.name}`)
        } catch (err) {
            console.log(err)
        }
    }
    
    // If the number of decks saved for the event is less than the size of the event, create the remaining decks:
    let count = await Deck.count({ where: { eventId: event.id }})
    if (event && event.size > 0 && ((!event.isTeamEvent && event.size !== count) || (event.isTeamEvent && (event.size * 3) !== count))) {
        try {
            const { data: matches } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/matches.json?api_key=${server.challongeApiKey}`)
            const { data: participants } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeApiKey}`)
            const standings = await calculateStandings(tournament, matches, participants)                
            const success = await createDecks(interaction, event, participants, standings)
            if (!success) {
                return await interaction.editReply(`Failed to save all decks.`)
            } else {
                count = event.size
            }
        } catch (err) {
            console.log(err)
            return await interaction.editReply(`Failed to save all decks.`)
        }
    }
    
    // If the number of decks saved for the event is equal to the size of the event:
    // (1) delete all of this tournament's participant entries saved in the database
    // (2) remove tournament roles if user is not in another tournament on server
    // (3) mark tournament as complete in the database
    if (event && event.size > 0 && ((!event.isTeamEvent && event.size === count) || (event.isTeamEvent && (event.size * 3) === count))) {
        const entries = await Entry.findAll({ where: { tournamentId: tournament.id }, include: Player })

        for (let i = 0; i < entries.length; i++) {
            try {            
                const entry = entries[i]
                const playerName = entry.playerName
                const playerId = entry.playerId
                const discordId = entry.player.discordId	
                console.log(`Deleting ${entry.playerName}'s entry for ${event.name}.`)
                await entry.destroy()

                if (!server.tournamentRoleId) continue
                const count = await Entry.count({ 
                    where: {
                        playerId: playerId,
                        isActive: true,
                        '$tournament.serverId$': server.id
                    },
                    include: Tournament,
                })

                if (!count) {
                    const member = await interaction.guild?.members.fetch(discordId)
                    if (!member) continue
                    console.log(`Removing ${playerName}'s tournament role on ${server.name}.`)
                    member.roles.remove(server.tournamentRoleId)
                }
            } catch (err) {
                console.log(err)
            }
        }

        await tournament.update({ state: 'complete' })
        return await interaction.editReply({ content: `Congrats! The results of ${tournament.name} ${tournament.logo} have been finalized.`})
    }
}

// PROCESS NO SHOW
export const processNoShow = async (interaction, tournamentId, userId) => {
    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        },
        include: Format
    })

    const noShowPlayer = await Player.findOne({
        where: {
            discordId: userId
        }
    })

    const noShow = await interaction.guild?.members.fetch(noShowPlayer.discordId)

    const server = await Server.findOne({
        where: {
            id: interaction.guildId
        }
    })

    if (!tournament || !noShowPlayer || !server) return
 
    if (tournament.state === 'pending' || tournament.state === 'standby') return await interaction.editReply({ content: `Sorry, ${tournament.name} has not started yet.`})
    if (tournament.state === 'processing') return await interaction.editReply({ content: `Sorry, another API request is processing for ${tournament.name}. Please try again shortly.`})
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
    const success = await processMatchResult(server, interaction, winner, winningPlayer, noShow, noShowPlayer, tournament, tournament.format, true)
    if (!success) return

    return await interaction.editReply({ content: `<@${noShowPlayer.discordId}>, your Tournament loss to <@${winningPlayer.discordId}> has been recorded as a no-show.`})	
}

// POST STANDINGS
export const postStandings = async (interaction, tournamentId) => {
    interaction.editReply(`Calculating standings, please wait.`)

    const server = await Server.findOne({
        where: {
            id: interaction.guildId
        }
    })

    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        }
    })

    const matches = await getMatches(server, tournamentId)
    const participants = await getParticipants(server, tournamentId)
    const standings = await calculateStandings(tournament, matches, participants)
    const abbreviateTieBreakers = (tb) => {
        if (tb === 'median buchholz') {
            return 'MB'
        } else if (tb === 'match wins vs tied') {
            return 'WvT'
        } else if (tb === 'points difference') {
            return 'PD'
        } else if (tb === 'opponents win percentage') {
            return 'OWP'
        } else if (tb === 'opponents opponents win percentage') {
            return 'OOWP'
        } else {
            return ''
        }
    }

    const camelizeTieBreaker = (str) => {
        return str === 'median buchholz' ? 'medianBuchholz' :
            str === 'match wins vs tied' ? 'winsVsTied' :
            str === 'points difference' ? 'pointsDifference' :
            str === 'opponents win percentage' ? 'opponentsWinPercentage' :
            str === 'opponents opponents win percentage' ? 'opponentsOpponentWinPercentage' :
            ''
    }
    
    const tb1 = tournament.tieBreaker1 
    const tb2 = tournament.tieBreaker2
    const tb3 = tournament.tieBreaker3

    const results = [ `${tournament.logo} - ${tournament.name} Standings - ${tournament.emoji}` , `__Rk.  Name  -  Score  (W-L-T)  [${abbreviateTieBreakers(tb1)} / ${abbreviateTieBreakers(tb2)}${tb3 ? '/ ' + abbreviateTieBreakers(tb3) : ''}]__`]

    for (let index = 0; index < standings.length; index++) {
        const s = standings[index]
        const getAndStylizeTBVal = (obj, tb) => {
            return tb === 'median buchholz' ? obj[camelizeTieBreaker(tb)].toFixed(1) :
                tb === 'match wins vs tied' || tb === 'points difference' ?  obj[camelizeTieBreaker(tb)] : 
                tb === 'opponents win percentage' || tb === 'opponents opponents win percentage' ? obj[camelizeTieBreaker(tb)].toFixed(3) :
                obj[camelizeTieBreaker(tb)]
        }
        
        const result = `${s.rank}.  ${s.name}  -  ${s.score.toFixed(1)}  (${s.wins}-${s.losses}-${s.ties})${s.byes ? ` +BYE` : ''}  [${getAndStylizeTBVal(s, tb1)} / ${getAndStylizeTBVal(s, tb2)}${tb3 ? '/ ' + getAndStylizeTBVal(s, tb3) : ''}]`

        if (!s.isActive) {
            results.push('~~' + result + '~~')
        } else {
            results.push(result)
        }    
    }

    const channel = interaction.guild?.channels?.cache?.get(server.botSpamChannelId) || interaction.channel
    if (interaction.channel !== channel.id && server.botSpamChannelId === channel.id) await interaction.channel.send(`Please visit <#${channel.id}> to view the ${tournament.name} standings. ${tournament.logo}`)
    
    for (let i = 0; i < results.length; i += 30) {
        channel.send(results.slice(i, i + 30).join('\n'))
    }

    return
}
