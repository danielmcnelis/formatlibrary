
//DECK FUNCTIONS

//MODULE IMPORTS
import axios from 'axios'
const FuzzySet = require('fuzzyset')
import { Op } from 'sequelize'
import { Card, Format, Status, Deck, DeckType } from '@fl/models'
import { convertArrayToObject, fetchSkillCardNames, findCard } from './utility.js'

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
    const [dateType, legalType] = format.category === 'TCG' ? ['tcgDate', 'isTcgLegal'] :    
        format.category === 'OCG' ? ['ocgDate', 'isOcgLegal'] :
        format.category === 'Speed' ? ['speedDate', 'isSpeedLegal'] :
        ['tcgDate', 'isTcgLegal']

    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const formatDate = format.name === 'Current' || format.name === 'Traditional' ? `${year}-${month}-${day}` : format.date

    const cardIds = format.category === 'Custom' ? [...await Card.findAll()].map(c => c.konamiCode) : [...await Card.findAll({ where: { [legalType]: true, [dateType]: { [Op.lte]: formatDate } }})].map(c => c.konamiCode)
    const forbiddenIds = [...await Status.findAll({ where: { banlist: format.banlist, category: format.category, restriction: 'forbidden' }, include: Card })].map(s => s.card.konamiCode)
    const limitedIds = [...await Status.findAll({ where: { banlist: format.banlist, category: format.category, restriction: 'limited' }, include: Card })].map(s => s.card.konamiCode)
    const semiIds = [...await Status.findAll({ where: { banlist: format.banlist, category: format.category, restriction: 'semi-limited' }, include: Card })].map(s => s.card.konamiCode)
    
    const limited1Ids = [...await Status.findAll({ where: { banlist: format.banlist, category: format.category, restriction: 'limited-1' }, include: Card })].map(s => s.card.konamiCode)
    const limited2Ids = [...await Status.findAll({ where: { banlist: format.banlist, category: format.category, restriction: 'limited-2' }, include: Card })].map(s => s.card.konamiCode)
    const limited3Ids = [...await Status.findAll({ where: { banlist: format.banlist, category: format.category, restriction: 'limited-3' }, include: Card })].map(s => s.card.konamiCode)
    
    const illegalCards = []
    const forbiddenCards = []
    const limitedCards = []
    const semiLimitedCards = []
    const unrecognizedCards = []

    let limited1Cards = []
    let limited2Cards = []
    let limited3Cards = []

    let limited1Count = 0
    let limited2Count = 0
    let limited3Count = 0

    const keys = Object.keys(deck)
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
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
        } else if ((format.isHighlander || limitedIds.includes(konamiCode)) && deck[key] > 1) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) limitedCards.push(card.name)
        } else if (semiIds.includes(konamiCode) && deck[key] > 2) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) semiLimitedCards.push(card.name)
        } else if (limited1Ids.includes(konamiCode)) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) limited1Cards.push(card.name)
            limited1Count += deck[key]
        } else if (limited2Ids.includes(konamiCode)) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) limited2Cards.push(card.name)
            limited2Count += deck[key]
        } else if (limited3Ids.includes(konamiCode)) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) limited3Cards.push(card.name)
            limited3Count += deck[key]
        }
    }

    if (limited1Count <= 1) limited1Cards = []
    if (limited2Count <= 2) limited2Cards = []
    if (limited3Count <= 3) limited3Cards = []
    
    illegalCards.sort()
    forbiddenCards.sort()
    limitedCards.sort()
    semiLimitedCards.sort()
    unrecognizedCards.sort()
    limited1Cards.sort()
    limited2Cards.sort()
    limited3Cards.sort()

    const issues = {
        illegalCards,
        forbiddenCards,
        limitedCards,
        semiLimitedCards,
        unrecognizedCards,
        limited1Cards,
        limited2Cards,
        limited3Cards
    }

    return issues
}

