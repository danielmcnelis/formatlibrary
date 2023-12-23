import { Card, Cube, Deck, DeckType, DeckThumb, Event, Format, Match, Membership, Player, Print, Replay, Set, Server, Stats, Status, Tournament } from '@fl/models'
import { Op } from 'sequelize'
import axios from 'axios'
import { config } from '@fl/config' 
import Canvas = require('canvas')
import { S3 } from 'aws-sdk'
import { capitalize } from '@fl/utils'

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

//         // synchronize Deck communities with Event communities
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
//     const tournaments = await Tournament.findAll()

//     for (let i = 0; i < tournaments.length; i++) {
//         try {
//             const tournament = tournaments[i]
//             const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${config.challonge['Format Library']}`)
            
//             if (tournament.type?.toLowerCase() === 'swiss') {
//                 const swiss_rounds = data?.tournament?.swiss_rounds
//                 if (tournament.rounds !== swiss_rounds) {
//                     await tournament.update({ rounds: swiss_rounds })
//                     b++
//                 }
//             } else if (tournament.type?.toLowerCase() === 'double elimination') {
//                 const count = data?.tournament?.participants_count
//                 const rounds = Math.ceil(Math.log(count) / Math.log(2)) + 1
//                 if (tournament.rounds !== rounds) {
//                     await tournament.update({ rounds })
//                     b++
//                 }
//             } else if (tournament.type?.toLowerCase() === 'single elimination') {
//                 const count = data?.tournament?.participants_count
//                 const rounds = Math.ceil(Math.log(count) / Math.log(2))
//                 if (tournament.rounds !== rounds) {
//                     await tournament.update({ rounds })
//                     b++
//                 }
//             }
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

    
//     return console.log(`fixed ${b} tournaments and encountered ${e} errors`)
// })()


// ;(async () => {
//     let b = 0
//     let e = 0
    
//     const count = await Player.count({
//         where: {
//             email: null,
//             firstName: null,
//             lastName: null,
//             googleId: null,
//             duelingBook: null,
//             opTcgSim: null,
//             hash: null,
//             subscriber: false,
//             admin: false,
//             contentManager: false,
//             creator: false
//         }
//     })

//     console.log('potential purge players count', count)

//     for (let offset = 0; offset < count; offset += 100) {
//         const players = await Player.findAll({
//             where: {
//                 email: null,
//                 firstName: null,
//                 lastName: null,
//                 googleId: null,
//                 duelingBook: null,
//                 opTcgSim: null,
//                 hash: null,
//                 subscriber: false,
//                 admin: false,
//                 contentManager: false,
//                 creator: false
//             },
//             limit: 100,
//             offset: offset,
//             subQuery:false
//         })

//         for (let i = 0; i < players.length; i++) {
//             try {
//                 const player = players[i]
//                 const hasMembership = await Membership.count({
//                     where: {
//                         playerId: player.id,
//                         '$server.access$': {[Op.not]: 'free'}
//                     },
//                     include: Server
//                 })
                
//                 const hasDecks = await Deck.count({
//                     where: {
//                         playerId: player.id,
//                     }
//                 })

//                 const hasStats = await Stats.count({
//                     where: {
//                         playerId: player.id,
//                     }
//                 })

//                 console.log(offset + i, !!hasMembership, !!hasDecks, !!hasStats)
//                 if (!hasMembership && !hasDecks && !hasStats) {
//                     await player.destroy()
//                     console.log('PURGED')
//                     b++
//                 }
//             } catch (err) {
//                 console.log(err)
//                 e++
//             }
//         }
//     }


//     return console.log(`deleted ${b} players and encountered ${e} errors`)
// })()


// ;(async () => {
//     let b = 0
//     let e = 0

//     const tournaments = await Tournament.findAll()

//     for (let i = 0; i < tournaments.length; i++) {
//         try {
//             const tournament = tournaments[i]
//             const {data} = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/matches.json?api_key=${config.challonge['Format Library']}`)
//             const finalMatch = data[data.length - 1]
//             const rounds = finalMatch.match.round         
//             await tournament.update({ rounds: rounds })
//             console.log(`${tournament.name} (${tournament.type}) has ${rounds} rounds`)   
//             b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`updated ${b} tournaments and encountered ${e} errors`)
// })()

// ;(async () => {
//     let b = 0
//     let e = 0
    
