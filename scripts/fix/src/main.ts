import { Card, Deck, DeckType, DeckThumb, Event, Format, Match, Membership, Player, Server, Stats, Status, Tournament } from '@fl/models'
import { Op } from 'sequelize'

// ;(async () => {
//     const decks = await Deck.findAll({ include: [DeckType, Event, Format, Player] })
//     let a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, k = 0, l = 0

//     for (let i = 0; i < decks.length; i++) {
//         const deck = decks[i]

//         // change Deck origin from 'event' to 'user' if no associated Event is found
//         if (!deck.eventId && deck.origin === 'event') {
//             await deck.update({ origin: 'user' })
//             a++
//         }

//         // synchronize Deck types with DeckType names
//         if (deck.deckType?.name && deck.deckType.name !== deck.type) {
//             await deck.update({ type: deck.deckType.name })
//             b++
//         }

//         // synchronize Deck categories with DeckType categories
//         if (deck.deckType?.category && deck.deckType.category !== deck.category) {
//             await deck.update({ category: deck.deckType.category })
//             c++
//         }

//         // synchronize Deck event-names with Event abbreviations
//         if (deck.event?.abbreviation && deck.event.abbreviation !== deck.eventName) {
//             await deck.update({ eventName: deck.event.abbreviation })
//             d++
//         }

//         // synchronize Deck event-names with Event abbreviations
//         if (deck.event?.community && deck.event.community !== deck.community) {
//             await deck.update({ community: deck.event.community })
//             k++
//         }

//         // synchronize Deck publish-dates with Event end-dates
//         if (deck.event?.endDate && deck.event.endDate !== deck.publishDate) {
//             await deck.update({ publishDate: deck.event.endDate })
//             e++
//         }

//         // synchronize Deck format-names with Format names
//         if (deck.format?.name && deck.format.name !== deck.formatName) {
//             await deck.update({ formatName: deck.format.name })
//             f++
//         }

//         // synchronize Deck builders with Player names
//         if (deck.player?.name && deck.player.name !== deck.builder) {
//             await deck.update({ builder: deck.player.name })
//             g++
//         }
//     }

//     console.log(`changed ${a} deck origins from 'event' to 'user'`)
//     console.log(`synchronized ${b} Deck types with DeckType names`)
//     console.log(`synchronized ${c} Deck categories with DeckType categories`)
//     console.log(`synchronized ${d} Deck eventNames with Event abbreviations`)
//     console.log(`synchronized ${k} Deck communities with Event communities`)
//     console.log(`synchronized ${e} Deck publishDates with Event endDates`)
//     console.log(`synchronized ${f} Deck formatNames with Format names`)
//     console.log(`synchronized ${g} Deck builders with Player names`)

//     const deckThumbs = await DeckThumb.findAll({ include: DeckType })

//     for (let i = 0; i < deckThumbs.length; i++) {
//         const deckThumb = deckThumbs[i]

//         // synchronize DeckThumb names with DeckType names
//         if (deckThumb.deckType?.name && deckThumb.name !== deckThumb.deckType.name) {
//             await deckThumb.update({ name: deckThumb.deckType.name })
//             h++
//         }
//     }

//     console.log(`synchronized ${h} DeckThumb names with DeckType names`)

//     const deckTypes = await DeckType.findAll()

//     for (let i = 0; i < deckTypes.length; i++) {
//         const deckType = deckTypes[i]

//         const count = await Deck.count({
//             where: {
//                 deckTypeId: deckType.id,
//                 origin: 'event' 
//             }
//         })

//         if (!count) {
//             console.log(`deleting DeckType: ${deckType.name}`)
//             await deckType.destroy()
//             l++
//         }
//     }

//     console.log(`deleted ${l} DeckTypes without a corresponding Deck`)
// })()
    
// ;(async () => {
//     const statuses = await Status.findAll()

//     for (let i = 0; i < statuses.length; i++) {
//         const status = statuses[i]
//         const monthStr = status.banlist.slice(0, 3) 
//         const month = monthStr === 'jan' ? '01' :
//             monthStr === 'feb' ? '02' :
//             monthStr === 'mar' ? '03' :
//             monthStr === 'apr' ? '04' :
//             monthStr === 'may' ? '05' :
//             monthStr === 'jun' ? '06' :
//             monthStr === 'jul' ? '07' :
//             monthStr === 'aug' ? '08' :
//             monthStr === 'sep' ? '09' :
//             monthStr === 'oct' ? '10' :
//             monthStr === 'nov' ? '11' :
//             monthStr === 'dec' ? '12' :
//             ''

//         const year = '20' + status.banlist.slice(3)
//         await status.update({ date: `${year}-${month}-01` })
//     }
// })()

// ;(async () => {
//     const cards = await Card.findAll()

//     const banlists = [...await Status.findAll({ order: [['date', 'ASC']]})]
//         .map((s) => s.date)
//         .filter((value, index, array) => array.indexOf(value) === index)