//CHECK DECK LIST
export const checkDeckList = async (member, format) => {  
    const filter = m => m.author.id === member.user.id
    const message = await member.send({ content: `Please provide a **__YDK File__** for the ${format.name} Format ${format.emoji} deck you would like to check.`}).catch((err) => console.log(err))
    if (!message || !message.channel) return {}
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000
    }).then(async collected => {
        const url = collected.first()?.attachments?.first()?.url
        if (url) {
            const {data: ydk} = await axios.get(url)
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

            const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards } = issues
            if (!illegalCards || !forbiddenCards || !limitedCards || !semiLimitedCards || !unrecognizedCards) return false
            
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
            
                return false
            } else if (unrecognizedCards.length) {
                let response = `I'm sorry, ${member.user.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
                response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
                
                member.send({ content: response.toString() }).catch((err) => console.log(err))
                return false
             } else {
                return await member.send({ content: `Congrats, your ${format.name} Format deck is perfectly legal! ${format.emoji}`}).catch((err) => console.log(err))
            }
        } else {
            member.send({ content: "Sorry, I only accept YDK Files."}).catch((err) => console.log(err))    
            return false  
        }
    }).catch(err => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}

//CHECK SPEED DECK LIST
export const checkSpeedDeckList = async (member, format, skillCard) => {  
    const filter = m => m.author.id === member.user.id
    const message = await member.send({ content: `Please provide a **__YDK File__** for the ${format.name} Format ${format.emoji} deck you would like to check.`}).catch((err) => console.log(err))
    if (!message || !message.channel) return {}
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000
    }).then(async collected => {
        const url = collected.first()?.attachments?.first()?.url
        if (url) {
            const {data: ydk} = await axios.get(url)
            const main = ydk.split('#main')[1].split('#extra')[0].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)
            const extra = ydk.split('#extra')[1].split('!side')[0].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)
            const side = ydk.split('!side')[1].split(/[\s]+/).map((e) => e.replace(/\D/g,'')).filter((e) => e.length)    
            const minimum = format.category === 'Speed' ? 20 : 40

            if (main?.length < minimum) {
                member.send(`I'm sorry, your deck must contain at least ${minimum} cards.`).catch((err) => console.log(err))    
                return false 
            }

            const deckArr = [...main, ...side, ...extra, skillCard.konamiCode]
            const { illegalCards, forbiddenCards, limited1Cards, limited2Cards, limited3Cards, unrecognizedCards } = await getIssues(deckArr, format)
            if (!illegalCards || !forbiddenCards || !limited1Cards || !limited2Cards || !limited3Cards || !unrecognizedCards) return false
           
            if (illegalCards.length || forbiddenCards.length || limited1Cards.length || limited2Cards.length || limited3Cards.length) {      
                let response = [`I'm sorry, ${member.user.username}, your deck is not legal for ${format.name} Format. ${format.emoji}`]
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
                return await member.send({ content: `Congrats, your ${format.name} Format deck is perfectly legal! ${format.emoji}`}).catch((err) => console.log(err))
            }
        } else {
            member.send({ content: "Sorry, I only accept YDK Files."}).catch((err) => console.log(err))    
            return false  
        }
    }).catch(err => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}

// GET SKILL CARD
export const getSkillCard = async (member, format, returnCard = false) => {
    const fuzzySkillCards = FuzzySet([], false)

    try {
        const names = await fetchSkillCardNames()
        names.forEach((card) => fuzzySkillCards.add(card))
    } catch (err) {
        console.log(err)
    }

    const filter = m => m.author.id === member.user.id
    const message = await member.user.send({ content: `What Skill Card does your deck use?`})
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 15000
    }).then(async (collected) => {
        const query = collected.first().content.toLowerCase()
        const card_name = await findCard(query, fuzzySkillCards)

        const skillCard = await Card.findOne({
            where: {
                name: card_name,
                category: 'Skill'
            }
        })

        if (!skillCard) {
            message.channel.send({ content: `Sorry, could not find Skill card.`})
            return false
        } else if (returnCard) {
            return skillCard
        } else {
            return checkSpeedDeckList(member, format, skillCard)
        }
    }).catch((err) => {
        console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
    })
}

//GET DECK TYPE
export const getDeckType = async (deckfile, formatName) => {
    const main = deckfile?.split('#extra')[0]
    if (!main) return
    const primaryDeckArr = main.split(/[\s]+/).filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()

    const labeledDecks = await Deck.findAll({
        where: {
            deckTypeName: {[Op.not]: 'Other' },
            deckTypeId: {[Op.not]: null },
            formatName: formatName
        },
        include: DeckType
    })

    const similarityScores = []

    for (let i = 0; i < labeledDecks.length; i++) {
        const otherDeck = labeledDecks[i]
        const otherMain = otherDeck.ydk.split('#extra')[0]
        if (!otherMain) continue
        const comparisonDeckArr = otherMain.split(/[\s]+/).filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()

        const score = compareDecks(primaryDeckArr, comparisonDeckArr)
        similarityScores.push([score, otherDeck.deckType])
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
    
    if (similarityScores[0]?.[0] > 0.5) {
        return similarityScores[0][1]  
    } else {
        const deckType = await DeckType.findOne({ where: { name: 'Other' }})
        return deckType
    }
  
}