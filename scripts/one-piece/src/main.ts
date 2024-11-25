// import { DeckType, OPCard, Set } from '@fl/models'
// import axios from 'axios'

// const colors = [
//     'red', '', '', 'purple', 'don', 
//     'blue', 'green', '', 'red-blue', 'red-green', 
//     'blue-purple', 'black', 'purple-black', 'red-black', 'green-blue', 
//     'yellow', 'green-yellow', 'black-yellow', 'blue-black', 'green-black',
//     'purple-yellow', '', 'blue-yellow', '', 'black-pink'
// ]

// const categories = ['leader', 'character', 'event', 'stage', 'don']
// const attributes = ['slash', 'strike', 'ranged', 'wisdom', 'special']
// const rarities = ['L', 'C', 'UC', 'R', 'SR', 'SEC', 'P']

// ;(async () => {
//     const {data} = await axios.get('https://onepiece-cardgame.dev/cards.json')
//     for (let i = 0; i < data.length; i++) {
//         const datum = data[i]
//         if (datum.al) continue

//         const card = await OPCard.create({
//             name: datum.n,
//             category: categories[datum.t - 1],
//             attribute: attributes[datum.a - 1] || null,
//             color: colors[datum.col - 1],
//             rarity: rarities[datum.r - 1],
//             cost: datum.cs,
//             power: datum.p,
//             counter: datum.cp,
//             life: datum.l,
//             artwork: datum.iu?.replaceAll("\/", "/"),
//             artist: datum.ar,
//             isEffect: datum.e,
//             type: datum.tr?.replaceAll("\/", "/"),
//             cardCode: datum.cid
//         })

//         if (card.category === 'leader') {
//             await DeckType.create({
//                 name: `${card.cardCode} ${card.name}`,
//                 category: card.color,
//                 game: 'OP'
//             })
//         }
//     }

//     return console.log('complete')
// })()


// ;(async () => {
//     const opCards = await OPCard.findAll()

//     for (let i = 0; i < opCards.length; i++) {
//         try {
//             const card = opCards[i]
//             const setCode = card.cardCode?.slice(0, card.cardCode.indexOf('-'))
//             const set = await Set.findOne({
//                 where: {
//                     setCode: setCode,
//                     game: 'OP'
//                 }
//             })

//             if (!set) continue
//             await card.update({ 
//                 westernDate: set.tcgDate,
//                 westernLegal: set.tcgDate && set.tcgDate < '2023-06-01'
//             })
//         } catch (err) {
//             console.log(err)
//         }
//     }

//     return console.log('complete')
// })()