//     for (let i = 0; i < cards.length; i++) {
//         const card = cards[i]
//         const status = [...await Status.findAll({
//             where: {
//                 cardId: card.id,
//                 restriction: {[Op.not]: 'no longer on list'}
//             },
//             order: [['date', 'DESC']],
//             limit: 1
//         })][0]

//         if (!status) continue

//         if (banlists.indexOf(status.date) < banlists.length - 1) {
//             const nextDate = banlists[banlists.indexOf(status.date) + 1]
//             const monthNum = nextDate.slice(5, 7)
//             const monthStr = monthNum === '01' ? 'jan' : 
//                 monthNum === '02' ? 'feb' :
//                 monthNum === '03' ? 'mar' :
//                 monthNum === '04' ? 'apr' :
//                 monthNum === '05' ? 'may' :
//                 monthNum === '06' ? 'jun' :
//                 monthNum === '07' ? 'jul' :
//                 monthNum === '08' ? 'aug' :
//                 monthNum === '09' ? 'sep' :
//                 monthNum === '10' ? 'oct' :
//                 monthNum === '11' ? 'nov' :
//                 monthNum === '12' ? 'dec' :
//                 ''

//             const yearStr = nextDate.slice(2, 4)

//             await Status.create({
//                 name: status.name,
//                 cardId: status.cardId,
//                 banlist: monthStr + yearStr,
//                 date: nextDate,
//                 restriction: 'no longer on list',
//                 previous: status.restriction
//             })
//         }
//     }
// })()

// ;(async () => {
//     const matches = await Match.findAll({
//         where: {
//             formatId: null
//         }
//     })

//     for (let i = 0; i < matches.length; i++) {
//         const match = matches[i]
//         const format = await Format.findOne({
//             where: {
//                 name: {[Op.iLike]: match.formatName}
//             }
//         })

//         if (!format) continue
//         await match.update({ formatId: format.id })
//     }
// })()

// ;(async () => {
//     let b = 0
//     let e = 0
//     const players = await Player.findAll({
//         where: {
//             discordId: {[Op.not]: null},
//             globalName: null
//         }
//     })

//     for (let i = 0; i < players.length; i++) {
//         try {
//             const player = players[i]
//             await player.update({ globalName: player.discordName })
//             b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`fixed ${b} players and encountered ${e} errors`)
// })()

// ;(async () => {
//     let b = 0
//     let e = 0
//     const tournaments = await Tournament.findAll({
//         where: {
//             abbreviation: {
//                 [Op.or]: {
//                     [Op.substring]: 'top',
//                     [Op.substring]: 'Top', 
//                 }
//             }
//         }
//     })

//     for (let i = 0; i < tournaments.length; i++) {
//         const tournament = tournaments[i]
//         await tournament.update({ isTopCut: true })
//     }

//     const events = await Event.findAll()

//     for (let i = 0; i < events.length; i++) {
//         try {
//             const event = events[i]
//             const tournament = await Tournament.findOne({
//                 where: {
//                     [Op.or]: {
//                         name: {[Op.iLike]: event.name },
//                         abbreviation: {[Op.iLike]: event.abbreviation },
//                         url: {[Op.iLike]: event.abbreviation }
//                     }
//                 }
//             })

//             await event.update({ topCutTournamentId: tournament.assocTournamentId })
//             b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     for (let i = 0; i < events.length; i++) {
//         try {
//             const event = events[i]
//             const tournament = await Tournament.findOne({
//                 where: {
//                     [Op.or]: {
//                         name: {[Op.iLike]: event.name },
//                         abbreviation: {[Op.iLike]: event.abbreviation },
//                         url: {[Op.iLike]: event.abbreviation }
//                     }
//                 }
//             })

//             await event.update({ topCutTournamentId: tournament.assocTournamentId })
//             b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`fixed ${b} players and encountered ${e} errors`)
// })()


;(async () => {
    let b = 0
    let e = 0
    
    const players = await Player.findAll({
        where: {
            email: null,
            firstName: null,
            lastName: null,
            googleId: null,
            duelingBook: null,
            opTcgSim: null,
            hash: null,
            subscriber: false,
            admin: false,
            contentManager: false,
            creator: false
        }
    })

    console.log('potential purge players.length', players.length)

    for (let i = 0; i < players.length; i++) {
        try {
            const player = players[i]
            const hasMembership = await Membership.count({
                where: {
                    playerId: player.id,
                    '$server.access$': {[Op.not]: 'free'}
                },
                include: Server
            })
            
            const hasDecks = await Deck.count({
                where: {
                    playerId: player.id,
                }
            })

            const hasStats = await Stats.count({
                where: {
                    playerId: player.id,
                }
            })

            console.log(i, !!hasMembership, !!hasDecks, !!hasStats)
            if (!hasMembership && !hasDecks && !hasStats) {
                await player.destroy()
                console.log('PURGED')
                b++
            }
        } catch (err) {
            console.log(err)
            e++
        }
    }

    return console.log(`deleted ${b} players and encountered ${e} errors`)
})()