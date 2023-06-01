
//DECK FUNCTIONS

//MODULE IMPORTS
import axios from 'axios'
import { Op } from 'sequelize'
import { Card, OPCard, Format, Status, Deck } from '@fl/models'
import { convertArrayToObject } from './utility.js'

// COMPARE DECKS
export const compareDecks = (arr1, arr2) => {
    let score = 0
    let avgSize = (arr1.length + arr2.length) / 2

    for (let i = 0; i < arr1.length; i++) {
        const id = arr1[i]
        const index = arr2.indexOf(id)
        if (index !== -1) {
            score++
            arr2.splice(index, 1)
        }
    }

    return score / avgSize
}

// GET DECK FORMAT
export const getDeckFormat = async (server, message, interaction) => {
    let format = await Format.findOne({ 
        where: { 
            [Op.or]: {
                name: { [Op.iLike]: server.format },
                channel: interaction.channelId
            }
        }
    })

    if (format) return format
    const filter = m => m.author.id === message.author.id
    message.channel.send({ content: `What format would you like to check?`})
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 15000
    }).then(async collected => {
        const response = collected.first().content.toLowerCase()
        const format = await Format.findOne({ where: { name: {[Op.iLike]: response } } })
        if (!format) message.channel.send({ content: `Sorry, I do not recognize that format.`})
        return format
    }).catch(err => {
        console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
    })
}

// GET ISSUES
export const getIssues = async (deckArr, format) => {
    const deck = convertArrayToObject(deckArr)        
    const cardIds = !format.date ? [...await Card.findAll({ where: { tcgLegal: true }})].map(c => c.konamiCode) : [...await Card.findAll({ where: { tcgDate: { [Op.lte]: format.date } }})].map(c => c.konamiCode)
    const forbiddenIds = [...await Status.findAll({ where: { banlist: [format.banlist], restriction: 'forbidden' }, include: Card })].map(s => s.card.konamiCode)
    const limitedIds = [...await Status.findAll({ where: { banlist: [format.banlist], restriction: 'limited' }, include: Card })].map(s => s.card.konamiCode)
    const semiIds = [...await Status.findAll({ where: { banlist: [format.banlist], restriction: 'semi-limited' }, include: Card })].map(s => s.card.konamiCode)

    const illegalCards = []
    const forbiddenCards = []
    const limitedCards = []
    const semiLimitedCards = []
    const unrecognizedCards = []

    const keys = Object.keys(deck)
    for (let i = 0; i < keys.length; i++) {
        let konamiCode = keys[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode 
        if (konamiCode === '00000000' && format.name === 'Current') continue
        if (!cardIds.includes(konamiCode)) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) {
                illegalCards.push(card.name)
            } else {
                unrecognizedCards.push(konamiCode)
            }
        } else if (forbiddenIds.includes(konamiCode)) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) forbiddenCards.push(card.name)
        } else if (limitedIds.includes(konamiCode) && deck[konamiCode] > 1) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) limitedCards.push(card.name)
        } else if (semiIds.includes(konamiCode) && deck[konamiCode] > 2) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) semiLimitedCards.push(card.name)
        }
    }
    
    illegalCards.sort()
    forbiddenCards.sort()
    limitedCards.sort()
    semiLimitedCards.sort()
    unrecognizedCards.sort()

    const issues = {
        illegalCards,
        forbiddenCards,
        limitedCards,
        semiLimitedCards,
        unrecognizedCards
    }

    return issues
}