//     const replays = await Replay.findAll({
//         where: {
//             tournamentId: {[Op.not]: null}
//         },
//         include: [Match, Tournament]
//     })

//     for (let i = 0; i < replays.length; i++) {
//         try {
//             const replay = replays[i]
//             const {data} = await axios.get(`https://api.challonge.com/v1/tournaments/${replay.tournamentId}/matches/${replay.match.challongeMatchId}.json?api_key=${config.challonge['Format Library']}`)
//             let roundName 

//             if (replay.tournament?.type === 'swiss' ||replay. tournament.type === 'round robin') {
//                 roundName = `Round ${data.match.round}`
//             } else if (replay.tournament?.type === 'single elimination') {
//                 roundName = replay.tournament?.rounds - data.match.round === 0 ? 'Finals' :
//                     replay.tournament?.rounds - data.match.round === 1 ? 'Semi Finals' :
//                     replay.tournament?.rounds - data.match.round === 2 ? 'Quarter Finals' :
//                     replay.tournament?.rounds - data.match.round === 3 ? 'Round of 16' :
//                     replay.tournament?.rounds - data.match.round === 4 ? 'Round of 32' :
//                     replay.tournament?.rounds - data.match.round === 5 ? 'Round of 64' :
//                     replay.tournament?.rounds - data.match.round === 6 ? 'Round of 128' :
//                     replay.tournament?.rounds - data.match.round === 7 ? 'Round of 256' :
//                     null
//             } else if (replay.tournament?.type === 'double elimination') {
//                 if (data.match.round > 0) {
//                     roundName = replay.tournament?.rounds - data.match.round === 0 ? 'Grand Finals' :
//                         replay.tournament?.rounds - data.match.round === 1 ? `Winner's Finals` :
//                         replay.tournament?.rounds - data.match.round === 2 ? `Winner's Semis` :
//                         replay.tournament?.rounds - data.match.round === 3 ? `Winner's Quarters` :
//                         `Winner's Round ${data.match.round}`
//                 } else {
//                     roundName = replay.tournament?.rounds - Math.abs(data.match.round) === -1 ? `Loser's Finals` :
//                         replay.tournament?.rounds - Math.abs(data.match.round) === 0 ? `Loser's Semis` :
//                         replay.tournament?.rounds - Math.abs(data.match.round) === 1 ? `Loser's Quarters` :
//                         `Loser's Round ${Math.abs(data.match.round)}`
//                 }
//             } else {
//                 roundName = `${data.match.round}`
//             }

//             await replay.update({ 
//                 suggestedOrder: data.match.suggested_play_order, 
//                 roundInt: data.match.round,
//                 roundName: roundName 
//             })

//             b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`updated ${b} replays and encountered ${e} errors`)
// })()

// ;(async () => {
//     let b = 0
//     let e = 0
    
//     const replays = await Replay.findAll({
//         where: {
//             eventId: {[Op.not]: null},
//             tournamentId: {[Op.not]: null}
//         },
//         include: [Event, Tournament]
//     })

//     for (let i = 0; i < replays.length; i++) {
//         try {
//             const replay = replays[i]
//             const winningDeck = await Deck.findOne({
//                 where: {
//                     playerId: replay.winnerId,
//                     eventId: replay.eventId
//                 },
//                 include: DeckType
//             })

//             const losingDeck = await Deck.findOne({
//                 where: {
//                     playerId: replay.loserId,
//                     eventId: replay.eventId
//                 },
//                 include: DeckType
//             })

//             let roundName

//             if (replay?.tournament?.type === 'swiss' || replay?.tournament?.type === 'round robin') {
//                 roundName = `Round ${replay.roundInt}`
//             } else if (replay?.tournament.type === 'single elimination') {
//                 roundName = replay?.tournament.rounds - replay.roundInt === 0 ? 'Finals' :
//                     replay.tournament?.rounds - replay.roundInt === 1 ? 'Semi Finals' :
//                     replay.tournament?.rounds - replay.roundInt === 2 ? 'Quarter Finals' :
//                     replay.tournament?.rounds - replay.roundInt === 3 ? 'Round of 16' :
//                     replay.tournament?.rounds - replay.roundInt === 4 ? 'Round of 32' :
//                     replay.tournament?.rounds - replay.roundInt === 5 ? 'Round of 64' :
//                     replay.tournament?.rounds - replay.roundInt === 6 ? 'Round of 128' :
//                     replay.tournament?.rounds - replay.roundInt === 7 ? 'Round of 256' :
//                     null
//             } else if (replay?.tournament.type === 'double elimination') {
//                 if (replay.roundInt > 0) {
//                     roundName = replay?.tournament.rounds - replay.roundInt === 0 ? 'Grand Finals' :
//                         replay?.tournament.rounds - replay.roundInt === 1 ? `Winner's Finals` :
//                         replay?.tournament.rounds - replay.roundInt === 2 ? `Winner's Semis` :
//                         `Winner's Round ${replay.roundInt}`
//                 } else {
//                     roundName = replay?.tournament.rounds - Math.abs(replay.roundInt) === -1 ? `Loser's Finals` :
//                         replay.tournament?.rounds - Math.abs(replay.roundInt) === 0 ? `Loser's Semis` :
//                         `Loser's Round ${Math.abs(replay.roundInt)}`
//                 }
//             } else {
//                 roundName = replay.roundName
//             }

