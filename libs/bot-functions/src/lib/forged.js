import axios from "axios"
import { Card, ForgedInventory, ForgedPrint, Status } from "@fl/models"
import { Op } from "sequelize"
import { emojis } from '@fl/bot-emojis'
import { convertArrayToObject } from "./utility"

// GET FORGED ISSUES
export const getForgedIssues = async (player, deckArr, format) => {
    const deck = convertArrayToObject(deckArr)   
    const cardIds = [...await ForgedPrint.findAll({ include: Card })].flatMap(fp => [fp.card.konamiCode, fp.card.ypdId])
    const forbiddenIds = [...await Status.findAll({ where: { banlist: format.banlist, category: 'Forged', restriction: 'forbidden' }, include: Card })].flatMap(s => [s.card.konamiCode, s.card.ydpId])
    const limitedIds = [...await Status.findAll({ where: { banlist: format.banlist, category: 'Forged', restriction: 'limited' }, include: Card })].flatMap(s => [s.card.konamiCode, s.card.ydpId])
    const semiIds = [...await Status.findAll({ where: { banlist: format.banlist, category: 'Forged', restriction: 'semi-limited' }, include: Card })].flatMap(s => [s.card.konamiCode, s.card.ydpId])
    
    const illegalCards = []
    const forbiddenCards = []
    const limitedCards = []
    const semiLimitedCards = []
    const unrecognizedCards = []

    const totalQuantities = {}

    const keys = Object.keys(deck)
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        let konamiCode = keys[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode 
        if (konamiCode === '00000000' && format.name === 'Advanced') continue
        const card = await Card.findOne({ where: { [Op.or]: { konamiCode: konamiCode, ypdId: konamiCode } } })

        totalQuantities[card.name] = deck[key]

        if (!cardIds.includes(konamiCode)) {
            if (card) {
                illegalCards.push(card.name)
            } else {
                unrecognizedCards.push(konamiCode)
            }
        } else if (forbiddenIds.includes(konamiCode)) {
            if (card) forbiddenCards.push(card.name)
        } else if ((format.isHighlander || limitedIds.includes(konamiCode)) && deck[key] > 1) {
            if (card) limitedCards.push(card.name)
        } else if (semiIds.includes(konamiCode) && deck[key] > 2) {
            if (card) semiLimitedCards.push(card.name)
        }
    }

    const quantityKeys = Object.keys(totalQuantities)
    const zeroCopiesOwned = []
    const oneCopyOwned = []
    const twoCopiesOwned = []

    for (let i = 0; i < quantityKeys.length; i++) {
        const quantityKey = quantityKeys[i]
        let quantityOwned = 0

        const invs = await ForgedInventory.findAll({
            where: {
                playerId: player.id,
                cardName: quantityKey
            }
        })

        for (let j = 0; j < invs.length; j++) {
            const inv = invs[j]
            quantityOwned+=inv.quantity
        }

        if (quantityOwned < totalQuantities[quantityKey]) {
            if (quantityOwned === 0 && !illegalCards.includes(quantityKey)) {
                zeroCopiesOwned.push(quantityKey)
            } else if (quantityOwned === 1) {
                oneCopyOwned.push(quantityKey)
            } else if (quantityOwned === 2) {
                twoCopiesOwned.push(quantityKey)
            }
        }
    }
    
    illegalCards.sort()
    forbiddenCards.sort()
    limitedCards.sort()
    semiLimitedCards.sort()
    unrecognizedCards.sort()
    zeroCopiesOwned.sort()
    oneCopyOwned.sort()
    twoCopiesOwned.sort()

    const issues = {
        illegalCards,
        forbiddenCards,
        limitedCards,
        semiLimitedCards,
        unrecognizedCards,
        zeroCopiesOwned,
        oneCopyOwned,
        twoCopiesOwned
    }

    return issues
}


//GET DECK LIST
export const getForgedDeckList = async (member, player, format, override = false, unranked = false) => {            
    const filter = m => m.author.id === (member.id || member.user?.id)
    const pronoun = override ? `${player.name}'s` : 'your'
    const pronoun2 = override ? 'They' : 'You'
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
            const issues = await getForgedIssues(player, deckArr, format)
            console.log('getForgedIssues issues', issues)
            if (!issues) return false

            const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards, zeroCopiesOwned, oneCopyOwned, twoCopiesOwned } = issues
            if (!illegalCards || !forbiddenCards || !limitedCards || !semiLimitedCards || !unrecognizedCards || !zeroCopiesOwned || !oneCopyOwned || !twoCopiesOwned) return false
            
            if (format.category !== 'TCG' && format.category !== 'OCG' && format.category !== 'Speed' && format.name !== 'Forged in Chaos') {
                member.send({ content: `Thanks, ${member.user.username}, ${pronoun} deck has been saved. ${emojis.legend}\n\nPlease note: Decks for ${format.category} Formats cannot be verified at this time. Be sure your deck is legal for this tournament!`}).catch((err) => console.log(err))
                return { url, ydk }
            } else if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length || zeroCopiesOwned?.length || oneCopyOwned?.length || twoCopiesOwned?.length) {
                let response = [`I'm sorry, ${member.user.username}, your deck is not legal. ${emojis.mad}`]
                if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
                if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
                if (limitedCards.length) response = [...response, `\nThe following cards are limited:`, ...limitedCards]
                if (semiLimitedCards.length) response = [...response, `\nThe following cards are semi-limited:`, ...semiLimitedCards]
                if (zeroCopiesOwned?.length) response = [...response, `\n${pronoun2} own 0 copies of the following cards:`, ...zeroCopiesOwned]
                if (oneCopyOwned?.length) response = [...response, `\n${pronoun2} only own 1 copy of the following cards:`, ...oneCopyOwned]
                if (twoCopiesOwned?.length) response = [...response, `\n${pronoun2} only own 2 copies of the following cards:`, ...twoCopiesOwned]
            
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