//CHECK DECK LIST
export const checkDeckList = async (member, format) => {  
    const filter = m => m.author.id === member.user.id
    const message = await member.send({ content: `Please provide a duelingbook.com/deck link for the ${format.name} Format ${format.emoji} deck you would like to check.`}).catch((err) => console.log(err))
    if (!message || !message.channel) return {}
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000
    }).then(async collected => {
        const response = collected.first().content
        if (response.includes('duelingbook.com/deck?id=')) {		
            const id = response.slice(response.indexOf('?id=') + 4)
            const {data} = await axios.get(`https://www.duelingbook.com/php-scripts/load-deck.php/deck?id=${id}`)
            if (!data) return member.send(`Error: Unable to load duelingbook.com/deck link.`).catch((err) => console.log(err))    

            const main = data.main.map((e) => e.serial_number)
            const minimum = format.category === 'Speed' ? 20 : 40
            if (main.length < minimum) return member.send(`I'm sorry, your deck must contain at least ${minimum} cards.`).catch((err) => console.log(err))    

            const side = data.side.map((e) => e.serial_number)
            const extra = data.extra.map((e) => e.serial_number)
            const deckArr = [...main, ...side, ...extra]
            const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards } = await getIssues(deckArr, format)

            if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length) {      
                let response = [`I'm sorry, ${member.user.username}, your deck is not legal for ${format.name} Format. ${format.emoji}`]
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
            } else if (unrecognizedCards.length) {
                let response = `I'm sorry, ${member.user.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
                response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact an admin to resolve this.`
                return await member.send({ content: response }).catch((err) => console.log(err))
            } else {
                return await member.send({ content: `Congrats, your ${format.name} Format deck is perfectly legal! ${format.emoji}`}).catch((err) => console.log(err))
            }
        } else {
            return member.send({ content: "Sorry, I only accept duelingbook.com/deck links."}).catch((err) => console.log(err))    
        }
    }).catch(err => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}

//CHECK OP DECK LIST
export const checkOPDeckList = async (member, format) => {  
    const filter = m => m.author.id === member.user.id
    const message = await member.send({ content: `Please paste your OPTCGSim deck list from the clipboard.`}).catch((err) => console.log(err))
    if (!message || !message.channel) return {}
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000
    }).then(async collected => {
        const opdk = collected.first().content
        const opdkArr = opdk.trim().split('\n')
        console.log('opdkArr', opdkArr)
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
            console.log('cardCode', cardCode)
            const card = await OPCard.findOne({ where: { cardCode }})
            if (!card) {
                unrecognizedCards.push(cardCode)
            } else if (!card.westernLegal) {
                illegalCards.push(`${card.cardCode} ${card.name}`)
            } else {
                cards.push([copyNumber, card])
            }
        }

        console.log('unrecognizedCards', unrecognizedCards)
        console.log('illegalCards', illegalCards)
        console.log('wrongColorCards', wrongColorCards)

        if (unrecognizedCards.length) return member.send(`The following cards are unrecognized:\n${unrecognizedCards.join('\n')}`)
        if (illegalCards.length) return member.send(`The following cards are unrecognized:\n${unrecognizedCards.join('\n')}`)
        if (deckSize !== 51) return member.send(`Your main deck is not 50 cards.`)
        if (moreThanFour) return member.send(`You cannot use more than 4 copies of a card in your deck.`)

        const leader = cards[0][1]
        const allowedColors = leader.color.split('-')

        for (let i = 1; i < cards.length; i++) {
            const card = cards[i]
            if (!allowedColors.includes(card.color)) {
                wrongColorCards.push(`${card.cardCode} ${card.name} (${card.color})`)
            }
        }

        if (wrongColorCards.length) return member.send(`You cannot use the following cards in a deck led by ${leader.cardCode} ${leader.name} (${leader.color}):\n${wrongColorCards.join('\n')}`)
        return await member.send({ content: `Congrats, your ${format.name} deck is perfectly legal! ${format.emoji}`}).catch((err) => console.log(err))
    }).catch(err => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}

//GET DECK TYPE
export const getDeckType = async (ydk, format) => {
    const main = ydk.split('#extra')[0]
    if (!main) return
    const primaryDeckArr = main.split('\n').filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()

    const labeledDecks = await Deck.findAll({
        where: {
            type: {[Op.not]: 'Other' },
            deckTypeId: {[Op.not]: null },
            formatName: format
        }
    })

    const similarityScores = []

    for (let i = 0; i < labeledDecks.length; i++) {
        const otherDeck = labeledDecks[i]
        const otherMain = otherDeck.ydk.split('#extra')[0]
        if (!otherMain) continue
        const comparisonDeckArr = otherMain.split('\n').filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()

        const score = compareDecks(primaryDeckArr, comparisonDeckArr)
        similarityScores.push([score, otherDeck.type])
    }

    similarityScores.sort((a, b) => {
        if (a[0] > b[0]) {
            return -1
        } else if (a[0] < b[0]) {
            return 1
        } else {
            return 0
        }
    })
    
    if (similarityScores[0][0] > 0.5) {
        return similarityScores[0][1]  
    } else {
        return null
    }
  
}