//             await replay.update({
//                 winningDeckType: winningDeck?.deckType?.name,
//                 winningDeckId: winningDeck?.id,
//                 winningDeckTypeId: winningDeck?.deckTypeId,
//                 losingDeckType: losingDeck?.deckType?.name,
//                 losingDeckId: losingDeck?.id,
//                 losingDeckTypeId: losingDeck?.deckTypeId,
//                 publishDate: replay?.event?.endDate,
//                 roundName: roundName
//             })
//             b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`updated ${b} replays and encountered ${e} errors`)
// })()


// ;(async () => {
//     let b = 0
//     let e = 0
    
//     const sets = await Set.findAll({
//         where: {
//             setName: {[Op.substring]: 'Speed Duel'}
//         },
//         order: [['tcgDate', 'ASC']]
//     })

//     for (let i = 0; i < sets.length; i++) {
//         try {
//             const set = sets[i]
//             const prints = await Print.findAll({
//                 where: {
//                     setId: set.id
//                 },
//                 include: Card
//             })

//             for (let j = 0; j < prints.length; j++) {
//                 const print = prints[j]
//                 const card = print.card
                
//                 if (!card.speedLegal || !card.speedDate || card.speedDate > set.tcgDate) {
//                     await card.update({
//                         speedLegal: true,
//                         speedDate: set.tcgDate
//                     })

//                     console.log(`${card.name} was released for speed duels on ${card.speedDate}`)
//                     b++
//                 } 
//             }
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`updated ${b} cards from ${sets.length} speed duel sets and encountered ${e} errors`)
// })()



// ;(async () => {
//     let b = 0
//     let e = 0
    
//     const cards = await Card.findAll({
//         where: {
//             category: 'Token'
//         }
//     })

//     for (let i = 0; i < cards.length; i++) {
//         try {
//             const card = cards[i]
//             await card.update({
//                 tcgLegal: false,
//                 tcgDate: null,
//                 ocgLegal: false,
//                 ocgDate: null,
//                 speedLegal: false,
//                 speedDate: null
//             })

//             b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`fixed ${b} skill cards and encountered ${e} errors`)
// })()

// ;(async () => {
//     let b = 0
//     let e = 0
    
//     const cards = await Card.findAll({
//         where: {
//             category: 'Skill'
//         }
//     })

//     for (let i = 0; i < cards.length; i++) {
//         try {
//             const card = cards[i]
//             const speedDate = card.speedDate || card.tcgDate
//             await card.update({
//                 speedDate: speedDate,
//                 tcgLegal: false,
//                 tcgDate: null,
//                 ocgLegal: false,
//                 ocgDate: null
//             })

//             b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`fixed ${b} skill cards and encountered ${e} errors`)
// })()


// ;(async () => {
//     let b = 0
//     let e = 0
    
//     const cards = await Card.findAll({
//         where: {
//             category: 'Skill'
//         }
//     })

//     for (let i = 0; i < cards.length; i++) {
//         try {
//             const card = cards[i]
//             const speedDate = card.speedDate || card.tcgDate
//             await card.update({
//                 speedDate: speedDate,
//                 tcgLegal: false,
//                 tcgDate: null,
//                 ocgLegal: false,
//                 ocgDate: null
//             })

//             b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`fixed ${b} skill cards and encountered ${e} errors`)
// })()


// ;(async () => {
//     let b = 0
//     let e = 0
    
//     const statuses = await Status.findAll()

