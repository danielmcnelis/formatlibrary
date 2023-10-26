
//TOURNAMENT FUNCTIONS

//MODULE IMPORTS
import axios from 'axios'
import { Op } from 'sequelize'
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js'
import { Deck, Entry, Event, Format, Match, OPCard, Player, Replay, Stats, Server, Team, Tournament } from '@fl/models'
import { getIssues, getSkillCard } from './deck.js'
import { createDecks } from './coverage.js'
import { capitalize, drawDeck, drawOPDeck, generateRandomString, isMod, shuffleArray } from './utility.js'
import { emojis } from '@fl/bot-emojis'

////// TOURNAMENT REGISTRATION FUNCTIONS ///////

//ASK FOR DB NAME
export const askForSimName = async (member, player, simulator, override = false, error = false, attempt = 1) => {
    const filter = m => m.author.id === member.id || member.user.id
    const pronoun = override ? `${player.globalName || player.discordName}'s` : 'your'
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
        if (name.toLowerCase().includes("duelingbook.com/deck") || name.toLowerCase().includes("imgur.com")) {
            if (attempt >= 3) {
                member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
                return false
            } else {
                return askForSimName(member, player, simulator, override, true, attempt++)
            }
        } else {
            if (simulator === 'DuelingBook') {
                await player.update({ duelingBook: name })
            } else if (simulator === 'OPTCGSim') {
                await player.update({ opTcgSim: name })
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

//GET DECK LIST
export const getDeckList = async (member, player, format, override = false) => {            
    const filter = m => m.author.id === member.user.id
    const pronoun = override ? `${player.globalName || player.discordName}'s` : 'your'
    const message = await member.send({ content: `Please upload a **__YDK File__** for ${pronoun} tournament deck.`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 180000
    }).then(async (collected) => {
            const url = collected.first()?.attachments?.first()?.url
            if (url) {
                const {data: ydk} = await axios.get(url)
                const main = ydk.split('#main')[1].split('#extra')[0].split('\n').map((e) => !!e.length)
                console.log('main', main)
                const extra = ydk.split('#extra')[1].split('!side')[0].split('\n').map((e) => !!e.length)
                console.log('extra', extra)
                const side = ydk.split('!side')[1].split('\n').map((e) => !!e.length)
                console.log('side', side)
    
                const minimum = format.category === 'Speed' ? 20 : 40
    
                if (main?.length < minimum) {
                    member.send(`I'm sorry, your deck must contain at least ${minimum} cards.`).catch((err) => console.log(err))    
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
                } else if (format.category !== 'TCG' && format.category !== 'Speed') {
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
                member.send({ content: "Sorry, I only accept YDK Files."}).catch((err) => console.log(err))    
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

    const filter = m => m.author.id === member.user.id
    const pronoun = override ? `${player.globalName || player.discordName}'s` : 'your'
    const message = await member.send({ content: `Please provide a duelingbook.com/deck link for ${pronoun} tournament deck.`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 180000
    }).then(async (collected) => {
        const url = collected.first().content
        if (url.includes('duelingbook.com/deck?id=')) {		
            member.send({ content: 'Thanks. Please wait while I download the .YDK file.'})
            const id = url.slice(url.indexOf('?id=') + 4)
            const {data} = await axios.get(`https://www.duelingbook.com/php-scripts/load-deck.php/deck?id=${id}`)
            if (!data) return false
            const main = data.main.map((e) => e.serial_number)
            const minimum = format.category === 'Speed' ? 20 : 40

            if (main.length < minimum) {
                member.send(`I'm sorry, your deck must contain at least ${minimum} cards.`).catch((err) => console.log(err))    
                return false 
            }

            const side = data.side.map((e) => e.serial_number)
            const extra = data.extra.map((e) => e.serial_number)
            const ydk = ['created by...', '#main', ...main, '#extra', ...extra, '!side', ...side, ''].join('\n')
            const deckArr = [...main, ...extra, ...side, skillCard.konamiCode]
            const issues = await getIssues(deckArr, format)
            if (!issues) return false

            const { illegalCards, forbiddenCards, limited1Cards, limited2Cards, limited3Cards, unrecognizedCards } = issues
            if (!illegalCards || !forbiddenCards || !limited1Cards || !limited2Cards || !limited3Cards || !unrecognizedCards) return false
                
            if (override) {
                member.send({ content: `Thanks, ${member.user.username}, I saved a copy of ${pronoun} deck. ${emojis.legend}`}).catch((err) => console.log(err))
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
                response += `\n\nThese cards are either alternate artwork or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
                
                member.send({ content: response.toString() }).catch((err) => console.log(err))
                return false
             } else {
                member.send({ content: `Thanks, ${member.user.username}, ${pronoun} deck is perfectly legal. ${emojis.legend}`}).catch((err) => console.log(err))
                return { url, ydk, skillCard }
            }
        } else {
            member.send({ content: "Sorry, I only accept duelingbook.com/deck links."}).catch((err) => console.log(err))    
            return false  
        }
    }).catch((err) => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}


//GET OP DECK LIST
export const getOPDeckList = async (member, player, override = false) => {            
    const filter = m => m.author.id === member.user.id
    const pronoun = override ? `${player.globalName || player.discordName}'s` : 'your'
    const message = await member.send({ content: `Please paste ${pronoun} OPTCGSim deck list from the clipboard.`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 180000
    }).then(async (collected) => {
        const opdk = collected.first().content
        const opdkArr = opdk.trim().split('\n')
        const cards = []
        const wrongColorCards = []
        const unrecognizedCards = []
        const illegalCards = []
        let deckSize = 0
        let moreThanFour = false

        for (let i = 0; i < opdkArr.length; i++) {
            const str = opdkArr[i]
            const copyNumber = parseInt(str[0])
            if (copyNumber > 4) moreThanFour = true
            deckSize += copyNumber
            const cardCode = str.slice(str.indexOf('x') + 1)
            const card = await OPCard.findOne({ where: { cardCode }})
            if (!card) {
                unrecognizedCards.push(cardCode)
            } else if (!card.westernLegal) {
                illegalCards.push(`${card.cardCode} - ${card.name}`)
            } else {
                cards.push([copyNumber, card])
            }
        }

        if (unrecognizedCards.length) {
            member.send(`The following cards are unrecognized:\n${unrecognizedCards.join('\n')}`)
            return false
        }

        if (illegalCards.length) {
            member.send(`The following cards are not Western legal:\n${illegalCards.join('\n')}`)
            return false
        }
        
        if (deckSize !== 51) {
            member.send(`Your main deck is not 50 cards.`)
            return false
        }

        if (moreThanFour) {
            member.send(`You cannot use more than 4 copies of a card in your deck.`)
            return false
        }

        const leader = cards[0][1]
        const allowedColors = leader.color.split('-')

        for (let i = 1; i < cards.length; i++) {
            const card = cards[i][1]
            if (!allowedColors.includes(card.color)) {
                wrongColorCards.push(`${card.cardCode} - ${card.name} (${card.color})`)
            }
        }

        if (wrongColorCards.length) {
            member.send(`You cannot use the following cards in a deck led by ${leader.cardCode} ${leader.name} (${leader.color}):\n${wrongColorCards.join('\n')}`)
            return false
        }

        if (override) {
            member.send({ content: `Thanks, ${member.user.username}, I saved a copy of ${pronoun} deck. ${emojis.legend}`}).catch((err) => console.log(err))
            return { leader, opdk }
        } else {
            return { leader, opdk }  
        }
    }).catch((err) => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}

// SEND DECK
export const sendDeck = async (interaction, entryId) => {
    const entry = await Entry.findOne({ where: { id: entryId }, include: [Player, Tournament] })
    interaction.editReply({ content: `Please check your DMs.` })
    const deckAttachments = entry.tournament.formatName === 'One Piece' ? await drawOPDeck(entry.ydk) || [] : await drawDeck(entry.ydk) || []
    const ydkFile = new AttachmentBuilder(Buffer.from(entry.ydk), { name: `${entry.player.globalName || entry.player.discordName}#${entry.player.discriminator}_${entry.tournament.abbreviation || entry.tournament.name}.ydk` })
    const isAuthor = interaction.user.id === entry.player.discordId
    return await interaction.member.send({ content: `${isAuthor ? `${entry.player.globalName || entry.player.discordName}'s` : 'Your'} deck for ${entry.tournament.name} is:\n<${entry.url}>`, files: [...deckAttachments, ydkFile]}).catch((err) => console.log(err))
}

// SELECT TOURNAMENT FOR DECK CHECK
export const selectTournamentForDeckCheck = async (interaction, entries, format) => {
    if (entries.length === 0) {
        interaction.editReply(`That player is not registered for any ${format.name}${format.category !== 'OP' ? ' format' : ''} ${format.emoji} tournaments in this server.`)
        return false
    } else if (entries.length === 1) {
        return entries[0]
    } else {
        const options = entries.map((entry, index) => {
            return {
                label: `(${index + 1}) ${entry.tournament.name}`,
                value: `${entry.id}`,
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
export const getFilm = async (interaction, tournamentId, userId) => {
    const tournament = await Tournament.findOne({ where: { id: tournamentId }})
    const player = await Player.findOne({ where: { discordId: userId }})

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
        order: [['createdAt', 'ASC']]
    })].map((r) => `${r.roundName} ${r.winnerId === player.id ? `(W) vs ${r.loserName}` : `(L) vs ${r.winnerName}`}: <${r.url}>`)

    if (!replays.length) {
        return await interaction.editReply(`No replays found featuring ${player.globalName || player.discordName} in ${tournament.name}. ${tournament.emoji}`)
    } else {
        return await interaction.editReply(`${player.globalName || player.discordName}'s ${tournament.name} ${tournament.emoji} replays:\n${replays.join('\n')}`)
    }
}

// SAVE REPLAY
export const saveReplay = async (server, interaction, match, tournament, url) => {
    const format = await Format.findOne({ where: { id: match.formatId }})
    const winningPlayer = await Player.findOne({ where: { id: match.winnerId }})
    const losingPlayer = await Player.findOne({ where: { id: match.loserId }})

    const {data: challongeMatch} = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/matches/${match.challongeMatchId}.json?api_key=${server.challongeAPIKey}`).catch((err) => console.log(err))
    if (!challongeMatch) return await interaction.channel.send({ content: `Error: Challonge match not found.`})	
    const replay = await Replay.findOne({ where: { matchId: match.id }})
    if (replay && await isMod(server, interaction.member)) {
        await replay.update({ url })
        return await interaction.channel.send({ content: `Replay updated for Round ${challongeMatch?.match?.round} of ${tournament.name} ${tournament.logo}:\nMatch: ${replay.winnerName} vs ${replay.loserName}\nURL: <${url}>`})	
    } if (replay) {
        return await interaction.channel.send({ content: `The replay from this match was already saved:\n<${replay.url}>\n\nIf this link is incorrect, please get a Moderator to help you.`})	
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
                roundInt: round,
                roundName: roundName
            })
            
            return await interaction.editReply({ content: `New replay saved for ${roundName} of ${tournament.name} ${tournament.logo}:\nMatch: ${winningPlayer.globalName || winningPlayer.discordName} vs ${losingPlayer.globalName || losingPlayer.discordName}\nURL: <${url}>`})	
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
    
    const simName = tournament.format?.category === 'OP' ? player.opTcgSim || await askForSimName(interaction.member, player, 'OPTCGSim') :
        player.duelingBook || await askForSimName(interaction.member, player, 'DuelingBook')

    if (!simName) return

    const data = tournament.format?.category === 'OP' ? await getOPDeckList(interaction.member, player) :
        await getDeckList(interaction.member, player, tournament.format)

    if (!data) return

    if (!entry && tournament.isTeamTournament && team) {
        const slot = team.playerAId === player.id ? 'A' :
            team.playerBId === player.id ? 'B' :
            team.playerCId === player.id ? 'C' :
            null

        try { 
            await Entry.create({
                playerName: player.globalName || player.discordName,
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

        const deckAttachments = tournament.format.category === 'OP' ? await drawOPDeck(data.opdk) || [] : await drawDeck(data.ydk) || []
        interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
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
        if (tournament.isPremiumTournament && (!player.subscriber || player.subTier === 'Supporter')) {
            return interaction.member.send({ content: `Sorry premium tournaments are only open to premium server subscribers.`})
        } else if (tournament.isPremiumTournament && player.subTier === 'Premium') {
            const alreadyEntered = await Entry.count({
                where: {
                    playerId: player.id,
                    '$tournament.isPremiumTournament$': true
                },
                include: Tournament
            })

            if (alreadyEntered) {
                return interaction.member.send({ content: `Sorry, you may only enter one Premium Tournament per month with your current subscription.`})
            }
        }

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
                            
        const { participant } = await postParticipant(server, tournament, player).catch((err) => console.log(err))
        
        if (!participant) {
            await entry.destroy()
            return await interaction.member.send({ content: `Error: Unable to register on Challonge for ${tournament.name}. ${tournament.logo}`})
        }

        await entry.update({ participantId: participant.id })

        const deckAttachments = tournament.format.category === 'OP' ? await drawOPDeck(data.opdk) || [] : await drawDeck(data.ydk) || []
        interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
        interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in ${tournament.name}! ${tournament.logo}`})
        deckAttachments.forEach((attachment, index) => {
            if (index === 0) {
                interaction.member.send({ content: `FYI, this is the deck you submitted:`, files: [attachment] }).catch((err) => console.log(err))
            } else {
                interaction.member.send({ files: [attachment] }).catch((err) => console.log(err))
            }
        })

        return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> is now registered for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
    } else if (entry && entry.active === false && tournament.isTeamTournament) {
        await entry.update({
            url: data.url,
            ydk: data.ydk || data.opdk,
            active: true
        })

        const deckAttachments = tournament.format.category === 'OP' ? await drawOPDeck(data.opdk) || [] : await drawDeck(data.ydk) || []
        interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
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
            const { participant } = await postParticipant(server, tournament, player).catch((err) => console.log(err))
    
            if (!participant) {
                await entry.destroy()
                return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register on Challonge for ${tournament.name}. ${tournament.logo}`})
            } else {
                await entry.update({ participantId: participant.id })
            }
        }

        await entry.update({ url: data.url, ydk: data.ydk || data.opdk })
        const deckAttachments = tournament?.format?.category === 'OP' ? await drawOPDeck(data.opdk) || [] : await drawDeck(data.ydk) || []
        interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
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
    
    const simName = tournament.format?.category === 'OP' ? player.opTcgSim || await askForSimName(interaction.member, player, 'OPTCGSim') :
        player.duelingBook || await askForSimName(interaction.member, player, 'DuelingBook')

    if (!simName) return

    const data = tournament.format?.category === 'OP' ? await getOPDeckList(interaction.member, player, true) :
        await getDeckList(interaction.member, player, tournament.format, true)

    if (!data) return

    if (!entry) {
        try {
            entry = await Entry.create({
                playerName: player.globalName || player.discordName,
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
                  
        const { participant } = await postParticipant(server, tournament, player)
        if (!participant) return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register on Challonge for ${tournament.name}. ${tournament.logo}`})        
        await entry.update({ participantId: participant.id })

        member.roles.add(server.tourRole).catch((err) => console.log(err))
        interaction.member.send({ content: `Thanks! I have all the information we need for ${player.globalName || player.discordName}.` }).catch((err) => console.log(err))
        return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `A moderator signed up <@${player.discordId}> for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
    } else if (entry && entry.active === false) {
        const { participant } = await postParticipant(server, tournament, player)
        if (!participant) return await interaction.member.send({ content: `${emojis.high_alert} Error: Unable to register on Challonge for ${tournament.name}. ${tournament.logo}`})
        
        await entry.update({
            url: data.url,
            ydk: data.ydk || data.opdk,
            participantId: participant.id,
            active: true
        })

        member.roles.add(server.tourRole).catch((err) => console.log(err))
        interaction.member.send({ content: `Thanks! I have all the information we need for ${player.globalName || player.discordName}.` }).catch((err) => console.log(err))
        return await interaction.guild?.channels.cache.get(tournament.channelId).send({ content: `A moderator signed up <@${player.discordId}> for ${tournament.name}! ${tournament.logo}`}).catch((err) => console.log(err))
    } else if (entry && entry.active === true) {
        await entry.update({ url: data.url, ydk: data.ydk || data.opdk })
        interaction.member.send({ content: `Thanks! I have ${player.globalName || player.discordName}'s updated deck list for the tournament.` }).catch((err) => console.log(err))
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

    const ignoreRound1 = !tournament.deadline
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
        sendTeamPairings(interaction.guild, server, tournament, tournament.format, ignoreRound1)
    } else {
        sendPairings(interaction.guild, server, tournament, tournament.format, ignoreRound1)
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
    try {
        // DELETE PARTICIPANT FROM CHALLONGE BRACKET 
        await axios({
            method: 'delete',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/${entry.participantId}.json?api_key=${server.challongeAPIKey}`
        })

        const playerId = entry.playerId

        // DE-ACTIVATE ENTRY DATA IF UNDERWAY, OTHERWISE DELETE ENTRY DATA
        if (tournament.state === 'underway') {
            await entry.update({ active: false, roundDropped: entry.wins + entry.losses })
        } else {
            await entry.destroy()
        }

        const count = await Entry.count({ 
            where: {
                playerId: playerId,
                active: true,
                '$tournament.serverId$': server.id
            },
            include: Tournament
        })

        // REMOVE TOURNAMENT PARTICIPANT ROLE IF NOT IN ANY OTHER TOURNAMENTS ON THE SERVER
        if (!count) member.roles.remove(server.tourRole).catch((err) => console.log(err))
    
        // REPLY WITH AN AFFIRMATIVE RESPONSE
        if (drop && tournament.state !== 'underway') {
            return await interaction.editReply({ content: `I removed you from ${tournament.name}. We hope to see you next time! ${tournament.emoji}`})
        } else if (drop) {
            return await interaction.editReply({ content: `I removed you from ${tournament.name}. Better luck next time! ${tournament.emoji}`})
        } else {
            return await interaction.editReply({ content: `${member.user.username} has been removed from ${tournament.name}. ${tournament.emoji}`})
        }
    } catch (err) {
        console.log(err)
        // REPLY WITH AN ERROR MESSAGE
        if (drop) {
            return await interaction.editReply({ content: `Hmm... I don't see you in the participants list for ${tournament.name}. ${tournament.emoji}`})
        } else {
            return await interaction.editReply({ content: `I could not find ${member.user.username} in the participants list for ${tournament.name}. ${tournament.emoji}`})
        }
    }   
}

//REMOVE TEAM
export const removeTeam = async (server, interaction, team, entries, tournament, drop = false) => {    
    try {
        const success = await axios({
            method: 'delete',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/${team.participantId}.json?api_key=${server.challongeAPIKey}`
        })

        if (success) {
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]

                if (tournament.state === 'underway') {
                    await entry.update({
                        active: false,
                        roundDropped: entry.wins + entry.losses
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
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/randomize.json?api_key=${server.challongeAPIKey}`
            })
            
            interaction.channel.send(`Success! Your seeds 🌱 have been shuffled! 🎲`)
        } catch (err) {
            interaction.channel.send(`Error: Your seeds 🥀 have not been shuffled. 😢`)
        }
    } else {
        interaction.channel.send({ content: `Seeding 🌱 in progress, please wait. 🙏`})

        const entries = await Entry.findAll({ where: { active: true, tournamentId: tournament.id } })  
        const serverId = server.internalLadder ? server.id : '414551319031054346'  
        const expEntries = []
        const newbieEntries = []
    
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]
            const playerId = entry.playerId
            console.log('entry.name', entry.name)
            const stats = await Stats.findOne({ where: { format: tournament.formatName, playerId, serverId }})
            
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

        console.log('seeds', seeds)
    
        for (let i = 0; i < seeds.length; i++) {
            const participantId = seeds[i][0]
            const name = seeds[i][1]
    
            try {
                await axios({
                    method: 'put',
                    url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/${participantId}.json?api_key=${server.challongeAPIKey}`,
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
export const checkPairing = (match, p1, p2) => (match.player1_id === p1 && match.player2_id === p2) || (match.player1_id === p2 && match.player2_id === p1)

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
export const getMatches = async (server, tournamentId) => {
    try {
        const { data } = await axios({
            method: 'get',
            url: `https://api.challonge.com/v1/tournaments/${tournamentId}/matches.json?api_key=${server.challongeAPIKey}`
        })
        
        return data
    } catch (err) {
        console.log(err)
        return []
    }
}

//GET PARTICIPANTS
export const getParticipants = async (server, tournamentId) => {
    try {
        const { data } = await axios({
            method: 'get',
            url: `https://api.challonge.com/v1/tournaments/${tournamentId}/participants.json?api_key=${server.challongeAPIKey}`
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
export const postParticipant = async (server, tournament, player) => {
    try {
        const name = player.discriminator === '0' ? player.discordName : player.discordName + '#' + player.discriminator
        const { data } = await axios({
            method: 'post',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeAPIKey}`,
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
        interaction.editReply({ content: `Sorry I could not find your tournament in the database.`})
        return false
    }

    const gameCount = noshow ? [0, 0] : [1, 0]
    if (!gameCount || !gameCount.length) {
        interaction.editReply({ content: `Please specify a valid game count.`})
        return false
    }

    const matchesArr = await getMatches(server, tournament.id) || []
    let matchId = false
    let scores = false
    let challongeMatch
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.state !== 'open') continue
        if (checkPairing(match, losingEntry.participantId, winningEntry.participantId)) {
            challongeMatch = match
            matchId = match.id    
            scores = match.player1_id === winningEntry.participantId ? `${gameCount[0]}-${gameCount[1]}` : `${gameCount[1]}-${gameCount[0]}`
            break
        }
    }

    let success

    try {
        success = await axios({
            method: 'put',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/matches/${matchId}.json?api_key=${server.challongeAPIKey}`,
            data: {
                match: {
                    winner_id: winningEntry.participantId,
                    scores_csv: scores
                }
            }
        })
    } catch (err) {
        console.log(err)
    }
     
    if (!success) {
        interaction.editReply({ content: `Error: could not update bracket for ${tournament.name}.`})
        return false
    }
 
    losingEntry.losses++
    await losingEntry.save()
    
    winningEntry.wins++
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
            losingEntry.active = false
            await losingEntry.save()

            const count = await Entry.count({
                where: {
                    playerId: playerId,
                    active: true,
                    '$tournament.serverId$': server.id
                },
                include: Tournament
            })

            if (member && !count) member.roles.remove(server.tourRole).catch((err) => console.log(err))
        }

        const loserNextMatch = loserEliminated ? null : findNextMatch(updatedMatchesArr, matchId, losingEntry.participantId)
        const loserNextOpponent = loserNextMatch ? await findNextOpponent(tournament.id, updatedMatchesArr, loserNextMatch, losingEntry.participantId) : null
        const loserMatchWaitingOn = loserNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, loserNextMatch, matchId) 
        const loserWaitingOnP1 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p1 }, include: Player }) : null
        const loserWaitingOnP2 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p2 }, include: Player }) : null

        setTimeout(async () => {
            if (loserEliminated) {
                return await interaction.channel.send({ content: `${losingPlayer.globalName || losingPlayer.discordName}, You are eliminated from the tournament. Better luck next time!`})
            } else if (loserNextOpponent) {
                try {
                    loser.user.send(`New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${loserNextOpponent.player.globalName || loserNextOpponent.player.discordName + '#' + loserNextOpponent.player.discriminator}\nDuelingBook: ${loserNextOpponent.player.duelingBook}`)
                } catch (err) {
                    console.log(err)
                }

                try {
                    const member = await interaction.guild?.members.fetch(loserNextOpponent.player.discordId)
                    const name = losingPlayer.globalName || `${losingPlayer.discordName}#${losingPlayer.discriminator}`
                    member.user.send(`New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${name}\nDuelingBook: ${losingPlayer.duelingBook}`)
                } catch (err) {
                    console.log(err)
                }

                const content = format?.category === 'OP' ? `New Match: <@${losingPlayer.discordId}> (DB: ${losingPlayer.opTcgSim}) vs. <@${loserNextOpponent.player.discordId}> (DB: ${loserNextOpponent.player.opTcgSim}). Good luck to both players.` : 
                    `New Match: <@${losingPlayer.discordId}> (DB: ${losingPlayer.duelingBook}) vs. <@${loserNextOpponent.player.discordId}> (DB: ${loserNextOpponent.player.duelingBook}). Good luck to both duelists.`
        
                return await interaction.channel.send({ content: content })
            } else if (loserMatchWaitingOn && loserWaitingOnP1 && loserWaitingOnP2) {
                const content = format?.category === 'OP' ? `${losingPlayer.globalName || losingPlayer.discordName}, You are waiting for the result of ${loserWaitingOnP1.player.globalName || loserWaitingOnP1.player.discordName} (OPTCGSim: ${loserWaitingOnP1.player.opTcgSim}) vs ${loserWaitingOnP2.player.globalName || loserWaitingOnP2.player.discordName} (OPTCGSim: ${loserWaitingOnP2.player.opTcgSim}).` :
                    `${losingPlayer.globalName || losingPlayer.discordName}, You are waiting for the result of ${loserWaitingOnP1.player.globalName || loserWaitingOnP1.player.discordName} (DB: ${loserWaitingOnP1.player.duelingBook}) vs ${loserWaitingOnP2.player.globalName || loserWaitingOnP2.player.discordName} (DB: ${loserWaitingOnP2.player.duelingBook}).`
                return await interaction.channel.send({ content: content })
            } else {
                return await interaction.channel.send({ content: `${losingPlayer.globalName || losingPlayer.discordName}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
            }
        }, 2000)
        
        if (!winnerNextMatch || (winnerNextMatch && loserNextMatch !== winnerNextMatch)) {
            setTimeout(async () => {
                if (!winnerNextMatch) {
                    return await interaction.channel.send({ content: `<@${winningPlayer.discordId}>, You won the tournament! Congratulations on your stellar performance! ${emojis.legend}`})
                } else if (winnerNextOpponent) {
                    try {
                        const name = winnerNextOpponent.player.globalName || `${winnerNextOpponent.player.discordName}#${winnerNextOpponent.player.discriminator}`
                        const content = format?.category === 'OP' ? `New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${name}\nOPTCGSim: ${winnerNextOpponent.player.opTcgSim}` :
                            `New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${name}\nDuelingBook: ${winnerNextOpponent.player.duelingBook}`
                        winner.user.send({ content: content })
                    } catch (err) {
                        console.log(err)
                    }

                    try {
                        const member = await interaction.guild?.members.fetch(winnerNextOpponent.player.discordId)
                        const name = winningPlayer.globalName || `${winningPlayer.discordName}#${winningPlayer.discriminator}`
                        const content = format?.category === 'OP' ? `New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${name}\nOPTCGSim: ${winningPlayer.opTcgSim}` :
                            `New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${name}\nDuelingBook: ${winningPlayer.duelingBook}`
                            
                        member.user.send({ content: content })
                    } catch (err) {
                        console.log(err)
                    }
                    
                    const content = format?.category === 'OP' ? `New Match: <@${winningPlayer.discordId}> (OPTCGSim: ${winningPlayer.opTcgSim}) vs. <@${winnerNextOpponent.player.discordId}> (OPTCGSim: ${winnerNextOpponent.player.opTcgSim}). Good luck to both duelists.` : 
                        `New Match: <@${winningPlayer.discordId}> (DB: ${winningPlayer.duelingBook}) vs. <@${winnerNextOpponent.player.discordId}> (DB: ${winnerNextOpponent.player.duelingBook}). Good luck to both duelists.`
                    return await interaction.channel.send({ content: content })
                } else if (winnerMatchWaitingOn && winnerWaitingOnP1 && winnerWaitingOnP2) {
                    const content = format?.category === 'OP' ? `${winningPlayer.globalName || winningPlayer.discordName}, You are waiting for the result of ${winnerWaitingOnP1.player.globalName || winnerWaitingOnP1.player.discordName} (OPTCGSim: ${winnerWaitingOnP1.player.opTcgSim}) vs ${winnerWaitingOnP2.player.globalName || winnerWaitingOnP2.player.discordName} (OPTCGSim: ${winnerWaitingOnP2.player.opTcgSim}).` :
                        `${winningPlayer.globalName || winningPlayer.discordName}, You are waiting for the result of ${winnerWaitingOnP1.player.globalName || winnerWaitingOnP1.player.discordName} (DB: ${winnerWaitingOnP1.player.duelingBook}) vs ${winnerWaitingOnP2.player.globalName || winnerWaitingOnP2.player.discordName} (DB: ${winnerWaitingOnP2.player.duelingBook}).`
                    return await interaction.channel.send({ content: content})
                } else {
                    return await interaction.channel.send({ content: `${winningPlayer.globalName || winningPlayer.discordName}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
                }
            }, 4000)
        }
    }
    
    return challongeMatch
}

//PROCESS TEAM RESULT
export const processTeamResult = async (server, interaction, winningPlayer, losingPlayer, tournament, format, noshow = false) => {
    const losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id, tournamentId: tournament.id }, include: [Player, Team] })
    const winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id, tournamentId: tournament.id }, include: [Player, Team] })

    if (!losingEntry || !winningEntry) {
        await interaction.editReply({ content: `Sorry I could not find your tournament in the database.`})
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

    const matchesArr = await getMatches(server, tournament.id) || []
    let matchId = false
    let scores = false
    let challongeMatch
    let success

    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.state !== 'open') continue
        if (checkPairing(match, losingEntry.participantId, winningEntry.participantId)) {
            challongeMatch = match
            matchId = match.id    
            scores =  match.player1_id === winningEntry.participantId ? 
                `${winningTeam.matchWins}-${winningTeam.matchLosses}` : 
                `${winningTeam.matchLosses}-${winningTeam.matchWins}`
            break
        }
    }

    if (winningTeam.matchWins >= 2) {
        try {
            success = await axios({
                method: 'put',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}/matches/${matchId}.json?api_key=${server.challongeAPIKey}`,
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
                    await losingEntries[i].update({ active: false})
    
                    const count = await Entry.count({
                        where: {
                            playerId: playerId,
                            active: true,
                            '$tournament.serverId$': server.id
                        },
                        include: Tournament
                    })
    
                    if (member && !count) member.roles.remove(server.tourRole).catch((err) => console.log(err))
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

                    const {player: playerA1} = await Entry.findOne({ where: { teamId: losingTeam.id, tournamentId: tournament.id, slot: 'A' }, include: Player })
                    const {player: playerA2} = await Entry.findOne({ where: { teamId: loserNextTeam.id, tournamentId: tournament.id, slot: 'A' }, include: Player})
                    
                    try {
                        const pA1Member = await interaction.guild?.members.fetch(playerA1.discordId)
                        pA1Member.user.send(
                            `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                            `\nDiscord: ${playerA2.name}${playerA2.discriminator !== '0' ? `#${playerA2.discriminator}` : ''}` +
                            `\n${format?.category === 'OP' ? `OPTCGSim: ${playerA2.opTcgSim}` : `DuelingBook: ${playerA2.duelingBook}`}`
                        )
                    } catch (err) {
                        console.log(err)
                    }

                    try {
                        const pA2Member = await interaction.guild?.members.fetch(playerA2.discordId)
                        pA2Member.user.send(
                            `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                            `\nDiscord: ${playerA1.name}${playerA1.discriminator !== '0' ? `#${playerA1.discriminator}` : ''}` +
                            `\n${format?.category === 'OP' ? `OPTCGSim: ${playerA1.opTcgSim}` : `DuelingBook: ${playerA1.duelingBook}`}`
                        )
                    } catch (err) {
                        console.log(err)
                    }

                    const {player: playerB1} = await Entry.findOne({ where: { teamId: losingTeam.id, tournamentId: tournament.id, slot: 'B' }, include: Player})
                    const {player: playerB2} = await Entry.findOne({ where: { teamId: loserNextTeam.id, tournamentId: tournament.id, slot: 'B' }, include: Player})
                    
                    try {
                        const pB1Member = await interaction.guild?.members.fetch(playerB1.discordId)
                        pB1Member.user.send(
                            `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                            `\nDiscord: ${playerB2.name}${playerB2.discriminator !== '0' ? `#${playerB2.discriminator}` : ''}` +
                            `\n${format?.category === 'OP' ? `OPTCGSim: ${playerB2.opTcgSim}` : `DuelingBook: ${playerB2.duelingBook}`}`
                        )
                    } catch (err) {
                        console.log(err)
                    }

                    try {
                        const pB2Member = await interaction.guild?.members.fetch(playerB2.discordId)
                        pB2Member.user.send(
                            `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                            `\nDiscord: ${playerB1.name}${playerB1.discriminator !== '0' ? `#${playerB1.discriminator}` : ''}` +
                            `\n${format?.category === 'OP' ? `OPTCGSim: ${playerB1.opTcgSim}` : `DuelingBook: ${playerB1.duelingBook}`}`
                        )
                    } catch (err) {
                        console.log(err)
                    }

                    const {player: playerC1} = await Entry.findOne({ where: { teamId: losingTeam.id, tournamentId: tournament.id, slot: 'C' }, include: Player})
                    const {player: playerC2} = await Entry.findOne({ where: { teamId: loserNextTeam.id, tournamentId: tournament.id, slot: 'C' }, include: Player})

                    try {
                        const pC1Member = await interaction.guild?.members.fetch(playerC1.discordId)
                        pC1Member.user.send(
                            `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                            `\nDiscord: ${playerC2.name}${playerC2.discriminator !== '0' ? `#${playerC2.discriminator}` : ''}` +
                            `\n${format?.category === 'OP' ? `OPTCGSim: ${playerC2.opTcgSim}` : `DuelingBook: ${playerC2.duelingBook}`}`
                        )
                    } catch (err) {
                        console.log(err)
                    }

                    try {
                        const pC2Member = await interaction.guild?.members.fetch(playerC2.discordId)
                        pC2Member.user.send(
                            `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                            `\nServer: ${server.name} ${server.logo}` +
                            `\nChannel: <#${tournament.channelId}>` +
                            `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                            `\nDiscord: ${playerC1.name}${playerC1.discriminator !== '0' ? `#${playerC1.discriminator}` : ''}` +
                            `\n${format?.category === 'OP' ? `OPTCGSim: ${playerC1.opTcgSim}` : `DuelingBook: ${playerC1.duelingBook}`}`
                        )
                    } catch (err) {
                        console.log(err)
                    }

                    await interaction.channel.send({ 
                        content: `New Team Match: ${losingTeam.name} vs. ${loserNextTeam.name}. Good luck to both teams.` + 
                            `\nDuel A: <@${playerA1.discordId}> vs <@${playerA2.discordId}>`+ 
                            `\nDuel B: <@${playerB1.discordId}> vs <@${playerB2.discordId}>`+ 
                            `\nDuel C: <@${playerC1.discordId}> vs <@${playerC2.discordId}>`
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
    
                        const {player: playerA1} = await Entry.findOne({ where: { teamId: winningTeam.id, tournamentId: tournament.id, slot: 'A' }, include: Player })
                        const {player: playerA2} = await Entry.findOne({ where: { teamId: winnerNextTeam.id, tournamentId: tournament.id, slot: 'A' }, include: Player})

                        try {
                            const pA1Member = await interaction.guild?.members.fetch(playerA1.discordId)
                            pA1Member.user.send(
                                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                                `\nServer: ${server.name} ${server.logo}` +
                                `\nChannel: <#${tournament.channelId}>` +
                                `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                                `\nDiscord: ${playerA2.name}${playerA2.discriminator !== '0' ? `#${playerA2.discriminator}` : ''}` +
                                `\n${format?.category === 'OP' ? `OPTCGSim: ${playerA2.opTcgSim}` : `DuelingBook: ${playerA2.duelingBook}`}`
                            )
                        } catch (err) {
                            console.log(err)
                        }
    
                        try {
                            const pA2Member = await interaction.guild?.members.fetch(playerA2.discordId)
                            pA2Member.user.send(
                                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                                `\nServer: ${server.name} ${server.logo}` +
                                `\nChannel: <#${tournament.channelId}>` +
                                `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                                `\nDiscord: ${playerA1.name}${playerA1.discriminator !== '0' ? `#${playerA1.discriminator}` : ''}` +
                                `\n${format?.category === 'OP' ? `OPTCGSim: ${playerA1.opTcgSim}` : `DuelingBook: ${playerA1.duelingBook}`}`
                            )
                        } catch (err) {
                            console.log(err)
                        }

                        const {player: playerB1} = await Entry.findOne({ where: { teamId: winningTeam.id, tournamentId: tournament.id, slot: 'B' }, include: Player})
                        const {player: playerB2} = await Entry.findOne({ where: { teamId: winnerNextTeam.id, tournamentId: tournament.id, slot: 'B' }, include: Player})

                        try {
                            const pB1Member = await interaction.guild?.members.fetch(playerB1.discordId)
                            pB1Member.user.send(
                                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                                `\nServer: ${server.name} ${server.logo}` +
                                `\nChannel: <#${tournament.channelId}>` +
                                `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                                `\nDiscord: ${playerB2.name}${playerB2.discriminator !== '0' ? `#${playerB2.discriminator}` : ''}` +
                                `\n${format?.category === 'OP' ? `OPTCGSim: ${playerB2.opTcgSim}` : `DuelingBook: ${playerB2.duelingBook}`}`
                            )
                        } catch (err) {
                            console.log(err)
                        }
    
                        try {
                            const pB2Member = await interaction.guild?.members.fetch(playerB2.discordId)
                            pB2Member.user.send(
                                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                                `\nServer: ${server.name} ${server.logo}` +
                                `\nChannel: <#${tournament.channelId}>` +
                                `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                                `\nDiscord: ${playerB1.name}${playerB1.discriminator !== '0' ? `#${playerB1.discriminator}` : ''}` +
                                `\n${format?.category === 'OP' ? `OPTCGSim: ${playerB1.opTcgSim}` : `DuelingBook: ${playerB1.duelingBook}`}`
                            )
                        } catch (err) {
                            console.log(err)
                        }

                        const {player: playerC1} = await Entry.findOne({ where: { teamId: winningTeam.id, tournamentId: tournament.id, slot: 'C' }, include: Player})
                        const {player: playerC2} = await Entry.findOne({ where: { teamId: winnerNextTeam.id, tournamentId: tournament.id, slot: 'C' }, include: Player})

                        try {
                            const pC1Member = await interaction.guild?.members.fetch(playerC1.discordId)
                            pC1Member.user.send(
                                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                                `\nServer: ${server.name} ${server.logo}` +
                                `\nChannel: <#${tournament.channelId}>` +
                                `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                                `\nDiscord: ${playerC2.name}${playerC2.discriminator !== '0' ? `#${playerC2.discriminator}` : ''}` +
                                `\n${format?.category === 'OP' ? `OPTCGSim: ${playerC2.opTcgSim}` : `DuelingBook: ${playerC2.duelingBook}`}`
                            )
                        } catch (err) {
                            console.log(err)
                        }
    
                        try {
                            const pC2Member = await interaction.guild?.members.fetch(playerC2.discordId)
                            pC2Member.user.send(
                                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                                `\nServer: ${server.name} ${server.logo}` +
                                `\nChannel: <#${tournament.channelId}>` +
                                `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                                `\nDiscord: ${playerC1.name}${playerC1.discriminator !== '0' ? `#${playerC1.discriminator}` : ''}` +
                                `\n${format?.category === 'OP' ? `OPTCGSim: ${playerC1.opTcgSim}` : `DuelingBook: ${playerC1.duelingBook}`}`
                            )
                        } catch (err) {
                            console.log(err)
                        }

                        await interaction.channel.send({
                            content: `New Team Match: ${winningTeam.name} vs. ${winnerNextTeam.name}. Good luck to both teams.` + 
                                `\nDuel A: <@${playerA1.discordId}> vs <@${playerA2.discordId}>`+ 
                                `\nDuel B: <@${playerB1.discordId}> vs <@${playerB2.discordId}>`+ 
                                `\nDuel C: <@${playerC1.discordId}> vs <@${playerC2.discordId}>`
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
    return challongeMatch
}

//SEND TEAM PAIRINGS
export const sendTeamPairings = async (guild, server, tournament) => {
    const matches = [...await getMatches(server, tournament.id)].map((el) => el.match).filter((match) => match.state === 'open')
    
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i]
        const round = tournament.type === 'double elimination' && match.round < 0 ? `Losers Round ${Math.abs(match.round)}` :
            tournament.type === 'double elimination' && match.round > 0 ? `Winners Round ${Math.abs(match.round)}` :
            `Round ${match.round}`
  
        const {player: playerA1} = await Entry.findOne({ where: { participantId: match.player1_id, tournamentId: tournament.id, slot: 'A' }, include: Player })
        const {player: playerA2} = await Entry.findOne({ where: { participantId: match.player2_id, tournamentId: tournament.id, slot: 'A' }, include: Player })
        
        try {
            const pA1Member = await guild.members.fetch(playerA1.discordId)
            pA1Member.user.send(
                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${tournament.channelId}>` +
                `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                `\nDiscord: ${playerA2.name}${playerA2.discriminator !== '0' ? `#${playerA2.discriminator}` : ''}` +
                `\n${tournament.format?.category === 'OP' ? `OPTCGSim: ${playerA2.opTcgSim}` : `DuelingBook: ${playerA2.duelingBook}`}`
            )
        } catch (err) {
            console.log(err)
        }

        try {
            const pA2Member = await guild.members.fetch(playerA2.discordId)
            pA2Member.user.send(
                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${tournament.channelId}>` +
                `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                `\nDiscord: ${playerA1.name}${playerA1.discriminator !== '0' ? `#${playerA1.discriminator}` : ''}` +
                `\n${tournament.format?.category === 'OP' ? `OPTCGSim: ${playerA1.opTcgSim}` : `DuelingBook: ${playerA1.duelingBook}`}`
            )
        } catch (err) {
            console.log(err)
        }

        const {player: playerB1} = await Entry.findOne({ where: { participantId: match.player1_id, tournamentId: tournament.id, slot: 'B' }, include: Player })
        const {player: playerB2} = await Entry.findOne({ where: { participantId: match.player2_id, tournamentId: tournament.id, slot: 'B' }, include: Player })

        try {
            const pB1Member = await guild.members.fetch(playerB1.discordId)
            pB1Member.user.send(
                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${tournament.channelId}>` +
                `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                `\nDiscord: ${playerB2.name}${playerB2.discriminator !== '0' ? `#${playerB2.discriminator}` : ''}` +
                `\n${tournament.format?.category === 'OP' ? `OPTCGSim: ${playerB2.opTcgSim}` : `DuelingBook: ${playerB2.duelingBook}`}`
            )
        } catch (err) {
            console.log(err)
        }

        try {
            const pB2Member = await guild.members.fetch(playerB2.discordId)
            pB2Member.user.send(
                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${tournament.channelId}>` +
                `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                `\nDiscord: ${playerB1.name}${playerB1.discriminator !== '0' ? `#${playerB1.discriminator}` : ''}` +
                `\n${tournament.format?.category === 'OP' ? `OPTCGSim: ${playerB1.opTcgSim}` : `DuelingBook: ${playerB1.duelingBook}`}`
            )
        } catch (err) {
            console.log(err)
        }

        const {player: playerC1} = await Entry.findOne({ where: { participantId: match.player1_id, tournamentId: tournament.id, slot: 'C' }, include: Player })
        const {player: playerC2} = await Entry.findOne({ where: { participantId: match.player2_id, tournamentId: tournament.id, slot: 'C' }, include: Player })

        try {
            const pC1Member = await guild.members.fetch(playerC1.discordId)
            pC1Member.user.send(
                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${tournament.channelId}>` +
                `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                `\nDiscord: ${playerC2.name}${playerC2.discriminator !== '0' ? `#${playerC2.discriminator}` : ''}` +
                `\n${tournament.format?.category === 'OP' ? `OPTCGSim: ${playerC2.opTcgSim}` : `DuelingBook: ${playerC2.duelingBook}`}`
            )
        } catch (err) {
            console.log(err)
        }

        try {
            const pC2Member = await guild.members.fetch(playerC2.discordId)
            pC2Member.user.send(
                `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                `\nServer: ${server.name} ${server.logo}` +
                `\nChannel: <#${tournament.channelId}>` +
                `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                `\nDiscord: ${playerC1.name}${playerC1.discriminator !== '0' ? `#${playerC1.discriminator}` : ''}` +
                `\n${tournament.format?.category === 'OP' ? `OPTCGSim: ${playerC1.opTcgSim}` : `DuelingBook: ${playerC1.duelingBook}`}`
            )
        } catch (err) {
            console.log(err)
        }
    }      
}

// SEND PAIRINGS
export const sendPairings = async (guild, server, tournament, ignoreRound1) => {
    const matches = [...await getMatches(server, tournament.id)].map((el) => el.match).filter((match) => match.state === 'open')

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i]
        if (ignoreRound1 && match.round === 1) continue
        const round = tournament.type === 'double elimination' && match.round < 0 ? `Losers Round ${Math.abs(match.round)}` :
            tournament.type === 'double elimination' && match.round > 0 ? `Winners Round ${Math.abs(match.round)}` :
            `Round ${match.round}`

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
                p1Member.user.send(
                    `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                    `\nServer: ${server.name} ${server.logo}` +
                    `\nChannel: <#${tournament.channelId}>` +
                    `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                    `\nDiscord: ${player2.name}${player2.discriminator !== '0' ? `#${player2.discriminator}` : ''}` +
                    `\n${tournament.format?.category === 'OP' ? `OPTCGSim: ${player2.opTcgSim}` : `DuelingBook: ${player2.duelingBook}`}`
                )
            } catch (err) {
                console.log(err)
            }
    
            try {
                const p2Member = await guild.members.fetch(player2.discordId)
                p2Member.user.send(
                    `New pairing for ${round} of ${tournament.name}! ${tournament.logo}` +
                    `\nServer: ${server.name} ${server.logo}` +
                    `\nChannel: <#${tournament.channelId}>` +
                    `\nFormat: ${tournament.formatName} ${tournament.emoji}` +
                    `\nDiscord: ${player1.name}${player1.discriminator !== '0' ? `#${player1.discriminator}` : ''}` +
                    `\n${tournament.format?.category === 'OP' ? `OPTCGSim: ${player1.opTcgSim}` : `DuelingBook: ${player1.duelingBook}`}`
                )
            } catch (err) {
                console.log(err)
            }
        } catch (err) {
            console.log(err)
        }
    }
}

// CALCULATE STANDINGS 
export const calculateStandings = async (matches, participants) => {
    const data = {}
    let currentRound = 1

    for (let i = 0; i < participants.length; i++) {
        const p = participants[i]

        const entry = await Entry.findOne({
            where: {
                participantId: p.participant.id
            }
        })

        if (!entry) {
            console.log(`no entry:`, p.participant)
            data[p.participant.id] = {
                participantId: p.participant.id,
                name: p.participant.name,
                rank: '',
                wins: 0,
                losses: 0,
                ties: 0,
                byes: 0,
                score: 0,
                active: p.participant.active,
                roundDropped: null,
                roundsWithoutBye: [],
                opponents: [],
                opponentScores: [],
                defeated: [],
                winsVsTied: 0,
                rawBuchholz: 0,
                medianBuchholz: 0
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
                active: entry.active,
                roundDropped: entry.roundDropped,
                roundsWithoutBye: [],
                opponents: [],
                opponentScores: [],
                defeated: [],
                winsVsTied: 0,
                rawBuchholz: 0,
                medianBuchholz: 0
            }
        }

    }

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i].match
        const round = parseInt(match.round)

        if (match.state === 'pending') {
            continue
        } else if (match.state === 'open') {
            if (round > currentRound) currentRound = round
            data[match.player1_id].roundsWithoutBye.push(round)
            data[match.player2_id].roundsWithoutBye.push(round)
        } else if (match.state === 'complete' && match.winner_id && match.loser_id) {
            if (round > currentRound) currentRound = match.round
            data[match.winner_id].wins++
            data[match.winner_id].defeated.push(match.loser_id)
            data[match.winner_id].opponents.push(match.loser_id)
            data[match.winner_id].roundsWithoutBye.push(round)
            data[match.loser_id].losses++
            data[match.loser_id].opponents.push(match.winner_id)
            data[match.loser_id].roundsWithoutBye.push(round)
        } else if (match.state === 'complete') {
            if (round > currentRound) currentRound = round
            data[match.player1_id].ties++
            data[match.player1_id].opponents.push(match.player2_id)
            data[match.player1_id].roundsWithoutBye.push(round)
            data[match.player2_id].ties++
            data[match.player2_id].opponents.push(match.player1_id)
            data[match.player2_id].roundsWithoutBye.push(round)
        }
    }

    const rounds = []
    let i = 1
    while (i <= currentRound) {
        rounds.push(i)
        i++
    }
    
    const keys = Object.keys(data)

    keys.forEach((k) => {
        for (let j = 1; j <= currentRound; j++) {
            if (!data[k].roundsWithoutBye.includes(j) && (data[k].active || data[k].roundDropped > j)) {
                console.log(`round ${j} BYE found for ${data[k].name}`)
                data[k].byes++
            }
        }
    })

    keys.forEach((k) => {
        data[k].score = data[k].wins + data[k].byes
    })

    keys.forEach((k) => {
        for (let i = 0; i < data[k].opponents.length; i++) {
            const opponentId = data[k].opponents[i]
            data[k].opponentScores.push(data[opponentId].score)
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
    })

    const standings = shuffleArray(Object.values(data)).sort((a, b) => {
        if (a.score > b.score) {
            return -1
        } else if (a.score < b.score) {
            return 1
        } else if (a.medianBuchholz > b.medianBuchholz) {
            return -1
        } else if (a.medianBuchholz < b.medianBuchholz) {
            return 1
        } else if (a.winsVsTied > b.winsVsTied) {
            return -1
        } else if (a.winsVsTied < b.winsVsTied) {
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
                    s.score === standings[index + 1].score && s.medianBuchholz > standings[index + 1].medianBuchholz || 
                    s.score === standings[index + 1].score && s.medianBuchholz === standings[index + 1].medianBuchholz && s.winsVsTied > standings[index + 1].winsVsTied
                )
            ) && (
                // and at the beginning or not tied with the previous player
                index === 0 || (
                    s.score !== standings[index - 1].score ||
                    s.medianBuchholz !== standings[index - 1].medianBuchholz || 
                    s.winsVsTied !== standings[index - 1].winsVsTied
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
            s.medianBuchholz === standings[index - 1].medianBuchholz && 
            s.winsVsTied === standings[index - 1].winsVsTied
        ) {
            // then assign the same ranking as the previous player
            s.rank = standings[index - 1].rank
        } else {
            // assign a new tied ranking for this index position
            s.rank = `T${index + 1}`
        }
    }

    return standings
}

// AUTO REGISTER TOP CUT
export const autoRegisterTopCut = async (server, tournament, topCutTournament, standings) => {
    const topCut = standings.filter((s) => {
        const rawRankValue = parseInt(s.rank.replace(/^\D+/g, ''))
        if (rawRankValue <= tournament.topCut) return s
    })
    console.log('topCut', topCut)


    const size = topCut.length
    console.log('size', size)
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
            console.log('!!entry', !!entry)

            const topCutEntry = await Entry.create({
                name: entry.name,
                playerId: entry.playerId,
                tournamentId: topCutTournament.id,
                compositeKey: `${entry.playerId}${topCutTournament.id}`,
                url: entry.url,
                ydk: entry.ydk
            })
            
            console.log('!!topCutEntry', !!topCutEntry)
            const { participant } = await postParticipant(server, topCutTournament, entry.player)
            if (!participant) errors.push(`- ${entry.name} (${i + 1} seed`)        
            await topCutEntry.update({ participantId: participant.id })
        } catch (err) {
            console.log(err)
        }
    }

    return {errors, size}
}

// CREATE TOURNAMENT
export const createTournament = async (interaction, formatName, name, abbreviation, tournament_type, channelName) => {
    const server = !interaction.guildId ? {} : 
        await Server.findOne({ where: { id: interaction.guildId }}) || 
        await Server.create({ id: interaction.guildId, name: interaction.guild.name })

    const format = await Format.findOne({
        where: {
            [Op.or]: {
                name: { [Op.iLike]: server.format || formatName },
                channel: interaction.channelId
            }
        }
    })

    const game_name = format.category === 'OP' ? 'One Piece TCG' : 'Yu-Gi-Oh!'
    const description = format.category === 'OP' ? 'One Piece TCG' : `${format.name} Format`
    const channel = interaction.guild.name !== 'Format Library' ? await interaction.guild?.channels.cache.find((channel) => channel.name === channelName) : {}
    const channelId = interaction.guild.name === 'Format Library' ? format.channel : channel?.id
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
        name.toLowerCase().includes('patron battle royale') ? emojis.baller :
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
            url: abbreviation || name,
            subdomain: server.challongeSubdomain,
            tournament_type: tournament_type,
            description: description,
            game_name: game_name,
            pts_for_match_tie: "0.0"
        } : {
            name: name,
            url: abbreviation || name,
            tournament_type: tournament_type,
            description: description,
            game_name: game_name,
            pts_for_match_tie: "0.0"
        }
        
        const { status, data } = await axios({
            method: 'post',
            url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeAPIKey}`,
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
                emoji: server.emoji || format.emoji,
                url: data.tournament.url,
                channelId: channelId,
                serverId: interaction.guildId,
                community: server.name
            })

            const subdomain = server.challongePremium ? `${server.challongeSubdomain}.` : ''
            return await interaction.editReply({ content: 
                `You created a new tournament:` + 
                `\nName: ${name} ${logo}` + 
                `\nFormat: ${format.name} ${server.emoji || format.emoji}` + 
                `\nType: ${capitalize(data.tournament.tournament_type, true)}` +
                `\nBracket: https://${subdomain}challonge.com/${data.tournament.url}`
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
                pts_for_match_tie: "0.0"
            } : {
                name: name,
                url: str,
                tournament_type: tournament_type,
                description: description,
                game_name: game_name,
                pts_for_match_tie: "0.0"
            }
            
            const { status, data } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeAPIKey}`,
                data: {
                    tournament
                }
            })
            
            if (status === 200 && data) {
                await Tournament.create({ 
                    id: data.tournament.id,
                    name: data.tournament.name,
                    state: data.tournament.state,
                    type: data.tournament.tournament_type,
                    formatName: format.name,
                    formatId: format.id,
                    logo: logo,
                    emoji: server.emoji || format.emoji,
                    url: data.tournament.url,
                    channelId: channelId,
                    serverId: interaction.guildId,
                    community: server.name
                })

                const subdomain = server.challongePremium ? `${server.challongeSubdomain}.` : ''
                return await interaction.editReply({ content: 
                    `You created a new tournament:` + 
                    `\nName: ${data.tournament.name} ${logo}` + 
                    `\nFormat: ${format.name} ${server.emoji || format.emoji}` + 
                    `\nType: ${capitalize(data.tournament.tournament_type, true)}` +
                    `\nBracket: https://${subdomain}challonge.com/${data.tournament.url}`
                })
            } 
        } catch (err) {
            console.log(err)
            return await interaction.editReply({ content: `Unable to connect to Challonge account.`})
        }
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
    console.log('interaction', interaction)
    console.log('tournamentId', tournamentId)
    const server = await Server.findOne({ where: { id: interaction.guild?.id }})
    const tournament = await Tournament.findOne({ where: { id: tournamentId }, include: Format })
    if (!tournament) return await interaction.channel.send({ content: `Tournament not found.`})

    try {
        await axios({
            method: 'post',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/start.json?api_key=${server.challongeAPIKey}`
        })

        await tournament.update({ state: 'underway' })
        interaction.channel.send({ content: `Let's go! Your tournament is starting now: https://challonge.com/${tournament.url} ${tournament.emoji}`})
        
        if (tournament.isTeamTournament) {
            return sendTeamPairings(interaction.guild, server, tournament, tournament.format)
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
            const [rounds, topCut] = entryCount <= 2 ? [1, null] :
                entryCount >= 3 && entryCount <= 4 ? [2, null] :
                entryCount >= 5 && entryCount <= 7 ? [3, null] :
                entryCount === 8 ? [3, 4] :
                entryCount >= 9 && entryCount <= 12 ? [4, 4] :
                entryCount >= 13 && entryCount <= 21 ? [5, 4] :
                entryCount >= 22 && entryCount <= 32 ? [5, 8] :
                entryCount >= 33 && entryCount <= 64 ? [6, 8] :
                entryCount >= 65 && entryCount <= 96 ? [7, 8] :
                entryCount >= 97 && entryCount <= 192 ? [7, 16] :
                entryCount >= 193 && entryCount <= 256 ? [8, 16] :
                [9, 16]

            await tournament.update({ rounds, topCut })

            await axios({
                method: 'put',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`,
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
        const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`)
    
        if (data?.tournament?.state === 'underway') {
            await tournament.update({ state: 'underway' })
            interaction.editReply({ content: `Your tournament was already underway on Challonge.com: https://challonge.com/${tournament.url} ${tournament.emoji}`})
            
            if (tournament.isTeamTournament) {
                return sendTeamPairings(interaction.guild, server, tournament)
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
    
    if (primaryTournament.assocTournamentId) {
        return await interaction.channel.send({ content: `Error: Top cut tournament was already created. ${emojis.megaphone}` })
    }

    const server = await Server.findOne({ where: { id: interaction.guildId }})  
    const subdomain = server.challongePremium ? `${server.challongeSubdomain}.` : ''
    const game_name = primaryTournament.format?.category === 'OP' ? 'One Piece TCG' : 'Yu-Gi-Oh!'
    const description = primaryTournament.format?.category === 'OP' ? 'One Piece TCG' : `${primaryTournament.format?.name} Format`
    const str = generateRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz')
    const name = `${primaryTournament.name} - Top ${primaryTournament.topCut}`
    const abbreviation = `${primaryTournament.abbreviation}_Top${primaryTournament.topCut}`
    let topCutTournament

    try {
        const tournament = server.challongeSubdomain ? {
            name: name,
            url: abbreviation,
            subdomain: server.challongeSubdomain,
            tournament_type: 'single elimination',
            description: description,
            game_name: game_name,
            pts_for_match_tie: "0.0"
        } :  {
            name: name,
            url: abbreviation,
            tournament_type: 'single elimination',
            description: description,
            game_name: game_name,
            pts_for_match_tie: "0.0"
        }

        const { status, data } = await axios({
            method: 'post',
            url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeAPIKey}`,
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
                community: primaryTournament.community,
                assocTournamentId: primaryTournament.id,
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
                url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeAPIKey}`,
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
                    community: primaryTournament.community,
                    assocTournamentId: primaryTournament.id
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
        `\nBracket: https://${subdomain}challonge.com/${topCutTournament.url}`
    })

    await primaryTournament.update({ assocTournamentId: topCutTournament.id })

    try {
        const matches = await getMatches(server, primaryTournament.id)
        const participants = await getParticipants(server, primaryTournament.id)
        const standings = await calculateStandings(matches, participants)
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
    if (tournament.state === 'complete') return await interaction.editReply({ content: `This tournament has already ended.`})

    try {
        const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`)
        if (data.tournament.state !== 'complete') {
            const { status } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}/finalize.json?api_key=${server.challongeAPIKey}`
            })

            if (status === 200) {   
                interaction.channel.send({ content: `Congrats! The results of ${tournament.name} ${tournament.logo} have been finalized on Challonge.com.`})
            } else {
                interaction.channel.send({ content: `Unable to finalize ${tournament.name} ${tournament.logo} on Challonge.com.`})
            }
        }
    } catch (err) {
        console.log(err)
        interaction.channel.send({ content: `Unable to connect to Challonge.com.`})
    }

    if (tournament.type === 'swiss' && !tournament.assocTournamentId) {
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
    } else {
        let event = await Event.findOne({ where: { primaryTournamentId: tournament.id }})

        if (!event) {
            event = await Event.create({
                name: tournament.name,
                abbreviation: tournament.abbreviation,
                formatName: tournament.formatName,
                formatId: tournament.formatId,
                referenceUrl: `https://challonge.com/${tournament.url}`,
                display: false,
                tournamentId: tournament.id,
                primaryTournamentId: tournament.id,
                secondaryTournamentId: tournament.assocTournamentId,
                type: tournament.type,
                isTeamEvent: tournament.isTeamTournament,
                community: tournament.community,
                logo: tournament.logo,
                emoji: tournament.emoji
            })
        }

        if (event && !event.playerId) {
            try {
                const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${event.secondaryTournamentId || tournament.id}/participants.json?api_key=${server.challongeAPIKey}`)
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
                    await event.update({ winner: winningTeam.name })
                    console.log(`Marked ${winningTeam.name} as the winner of ${event.name}.`)
                } else {
                    const winningEntry = await Entry.findOne({ where: { participantId: parseInt(winnerParticipantId) }})
                    await event.update({
                        winner: winningEntry.playerName,
                        playerId: winningEntry.playerId
                    })
                    console.log(`Marked ${winningEntry.playerName} as the winner of ${event.name}.`)
                }
            } catch (err) {
                console.log(err)
            }
        }

        if (event && !event.size) {
            try {
                const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`)
                const size = event.size || data.tournament.participants_count
                const startDate = data.tournament.started_at ? `${data.tournament.started_at.slice(0, 10)} ${data.tournament.started_at.slice(11, 26)}` : ''
                const endDate = data.tournament.completed_at ? `${data.tournament.completed_at.slice(0, 10)} ${data.tournament.completed_at.slice(11, 26)}` : ''

                await event.update({
                    size,
                    startDate,
                    endDate
                })

                console.log(`Recorded size, start date, and end date for ${event.name}`)
            } catch (err) {
                console.log(err)
            }
        }

        let count = await Deck.count({ where: { eventId: event.id }})
        
        if (event && event.size > 0 && ((!event.isTeamEvent && event.size !== count) || (event.isTeamEvent && (event.size * 3) !== count))) {
            try {
                const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeAPIKey}`)
                const success = await createDecks(event, data)
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

                    const count = await Entry.count({ 
                        where: {
                            playerId: playerId,
                            active: true,
                            '$tournament.serverId$': server.id
                        },
                        include: Tournament,
                    })

                    if (!count) {
                        const member = await interaction.guild?.members.fetch(discordId)
                        if (!member) continue
                        console.log(`Removing ${playerName}'s tournament role on ${server.name}.`)
                        member.roles.remove(server.tourRole)
                    }
                } catch (err) {
                    console.log(err)
                }
            }

            await tournament.update({ state: 'complete' })
            return await interaction.editReply({ content: `Congrats! The results of ${tournament.name} ${tournament.logo} have been finalized.`})
        }
    }
}


// END TOURNAMENT
export const endTournament = async (interaction, tournamentId) => {
    const server = await Server.findOrCreateByIdOrName(interaction.guildId, interaction.guild?.name)
    const tournament = await Tournament.findOne({ where: { id: tournamentId }, include: Format })
    if (!tournament) return
    
    if (tournament.state === 'pending' || tournament.state === 'standby') return await interaction.editReply({ content: `This tournament has not begun.`})
    if (tournament.state === 'complete') return await interaction.editReply({ content: `This tournament has already ended.`})

    try {
        const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`)
        if (data.tournament.state !== 'complete') {
            const { status } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}/finalize.json?api_key=${server.challongeAPIKey}`
            })

            if (status === 200) {   
                interaction.channel.send({ content: `Congrats! The results of ${tournament.name} ${tournament.logo} have been finalized on Challonge.com.`})
            } else {
                interaction.channel.send({ content: `Unable to finalize ${tournament.name} ${tournament.logo} on Challonge.com.`})
            }
        }
    } catch (err) {
        console.log(err)
        interaction.channel.send({ content: `Unable to connect to Challonge.com.`})
    }

    let event = await Event.findOne({ where: { primaryTournamentId: tournament.id }})

    if (!event) {
        event = await Event.create({
            name: tournament.name,
            abbreviation: tournament.abbreviation,
            formatName: tournament.formatName,
            formatId: tournament.formatId,
            referenceUrl: `https://challonge.com/${tournament.url}`,
            display: false,
            tournamentId: tournament.id,
            primaryTournamentId: tournament.id,
            topCutTournamentId: tournament.assocTournamentId, 
            type: tournament.type,
            isTeamEvent: tournament.isTeamTournament,
            community: tournament.community,
            logo: tournament.logo,
            emoji: tournament.emoji
        })
    }

    if (event && !event.playerId) {
        try {
            const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${event.topCutTournamentId || tournament.id}/participants.json?api_key=${server.challongeAPIKey}`)
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
                await event.update({ winner: winningTeam.name })
                console.log(`Marked ${winningTeam.name} as the winner of ${event.name}.`)
            } else {
                const winningEntry = await Entry.findOne({ where: { participantId: parseInt(winnerParticipantId) }})
                await event.update({
                    winner: winningEntry.playerName,
                    playerId: winningEntry.playerId
                })
                console.log(`Marked ${winningEntry.playerName} as the winner of ${event.name}.`)
            }
        } catch (err) {
            console.log(err)
        }
    }

    if (event && !event.size) {
        try {
            const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`)
            const size = event.size || data.tournament.participants_count
            const startDate = data.tournament.started_at ? `${data.tournament.started_at.slice(0, 10)} ${data.tournament.started_at.slice(11, 26)}` : ''
            const endDate = data.tournament.completed_at ? `${data.tournament.completed_at.slice(0, 10)} ${data.tournament.completed_at.slice(11, 26)}` : ''

            await event.update({
                size,
                startDate,
                endDate
            })

            console.log(`Recorded size, start date, and end date for ${event.name}`)
        } catch (err) {
            console.log(err)
        }
    }

    let count = await Deck.count({ where: { eventId: event.id }})
    
    if (event && event.size > 0 && ((!event.isTeamEvent && event.size !== count) || (event.isTeamEvent && (event.size * 3) !== count))) {
        try {
            const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeAPIKey}`)
            const success = await createDecks(event, data)
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

                const count = await Entry.count({ 
                    where: {
                        playerId: playerId,
                        active: true,
                        '$tournament.serverId$': server.id
                    },
                    include: Tournament,
                })

                if (!count) {
                    const member = await interaction.guild?.members.fetch(discordId)
                    if (!member) continue
                    console.log(`Removing ${playerName}'s tournament role on ${server.name}.`)
                    member.roles.remove(server.tourRole)
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
    if (tournament.state !== 'underway') return await interaction.editReply({ content: `Sorry, ${tournament.name} is not underway.`})
    
    const noShowEntry = await Entry.findOne({ where: { playerId: noShowPlayer.id, tournamentId: tournament.id } })
    if (!noShowEntry) return await interaction.editReply({ content: `Sorry I could not find that player's tournament entry in the database.`})

    const matchesArr = await getMatches(server, tournament.id)
    let winnerParticipantId = false
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.state !== 'open') continue
        winnerParticipantId = findNoShowOpponent(match, noShowEntry.participantId)
        if (winnerParticipantId) break
    }

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
    const standings = await calculateStandings(matches, participants)
    const results = [ `${tournament.logo} - ${tournament.name} Standings - ${tournament.emoji}` , `__Rk.  Name  -  Score  (W-L-T)  [Med-Buch / WvT]__`]

    for (let index = 0; index < standings.length; index++) {
        const s = standings[index]
        if (
            (
                // if at the end or has a better score/tie-breakers than the next player
                index + 1 === standings.length || (
                    s.score > standings[index + 1].score || 
                    s.score === standings[index + 1].score && s.medianBuchholz > standings[index + 1].medianBuchholz || 
                    s.score === standings[index + 1].score && s.medianBuchholz === standings[index + 1].medianBuchholz && s.winsVsTied > standings[index + 1].winsVsTied
                )
            ) && (
                // and at the beginning or not tied with the previous player
                index === 0 || (
                    s.score !== standings[index - 1].score ||
                    s.medianBuchholz !== standings[index - 1].medianBuchholz || 
                    s.winsVsTied !== standings[index - 1].winsVsTied
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
            s.medianBuchholz === standings[index - 1].medianBuchholz && 
            s.winsVsTied === standings[index - 1].winsVsTied
        ) {
            // then assign the same ranking as the previous player
            s.rank = standings[index - 1].rank
        } else {
            // assign a new tied ranking for this index position
            s.rank = `T${index + 1}`
        }

        results.push(`${s.rank}.  ${s.name}  -  ${s.score.toFixed(1)}  (${s.wins}-${s.losses}-${s.ties})${s.byes ? ` +BYE` : ''}  [${s.medianBuchholz.toFixed(1)} / ${s.winsVsTied}]`)
    }

    return await interaction.channel.send(results.join('\n'))
}
