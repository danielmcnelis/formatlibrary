import axios from "axios"
import { Card } from "@fl/models"
import { Op } from "sequelize"
import { emojis } from '@fl/bot-emojis'
import { convertArrayToObject } from "./utility"


// GET GENESYS ISSUES
export const getGenesysIssues = async (deckArr) => {
    console.log('getGenesysIssues()')
    const deck = convertArrayToObject(deckArr)   
    const cardIds = [...await Card.findAll()].flatMap(c => [c.konamiCode, c.ypdId])
    console.log('cardIds', cardIds)
    
    const illegalCards = []
    const unrecognizedCards = []
    const nonZeroGenesysPointCards = []
    let points = 0

    const keys = Object.keys(deck)
    for (let i = 0; i < keys.length; i++) {
        let konamiCode = keys[i]
        const copies = deck[konamiCode]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode 
        if (konamiCode === '00000000') continue
        const card = await Card.findOne({ where: { [Op.or]: { konamiCode: konamiCode, ypdId: konamiCode } } })

        if (!cardIds.includes(konamiCode)) {
            if (card) {
                illegalCards.push(card.name)
            } else {
                unrecognizedCards.push(konamiCode)
            }
        } else if (card && card.genesysPoints) {
            nonZeroGenesysPointCards.push(`${card.name}: ${card.genesysPoints} * ${copies} = ${card.genesysPoints * copies}`)
            points += card.genesysPoints * copies
        }
    }
    
    illegalCards.sort()
    unrecognizedCards.sort()

    const issues = {
        illegalCards,
        unrecognizedCards,
        nonZeroGenesysPointCards,
        points
    }

    return issues
}


//GET GENESYS DECK LIST
export const getGenesysDeckList = async (member, player, override = false) => {  
    console.log('getGenesysDeckList()')          
    const filter = m => m.author.id === (member.id || member.user?.id)
    const pronoun = override ? `${player.name}'s` : 'your'
    const message = await member.send({ content: `To submit ${pronoun} tournament deck, please either:\n- copy and paste a **__YDKe code__**\n- upload a **__YDK file__**`}).catch((err) => console.log(err))
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
            const minimum = 40

            if (main?.length < minimum) {
                member.send(`I'm sorry, ${pronoun} deck must contain at least ${minimum} cards.`).catch((err) => console.log(err))    
                return false 
            }

            const deckArr = [...main, ...extra, ...side,]
            const issues = await getGenesysIssues(deckArr)
            const pointsCap = 100
            console.log('getGenesysIssues issues', issues)
            if (!issues) return false

            const { illegalCards, unrecognizedCards, nonZeroGenesysPointCards, points } = issues
            if (!illegalCards || !unrecognizedCards || !nonZeroGenesysPointCards || isNaN(points)) return false
            
            if (illegalCards.length) {
                let response = [`I'm sorry, ${member.user.username}, ${pronoun} deck is not legal. ${emojis.mad}`]
                if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]

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
            } else if (points > pointsCap) {
                let response = `I'm sorry, ${member.user.username}, ${pronoun} deck contains cards that cost more than ${pointsCap} points:\n${nonZeroGenesysPointCards.join('\n')}`
                response += `\n\nPlease adjust ${pronoun} deck list to comply with the ${pointsCap} point limit.`
                
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