//     for (let i = 0; i < statuses.length; i++) {
//         try {
//             const status = statuses[i]
//             const category = status.category === 'tcg' ? 'TCG' :
//                 status.category === 'ocg' ? 'OCG' :
//                 status.category === 'speed' ? 'Speed' :
//                 null

//             await status.update({ category })
//             b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`fixed ${b} statuses and encountered ${e} errors`)
// })()


// ;(async () => {
//     const cubes = await Cube.findAll({
//         where: {
//             display: true
//         }
//     })

//     for (let i = 0; i < cubes.length; i++) {
//         const cube = cubes[i]
//         const mainArr = cube.ydk.split('#main')[1].split('\n').filter((e) => e.length) || []
//         const main = []
        
//         for (let i = 0; i < mainArr.length; i++) {
//             let konamiCode = mainArr[i]
//             while (konamiCode.length < 8) konamiCode = '0' + konamiCode
//             const card = await Card.findOne({ where: { konamiCode: konamiCode }})
//             if (!card) continue
//             main.push(card)
//         }
    
//         main.sort((a, b) => {
//             if (a.sortPriority > b.sortPriority) {
//                 return 1
//             } else if (b.sortPriority > a.sortPriority) {
//                 return -1
//             } else if (a.name > b.name) {
//                 return 1
//             } else if (b.name > a.name) {
//                 return -1
//             } else {
//                 return false
//             }
//         })
    
//         const card_width = 72
//         const card_height = 105
//         const canvas = Canvas.createCanvas(card_width * main.length, card_height)
//         const context = canvas.getContext('2d')
    
//         for (let i = 0; i < main.length; i++) {
//             const card = main[i]
//             const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`) 
//             context.drawImage(image, card_width * i, 0, card_width, card_height)
//         }
    
//         const buffer = canvas.toBuffer('image/png')
//         const s3 = new S3({
//             region: config.s3.region,
//             credentials: {
//                 accessKeyId: config.s3.credentials.accessKeyId,
//                 secretAccessKey: config.s3.credentials.secretAccessKey
//             }
//         })
    
//         const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/cubes/slideshows/${cube.id}.png`, Body: buffer, ContentType: `image/png` }).promise()
//         console.log('uri', uri)
//     }
// })()

// ;(async () => {
//     const sets = await Set.findAll({
//         where: {
//             booster: true,
//             game: 'YGO'
//         }
//     })

//     for (let i = 0; i < sets.length; i++) {
//         const set = sets[i]
//         try {
//             const prints = await Print.findAll({
//                 where: {
//                     setId: set.id,
//                     region: {[Op.or]: ['NA', null]}
//                 },
//                 order: [['cardCode', 'ASC']],
//                 include: Card
//             })
    
//             const main = []
            
//             for (let i = 0; i < prints.length; i++) {
//                 const card = prints[i].card
//                 if (!card || !card.ypdId) continue
//                 const filtered = main.filter((c) => c.id === card.id)
//                 if (!filtered.length) main.push(card)
//             }
        
//             const sortFn = (a, b) => {
//                 if (a.sortPriority > b.sortPriority) {
//                     return 1
//                 } else if (b.sortPriority > a.sortPriority) {
//                     return -1
//                 } else if (a.name > b.name) {
//                     return 1
//                 } else if (b.name > a.name) {
//                     return -1
//                 } else {
//                     return 0
//                 }
//             }
    
//             main.sort(sortFn)
        
//             const card_width = 72
//             const card_height = 105
//             const canvas = Canvas.createCanvas(card_width * main.length, card_height)
//             const context = canvas.getContext('2d')
        
//             for (let i = 0; i < main.length; i++) {
//                 const card = main[i]
//                 const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`) 
//                 context.drawImage(image, card_width * i, 0, card_width, card_height)
//             }
        
//             const buffer = canvas.toBuffer('image/png')
//             const s3 = new S3({
//                 region: config.s3.region,
//                 credentials: {
//                     accessKeyId: config.s3.credentials.accessKeyId,
//                     secretAccessKey: config.s3.credentials.secretAccessKey
//                 }
//             })
        
//             const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/sets/slideshows/${set.setCode}.png`, Body: buffer, ContentType: `image/png` }).promise()
//             console.log('uri', uri)
//         } catch (err) {
//             console.log(err)
//             console.log(`error creating banner canvas of ${set.name}`)
//         }
//     }
// })()

// ;(async () => {
//     const formats = await Format.findAll()

