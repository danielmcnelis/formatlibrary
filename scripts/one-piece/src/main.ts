import { DeckType, OPCard } from '@fl/models'
import axios from 'axios'

const colors = [
    'red', '', '', 'purple', 'don', 
    'blue', 'green', '', 'red-blue', 'red-green', 
    'blue-purple', 'black', 'purple-black', 'red-black', 'green-blue', 
    'yellow', 'green-yellow', 'black-yellow', 'blue-black', 'green-black',
    'purple-yellow', '', 'blue-yellow', '', 'black-pink'
]

const categories = ['leader', 'character', 'event', 'stage', 'don']
const attributes = ['slash', 'strike', 'ranged', 'wisdom', 'special']
const rarities = ['L', 'C', 'UC', 'R', 'SR', 'SEC', 'P']

;(async () => {
    const {data} = await axios.get('https://onepiece-cardgame.dev/cards.json')
    for (let i = 0; i < data.length; i++) {
        const datum = data[i]
        if (datum.al) continue

        const card = await OPCard.create({
            name: datum.n,
            category: categories[datum.t - 1],
            attribute: attributes[datum.a - 1] || null,
            color: colors[datum.col - 1],
            rarity: rarities[datum.r - 1],
            cost: datum.cs,
            power: datum.p,
            counter: datum.cp,
            life: datum.l,
            artwork: datum.iu?.replaceAll("\/", "/"),
            artist: datum.ar,
            effect: datum.e,
            type: datum.tr?.replaceAll("\/", "/"),
            cardCode: datum.cid
        })

        if (card.category === 'leader') {
            await DeckType.create({
                name: `${card.cardCode} ${card.name}`,
                category: card.color,
                game: 'OP'
            })
        }
    }

    return console.log('complete')
})()