//     for (let i = 0; i < formats.length; i++) {
//         const format = formats[i]
//         await format.update({ cleanName: capitalize(format.cleanName, true) })
//     }
// })()

// ;(async () => {
//     const cubes = await Cube.findAll()

//     for (let i = 0; i < cubes.length; i++) {
//         const cube = cubes[i]

//         const konamiCodes = cube.ydk
//             .split('#main')[1]
//             .split('#extra')[0]
//             .split('\n')
//             .filter((e) => e.length)

//         await cube.update({ size: konamiCodes.length })
//     }
// })()

// ;(async () => {
//     const boosters = await Set.findAll()

//     const core = [
//         'LOB', 'MRD', 'MRL', 'PSV', 'LON', 'LOD', 'PGD', 'MFC', 'DCR', 'IOC', 'AST', 'SOD', 'RDS', 'FET', 'TLM', 'CRV', 'EEN', 'SOI', 'EOJ', 
//         'POTD', 'CDIP', 'STON', 'FOTB', 'TAEV', 'GLAS', 'PTDN', 'LODT', 'TDGS', 'CSOC', 'CRMS', 'RGBT', 'ANPR', 'SOVR', 'ABPF', 'TSHD', 'DREV', 
//         'STBL', 'STOR', 'EXVC', 'GENF', 'PHSW', 'ORCS', 'GAOV', 'REDU', 'ABYR', 'CBLZ', 'LTGY', 'JOTL', 'SHSP', 'LVAL', 'PRIO', 'DUEA', 'NECH', 
//         'SECE', 'CROS', 'CORE', 'DOCS', 'BOSH', 'SHVI', 'TDIL', 'INOV', 'RATE', 'MACR', 'COTD', 'CIBR', 'EXFO', 'FLOD', 'CYHO', 'SOFU', 'SAST', 
//         'DANE', 'RIRA', 'CHIM', 'IGAS', 'ETCO', 'ROTD', 'PHRA', 'BLVO', 'LIOV', 'DAMA', 'BODE', 'BACH', 'DIFO', 'POTE', 'DABL', 'PHHY', 'CYAC', 
//         'DUNE', 'AGOV', 'PHNI', 'LEDE'
//     ]

//     const mini = [
//         'DP12', 'DP13', 'DP14', 'DP15', 'DPBC', 'DPRP', 'DPDG',
//         'HA01', 'HA02', 'HA03', 'HA04', 'HA05', 'HA06', 'HA07', 'HAC1',
//         'THSF', 'HSRD', 'WIRA', 'DESO', 'FUEN', 'SPWA', 'DASA', 'HISU', 'INCH', 'MYFI', 'SESL', 'GEIM', 'ANGU', 'GRCR', 'TAMA', 'AMDE', 'WISU', 'VASM',
//         'PEVO', 'SHVA', 'FIGA', 'TOCH', 'KICO', 'MAZE', 'MZMI',
//         'NUMH', 'DRLG', 'DRL2', 'DRL3', 'BLLR', 'BLRR', 'BLHR', 'BLAR', 'BROL', 'BLCR', 'BLMR',
//         'DUSA', 'DUPO', 'DUOV', 'GFTP', 'GFP2', 'MAMA',
//         'WSUP', 'MIL1', 'RA01',
//         'PP01', 'PP02', 
//         'GLD1', 'GLD2', 'GLD3', 'GLD4', 'GLD5', 'PGLD', 'PGL2', 'PGL3', 'MGED',
//         'LEDU', 'LED2', 'LED3', 'LED4', 'LED5', 'LED6', 'LED7', 'LED8', 'LED9', 'LD10',
//         'SBLS', 'SBAD', 'SBSC', 'SBTK',
//         'SP13', 'SP14', 'SP15', 'SP17', 'SP18'
//     ]

//     const reprint = ['DB1', 'DB2', 'DR1', 'DR2', 'DR3']
    
//     const reprint2 = [
//         'RYMP', 'LGCX', 'LCYW', 'LCJW', 'LC5D', 'LCKC', 'MP14', 'MP15', 'MP16', 'MP17', 'MP18', 'MP19', 'MP23',
//         'RP01', 'RP02', 'DLG1'
//     ]

//     const duelist = ['DP1', 'DP2', 'DP03', 'DP04', 'DP05', 'DP06', 'DP07', 'DP08', 'DP09', 'DP10', 'DP11', 'DPYG']
//     const bpWave1 = ['BP01', 'BP02', 'BP03']

//     for (let i = 0; i < boosters.length; i++) {
//         const booster = boosters[i]
//         await booster.update({ booster: false, draftable: false, core: false, mini: false, packSize: null })

//         if (booster.setName?.toLowerCase().includes('promotion') || 
//             booster.setName?.toLowerCase().includes('edition') || 
//             booster.setName?.toLowerCase().includes('participation')
//         ) {
//             await booster.update({ booster: false, core: false, mini: false, draftable: false, packSize: null, })
//         } else if (mini.includes(booster.setCode)) {
//             await booster.update({ booster: true, mini: true })
//         } else if (reprint.includes(booster.setCode)) {
//             await booster.update({ booster: true, packSize: 12, draftable: true })
//         } else if (reprint2.includes(booster.setCode)) {
//             await booster.update({ booster: true })
//         } else if (duelist.includes(booster.setCode) || bpWave1.includes(booster.setCode)) {
//             await booster.update({booster: true, mini: true, packSize: 5, draftable: true })
//         } else if (booster.setCode === 'BPW2') {
//             await booster.update({ booster: true, packSize: 16, draftable: true })
//         } else if (core.includes(booster.setCode)) {
//             await booster.update({ booster: true, core: true, packSize: 9, draftable: true })
//         }
//     }
// })()


// ;(async () => {
//     const tournaments = await Tournament.findAll({
//         where: {
//             state: {[Op.not]: 'complete'},
//             type: 'swiss'
//         }
//     })

//     for (let i = 0; i < tournaments.length; i++) {
//         try {
//             const tournament = tournaments[i]
//             const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${config.challonge['Format Library']}`)
//             const tieBreaker1 = data.tournament.tie_breaks ? data.tournament.tie_breaks[0] : 'median buchholz'
//             const tieBreaker2 = data.tournament.tie_breaks ? data.tournament.tie_breaks[1] : 'match wins vs tied'
//             const tieBreaker3 = null

//             await tournament.update({
//                 pointsPerMatchWin: data.tournament.pts_for_match_win,
//                 pointsPerMatchTie: data.tournament.pts_for_match_tie,
//                 pointsPerBye: data.tournament.pts_for_bye,
//                 tieBreaker1,
//                 tieBreaker2,
//                 tieBreaker3
//             })

//         } catch (err) {
//             console.log(err)
//         }
//     }
// })()

// ;(async () => {
//     let b = 0
//     let e = 0
//     const decks = await Deck.findAll({
//         where: {
//             name: null,
//             origin: 'user'
//         },
//         order: [['createdAt', 'ASC']]
//     })

//     for (let i = 0; i < decks.length; i++) {
//         try {
//             const deck = decks[i]
//             const baseName = deck.type || 'Unnamed Deck'
//             let name = baseName
//             let attempt = 0
//             let confirmed = false

//             while (!confirmed) {
//                 const nameInUse = await Deck.count({
//                     where: {
//                         name: name,
//                         formatId: deck.formatId,
//                         playerId: deck.playerId
//                     }
//                 })

//                 if (!nameInUse) {
//                     await deck.update({ name })
//                     confirmed = true
//                     b++
//                 } else {
//                     attempt++
//                     name = baseName + ` (${attempt})`
//                 }
//             }
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`fixed ${b} out of ${decks.length} decks, encountered ${e} errors`)
// })()


;(async () => {
    let b = 0
    let e = 0
    const cards = [...await Card.findAll()].filter((c) => parseInt(c.konamiCode).toString() !== c.ypdId)

    for (let i = 0; i < cards.length; i++) {
        try {
            const card = cards[i]

            const {data} = await axios({
                method: 'GET',
                url: `https://images.ygoprodeck.com/images/cards/${card.ypdId}.jpg`,
                responseType: 'stream'
            })
        
            const s3 = new S3({
                region: config.s3.region,
                credentials: {
                    accessKeyId: config.s3.credentials.accessKeyId,
                    secretAccessKey: config.s3.credentials.secretAccessKey
                }
            })
        
            const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/cards/${card.konamiCode}.jpg`, Body: data, ContentType: `image/jpg` }).promise()
            console.log('uri', uri)
            b++
        } catch (err) {
            console.log(err)
            e++
        }
    }

    return console.log(`saved ${b} out of ${cards.length} images, encountered ${e} errors`)
})()