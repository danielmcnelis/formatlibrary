import { Artwork, Alius, Card, Community, Cube, Deck, DeckType, DeckThumb, Entry, Event, Format, Match, Membership, Pairing, Player, Pool, Price, Print, Replay, Ruling, Server, Set, Stats, Status, Team, Tournament, BlogPost, Matchup } from '@fl/models'
import { Op } from 'sequelize'
import axios from 'axios'
import { config } from '@fl/config'
import Canvas = require('canvas')
import { capitalize, iso2ToCountries, getRoundName } from '@fl/utils'
import * as fs from 'fs'
// import { parse } from 'csv-parse'
import { Upload } from '@aws-sdk/lib-storage'
import { S3, DeleteObjectCommand } from '@aws-sdk/client-s3'
// import { statuses } from './ocg-banlists.json' 
// const imported_prices = require('./prices.json')

//SHUFFLE ARRAY
const shuffleArray = (arr) => {
    let i = arr.length
    let temp
    let index

    while (i--) {
        index = Math.floor((i + 1) * Math.random())
        temp = arr[index]
        arr[index] = arr[i]
        arr[i] = temp
    }

    return arr
}

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
//         if (deck.deckType?.name && deck.deckType.name !== deck.deckTypeName) {
//             await deck.update({ deckTypeName: deck.deckType.name })
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
//         if (deck.event?.communityName && deck.event.communityName !== deck.communityName) {
//             await deck.update({ communityName: deck.event.communityName })
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
//         if (deck.builder?.name && deck.builder.name !== deck.builderName) {
//             await deck.update({ builder: deck.builder.name })
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
//             await deckThumb.update({ deckTypeName: deckThumb.deckType.name })
//             h++
//         }
//     }

//     console.log(`synchronized ${h} DeckThumb deckTypeName with DeckType names`)

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

//     console.log(`deleted ${l} deckTypes without a corresponding Deck`)
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
//                 name: status.cardName,
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
//             duelingBookName: null,
//             opTcgSim: null,
//             hash: null,
//             isSubscriber: false,
//             isAdmin: false,
//             isContentManager: false,
//             isCreator: false
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
//                 duelingBookName: null,
//                 opTcgSim: null,
//                 hash: null,
//                 isSubscriber: false,
//                 isAdmin: false,
//                 isContentManager: false,
//                 isCreator: false
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
//     let count = 0

//     const allReplays = await Replay.findAll()

//     for (let i = 0; i < allReplays.length; i++) {
//         const replay = allReplays[i]
//         await replay.update({ display: false })
//     }

//     const server = await Server.findOne({ where: { id: '414551319031054346'}})
//     const primaryTournaments = [...await Event.findAll({ include: Tournament })].map((e) => e.tournament)
//     const topCutTournaments = await Tournament.findAll({ where: { isTopCutTournament: true }})

//     for (let i = 0; i < topCutTournaments.length; i++) {
//         const tournament = topCutTournaments[i]
//         const {data: {tournament: { participants_count }}} = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`)

//         const replays = await Replay.findAll({
//             where: {
//                 tournamentId: tournament.id
//             }
//         })

//         if (replays.length) console.log(`reviewing ${replays.length} replays from ${tournament.name}`)
//         count += replays.length

//         for (let j = 0; j < replays.length; j++) {
//             const replay = replays[j]
//             const round = replay.roundInt
//             let roundName
//             if (tournament.type === 'single elimination') {
//                 const totalRounds = Math.ceil(Math.log2(participants_count))
//                 const roundsRemaining = totalRounds - round
//                 roundName = roundsRemaining === 0 ? 'Finals' :
//                     roundsRemaining === 1 ? 'Semi Finals' :
//                     roundsRemaining === 2 ? 'Quarter Finals' :
//                     roundsRemaining === 3 ? 'Round of 16' :
//                     roundsRemaining === 4 ? 'Round of 32' :
//                     roundsRemaining === 5 ? 'Round of 64' :
//                     roundsRemaining === 6 ? 'Round of 128' :
//                     roundsRemaining === 7 ? 'Round of 256' :
//                     null
//             } else if (tournament.type === 'double elimination') {
//                 const totalWinnersRounds = Math.ceil(Math.log2(participants_count)) + 1
//                 const fullBracketSize = Math.pow(2, Math.ceil(Math.log2(participants_count)))
//                 const correction = (participants_count - (fullBracketSize / 2)) <= (fullBracketSize / 4) ? -1 : 0
//                 const totalLosersRounds = (totalWinnersRounds - 2) * 2 + correction
//                 if (round > 0) {
//                     const roundsRemaining = totalWinnersRounds - round
//                     if (roundsRemaining <= 0) {
//                         roundName = 'Grand Finals'
//                     } else if (roundsRemaining === 1) {
//                         roundName = `Winner's Finals`
//                     } else if (roundsRemaining === 2) {
//                         roundName = `Winner's Semis`
//                     } else if (roundsRemaining === 3) {
//                         roundName = `Winner's Quarters`
//                     } else {
//                         roundName = `Winner's Round of ${Math.pow(2, roundsRemaining)}`
//                     }
//                 } else {
//                     const roundsRemaining = totalLosersRounds - Math.abs(round)
//                     if (roundsRemaining <= 0) {
//                         roundName = `Loser's Finals`
//                     } else if (roundsRemaining === 1) {
//                         roundName = `Loser's Semis`
//                     } else if (roundsRemaining === 2) {
//                         roundName = `Loser's Thirds`
//                     } else if (roundsRemaining === 3) {
//                         roundName = `Loser's Fifths`
//                     } else {
//                         roundName = `Loser's Round ${Math.abs(round)}`
//                     }
//                 }
//             }

//             await replay.update({ display: true, roundName })
//             b++
//             console.log(`updated replay ${replay.id}`)
//         }
//     }
    
//     for (let i = 0; i < primaryTournaments.length; i++) {
//         try {
//             const tournament = primaryTournaments[i]
//             const {data: {tournament: { participants_count }}} = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeApiKey}`)
//             if (!participants_count) {
//                 console.log(`no participants_count found for replay ${tournament.name}`)
//                 continue
//             }
    
//             const replays = await Replay.findAll({
//                 where: {
//                     tournamentId: tournament.id
//                 },
//                 include: Match
//             })

//             if (replays.length) console.log(`reviewing ${replays.length} replays from ${tournament.name}`)
//             count += replays.length
        
//             for (let j = 0; j < replays.length; j++) {
//                 try {
//                     const replay = replays[j]
//                     let round
//                     let roundName
//                     let display

//                     if (!replay.roundInt) {
//                         const {data: challongeMatch} = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/matches/${replay?.match?.challongeMatchId}.json?api_key=${server.challongeApiKey}`)
//                         round = challongeMatch?.match?.round ||  ''
//                     } else {
//                         round = replay.roundInt
//                     }
            
//                     if (tournament.type === 'swiss' || tournament.type === 'round robin') {
//                         roundName = `Round ${round}`
//                         display = false
//                     } else if (tournament.type === 'single elimination') {
//                         const totalRounds = Math.ceil(Math.log2(participants_count))
//                         const roundsRemaining = totalRounds - round
//                         roundName = roundsRemaining === 0 ? 'Finals' :
//                             roundsRemaining === 1 ? 'Semi Finals' :
//                             roundsRemaining === 2 ? 'Quarter Finals' :
//                             roundsRemaining === 3 ? 'Round of 16' :
//                             roundsRemaining === 4 ? 'Round of 32' :
//                             roundsRemaining === 5 ? 'Round of 64' :
//                             roundsRemaining === 6 ? 'Round of 128' :
//                             roundsRemaining === 7 ? 'Round of 256' :
//                             null

//                         display = roundsRemaining === 0 || 
//                             participants_count > 8 && roundsRemaining <= 1 ||
//                             participants_count > 16 && roundsRemaining <= 2 ||
//                             participants_count > 32 && roundsRemaining <= 3

//                         console.log(`(SE) ${roundName}, display = ${display}, roundsRemaining = ${roundsRemaining}, participants_count = ${participants_count}`)
//                     } else if (tournament.type === 'double elimination') {            
//                         const totalWinnersRounds = Math.ceil(Math.log2(participants_count)) + 1
//                         const fullBracketSize = Math.pow(2, Math.ceil(Math.log2(participants_count)))
//                         const correction = (participants_count - (fullBracketSize / 2)) <= (fullBracketSize / 4) ? -1 : 0
//                         const totalLosersRounds = (totalWinnersRounds - 2) * 2 + correction

//                         if (round > 0) {
//                             const roundsRemaining = totalWinnersRounds - round
//                             if (roundsRemaining <= 0) {
//                                 roundName = 'Grand Finals'
//                             } else if (roundsRemaining === 1) {
//                                 roundName = `Winner's Finals`
//                             } else if (roundsRemaining === 2) {
//                                 roundName = `Winner's Semis`
//                             } else if (roundsRemaining === 3) {
//                                 roundName = `Winner's Quarters`
//                             } else {
//                                 roundName = `Winner's Round of ${Math.pow(2, roundsRemaining)}`
//                             }

//                             display = roundsRemaining === 0 ||
//                                 participants_count > 8 && roundsRemaining <= 1 ||
//                                 participants_count > 16 && roundsRemaining <= 2 ||
//                                 participants_count > 32 && roundsRemaining <= 3
                                
//                             console.log(`(DE) ${roundName}, display = ${display}, roundsRemaining = ${roundsRemaining}, participants_count = ${participants_count}`)
//                         } else {
//                             const roundsRemaining = totalLosersRounds - Math.abs(round)
                        
//                             if (roundsRemaining <= 0) {
//                                 roundName = `Loser's Finals`
//                             } else if (roundsRemaining === 1) {
//                                 roundName = `Loser's Semis`
//                             } else if (roundsRemaining === 2) {
//                                 roundName = `Loser's Thirds`
//                             } else if (roundsRemaining === 3) {
//                                 roundName = `Loser's Fifths`
//                             } else {
//                                 roundName = `Loser's Round ${Math.abs(round)}`
//                             }

//                             display = roundsRemaining === 0 ||
//                                 participants_count > 8 && roundsRemaining <= 1 ||
//                                 participants_count > 16 && roundsRemaining <= 2 ||
//                                 participants_count > 32 && roundsRemaining <= 3

//                             console.log(`(DE) ${roundName}, display = ${display}, roundsRemaining = ${roundsRemaining}, participants_count = ${participants_count}`)
//                         }
//                     } else {
//                         roundName = `Round ${round}`
//                         display = false
//                     }
    
//                     await replay.update({ roundName, display })
//                     console.log(`updated replay ${replay.id}`)
//                     b++
//                 }  catch (err) {
//                     console.log('err', err.message)
//                     e++
//                 }
//            }
//         } catch (err) {
//             console.log('err', err.message)
//             e++
//         }
//     }

//     return console.log(`updated ${b} out of ${count} replays and encountered ${e} errors`)
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
//                 isTcgLegal: false,
//                 tcgDate: null,
//                 isOcgLegal: false,
//                 ocgDate: null,
//                 isSpeedLegal: false,
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
//                 isTcgLegal: false,
//                 tcgDate: null,
//                 isOcgLegal: false,
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
//                 isTcgLegal: false,
//                 tcgDate: null,
//                 isOcgLegal: false,
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
//         const mainArr = cube.ydk.split('#main')[1].split(/[\s]+/).filter((e) => e.length) || []
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
//             const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`) 
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
//                 if (!card || !card.artworkId) continue
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
//                 const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`) 
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
//             .split(/[\s]+/)
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
//             const baseName = deck.deckTypeName || 'Unnamed Deck'
//             let name = baseName
//             let attempt = 0
//             let confirmed = false

//             while (!confirmed) {
//                 const nameInUse = await Deck.count({
//                     where: {
//                         name: name,
//                         formatId: deck.formatId,
//                         playerId: deck.builderId
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


// ;(async () => {
//     let b = 0
//     let e = 0
//     const cards = [...await Card.findAll()].filter((c) => parseInt(c.konamiCode).toString() !== c.ypdId)

//     for (let i = 0; i < cards.length; i++) {
//         try {
//             const card = cards[i]

//             const {data} = await axios({
//                 method: 'GET',
//                 url: `https://images.ygoprodeck.com/images/cards/${card.artworkId}.jpg`,
//                 responseType: 'stream'
//             })
        
//             const s3 = new S3({
//                 region: config.s3.region,
//                 credentials: {
//                     accessKeyId: config.s3.credentials.accessKeyId,
//                     secretAccessKey: config.s3.credentials.secretAccessKey
//                 }
//             })
        
//             const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/cards/${card.konamiCode}.jpg`, Body: data, ContentType: `image/jpg` }).promise()
//             console.log('uri', uri)
//             b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`saved ${b} out of ${cards.length} images, encountered ${e} errors`)
// })()


// ;(async () => {
//     const tournament = await Tournament.findOne({ where: {id: '103102119995051'}})
//     const timestamp = new Date(tournament.createdAt).getTime()
//     let i = 0
//     fs.createReadStream("./goatworlds2023.csv")
//         .pipe(parse({ delimiter: ",", from_line: 2 }))
//         .on("data", async (row) => {
//             const [winnerName, loserName, round] = row
//             let winningPlayer
//             let losingPlayer

//             let winners = await Player.findAll({
//                 where: {
//                     [Op.or]: {
//                         discordName: {[Op.iLike]: winnerName},
//                         globalName: {[Op.iLike]: winnerName}
//                     }
//                 }
//             })

//             if (!winners.length) {
//                 winners = [...await Alius.findAll({
//                     where: {
//                         formerName: {[Op.iLike]: winnerName}
//                     },
//                     include: Player
//                 })].map((a) => a.player)
//             }
    
//             if (!winners.length) {
//                 console.log(`CANNOT FIND WINNING PLAYER matching participant: ${winnerName}`)
//             } else if (winners.length > 1) {
//                 console.log(`Found multiple winners: ${winners.map((p, index) => `${index + 1}. ${p.discordName} (${p.discordId})`).join('\n')}`)
//             } else {
//                 winningPlayer = winners[0]
//             }

//             let losers = await Player.findAll({
//                 where: {
//                     [Op.or]: {
//                         discordName: {[Op.iLike]: loserName},
//                         globalName: {[Op.iLike]: loserName}
//                     }
//                 }
//             })

//             if (!losers.length) {
//                 losers = [...await Alius.findAll({
//                     where: {
//                         formerName: {[Op.iLike]: loserName}
//                     },
//                     include: Player
//                 })].map((a) => a.player)
//             }

//             if (!losers.length) {
//                 console.log(`CANNOT FIND LOSING PLAYER matching participant: ${loserName}`)
//             } else if (losers.length > 1) {
//                 console.log(`Found multiple losers: ${losers.map((p, index) => `${index + 1}. ${p.discordName} (${p.discordId})`).join('\n')}`)
//             } else {
//                 losingPlayer = losers[0]
//             }

//             if (winningPlayer && losingPlayer) {
//                 const count = await Match.count({
//                     where: {
//                         tournamentId: tournament.id,
//                         winnerId: winningPlayer.id,
//                         loserId: losingPlayer.id
//                     }
//                 })

//                 if (!count) {
//                     const createdAt = new Date(timestamp + i * 60 * 1000)
                        
//                     await Match.create({
//                         formatName: 'Goat',
//                         formatId: 8,
//                         round: round,
//                         winnerName: winningPlayer.name,
//                         loserName: losingPlayer.name,
//                         winnerId: winningPlayer.id,
//                         loserId: losingPlayer.id,
//                         isTournament: true,
//                         tournamentId: '103102119995051',
//                         serverId: '414551319031054346',
//                         createdAt: createdAt
//                     })

//                     i++
//                     console.log(`SAVED NEW MATCH data for ${winnerName} > ${loserName} (Round ${round})`)
//                 } else {
//                     console.log(`already had match data for ${winnerName} > ${loserName} (Round ${round})`)
//                 }
//             }

//     })
// })()

// ;(async () => {
//     const prints = await Print.findAll()
//     for (let i = 0; i < prints.length; i++) {
//         const print = prints[i]
//         await print.update({ description: null })
//     }

//     const cards = await Card.findAll()
//     let b = 0
//     let d = 0
//     let e = 0
//     const failures = []

//     for (let i = 0; i < cards.length; i++) {
//         const {name, id, category, isNormal} = cards[i]
//         if (category === 'Monster' && isNormal) {
//             const prints = await Print.findAll({ where: { cardId: id }})
//             for (let j = 0; j < prints.length; j++) {
//                 const print = prints[j]
//                 await print.update({ description: null })
//                 b++
//             }
//             d++
//             continue
//         }

//         let cardWasUpdated = false

//         try {
//             const url = `https://yugipedia.com/api.php?action=parse&format=json&page=Card_Errata:${name}`
//             const {data} = await axios.get(url)
//             const rows = data?.parse?.text?.["*"]?.split('<tr>').filter((r) => r.includes('<td>')) || []
    
//             for (let j = 0; j < rows.length; j++) {
//                 const row = rows[j]
//                 const cells = row.split('<td>')
//                 const numCols = row.match(/<th/g)?.length
    
//                 for (let k = 0; k < cells.length; k++) {
//                     const c = cells[k]
//                     const potentialCardCodes = c.split('<a href="/wiki/')
//                         .map((pcc) => pcc.slice(0, pcc.indexOf(`"`)))
//                         .filter((pcc) => 
//                             pcc.includes('-') && 
//                             !pcc.includes('<') && 
//                             !pcc.includes('.') && 
//                             !pcc.includes('-IT') && 
//                             !pcc.includes('-JP') && 
//                             !pcc.includes('-SP') && 
//                             !pcc.includes('-DE') && 
//                             !pcc.includes('-KR') && 
//                             !pcc.includes('-FR') && 
//                             !pcc.includes('-PT')
//                         )

//                     if (!potentialCardCodes.length) continue
//                     let print

//                     for (let z = 0; z < potentialCardCodes.length; z++) {
//                         const potentialCardCode = potentialCardCodes[z]
//                         print = await Print.findOne({
//                             where: {
//                                 cardId: id,
//                                 cardCode: potentialCardCode
//                             }
//                         })

//                         if (print) break
//                     }
    
    
//                     if (!print) {
//                         console.log(`No print for ${name} - (potential card codes: [${potentialCardCodes.join(',')})]`)
//                         continue
//                     }
    
//                     const rawDesc = cells[k - numCols]
//                     const description = rawDesc?.slice(0, rawDesc.indexOf('</td>'))
//                         .replaceAll('<ins>', '')
//                         .replaceAll('</ins>', '')
//                         .replaceAll('<br>', '\n')
//                         .replaceAll('<br >', '\n')
//                         .replaceAll('<br/>', '\n')
//                         .replaceAll('<br />', '\n')
//                         .replaceAll('<del>', '')
//                         .replaceAll('</del>', '')
//                         .replaceAll('<b>', '')
//                         .replaceAll('</b>', '')
//                         .replaceAll('<i>', '')
//                         .replaceAll('</i>', '')
//                         .replaceAll('<strong>', '')
//                         .replaceAll('</strong>', '')
//                         .replaceAll('<center>', '')
//                         .replaceAll('</center>', '')
//                         .replaceAll('<span class="original">', '')
//                         .replaceAll('</span>', '')
                        

//                     console.log(`UPDATING PRINT: ${print.cardCode} - ${name}`)
//                     await print.update({ description })
//                     b++

//                     if (!cardWasUpdated) {
//                         cardWasUpdated = true
//                         d++
//                     }
//                 }
//             }

//             if (!cardWasUpdated) failures.push(name)
//         } catch(err) {
//             e++
//             failures.push(name)
//             console.log(`Error processing card: ${name}`, err)
//         }
//     }

//     console.log(`Failed to update the following ${failures.length} cards:\n`, failures.sort().join('\n'))
//     return console.log(`Updated descriptions for ${b} prints, from ${d} out of ${cards.length} cards, encountered ${e} errors.`)
// })()


// ;(async () => {
//     {
//         const rulings = await Ruling.findAll({
//             where: {
//                 formatName: {[Op.or]: ['Stein', 'Trooper', 'Perfect Circle', 'DAD Return', 'Gladiator', 'TeleDAD', 'Cat']}
//             }
//         })
     
//         for (let j = 0; j < rulings.length; j++) {
//             await rulings[j].destroy()
//         }
//     }

//     {
//         const cardIds = [...await Ruling.findAll({
//             where: {
//                 formatName: 'Edison'
//             }
//         })].map((r) => r.cardId)
    
     
//         for (let i = 0; i < cardIds.length; i++) {
//             const cardId = cardIds[i]
//             console.log('cardId', cardId)
//             const tenguRulings = await Ruling.findAll({
//                 where: {
//                     cardId: cardId,
//                     formatName: 'Tengu Plant'
//                 }
//             })
     
     
//             for (let j = 0; j < tenguRulings.length; j++) {
//                 await tenguRulings[j].destroy()
//             }
//         }
//     }

//     {

//         const cardIds = [...await Status.findAll({
//             where: {
//                 banlist: 'March 2010',
//                 restriction: 'forbidden'
//             }
//         })].map((r) => r.cardId)
     
     
//         for (let i = 0; i < cardIds.length; i++) {
//             const cardId = cardIds[i]
//             console.log('cardId', cardId)
//             const edisonRulings = await Ruling.findAll({
//                 where: {
//                     cardId: cardId,
//                     formatName: 'Edison'
//                 }
//             })
     
     
//             for (let j = 0; j < edisonRulings.length; j++) {
//                 console.log(`destroying ${edisonRulings[j]?.cardName} edison ruling`)
//                 await edisonRulings[j].destroy()
//             }
//         }  
//     }

//     {
//         const similarity = (s1, s2) => {
//             let longer = s1;
//             let shorter = s2;
//             if (s1.length < s2.length) {
//               longer = s2;
//               shorter = s1;
//             }
//             const longerLength = longer.length;
//             if (longerLength == 0) {
//               return 1.0;
//             }
//             return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
//           }
//            const editDistance = (s1, s2) => {
//             s1 = s1.toLowerCase()
//             s2 = s2.toLowerCase()
//              const costs = []
//             for (let i = 0; i <= s1.length; i++) {
//               let lastValue = i
//               for (let j = 0; j <= s2.length; j++) {
//                 if (i == 0)
//                   costs[j] = j
//                 else {
//                     if (j > 0) {
//                         let newValue = costs[j - 1];
//                         if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
//                             newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
//                         }
//                         costs[j - 1] = lastValue;
//                         lastValue = newValue;
//                       }
//                 }
//               }
//               if (i > 0)
//                 costs[s2.length] = lastValue
//             }
//             return costs[s2.length]
//           }
     
     
//         const genericRulings = await Ruling.findAll({ where: { formatId: null }})
//         for (let i = 0; i < genericRulings.length; i++) {
//             const genericRuling = genericRulings[i]
//             const goatRulings = await Ruling.findAll({
//                 where: {
//                     cardId: genericRuling.cardId,
//                     formatName: {[Op.or]: ['Goat', 'Edison']}
//                 }
//             })
           
//             for (let j = 0; j < goatRulings.length; j++) {
//                 const goatRuling = goatRulings[j]
//                 const simScore = similarity(genericRuling.content, goatRuling.content)
//                 if (simScore > 0.75) {
//                     console.log(`destroying:\n${goatRuling.content}\n-----\ncounterpart: ${genericRuling.content}\n\n`)
//                     await goatRuling.destroy()
//                 }
//             }
//         } 
//     }

// })()

// ;(async () => {
//     let b = 0
//     let e = 0
//     const names = []

//     const { data } = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes')
//     for (let i = 0; i < data.data.length; i++) {
//         const datum = data.data[i]
//         const id = datum.id.toString()
//         const name = datum.name
//         const description = datum.desc
//         const betaId = datum.misc_info[0]?.beta_id?.toString()
//         const betaName = datum.misc_info[0]?.beta_name
//         if (!betaId || !betaName) continue

//         try {
//             const betaCard = await Card.findOne({
//                 where: {
//                     ypdId: betaId,
//                     name: betaName
//                 }
//             })
    
//             const card = await Card.findOne({
//                 where: {
//                     ypdId: id,
//                     name: name
//                 }
//             })

//             if (betaCard && card && betaCard.id !== card.id) {
//                 console.log(`destroying ${betaCard.name} (${betaCard.ypdId}), which is now ${card.name} (${card.ypdId})`)
//                 await betaCard.destroy()
//                 await card.update({ description })
//                 names.push(card.name)
//                 b++
//             } else if (betaCard && !card) {
//                 console.log(`Beta Card: ${betaCard.name} (${betaCard.ypdId}) exists, but ${card.name} (${card.ypdId}) does not ⚠️`)
//             } else if (!betaCard && card) {
//                 console.log(`${card.name} (${card.ypdId}) exists, while Beta Card: ${betaName} (${betaId}) does not 👍`)
//                 await card.update({ description })
//                 names.push(card.name)
//                 b++
//             } else {                
//                 console.log(`Beta Card: ${betaCard.name} (${betaCard.ypdId}) and ${card.name} (${card.ypdId}) share the same FL id: (${betaCard.id})`)
//                 await card.update({ description })
//                 names.push(card.name)
//                 b++
//             }
//         } catch (err) {
//             e++ 
//             console.log(err)
//         }
//     }

//     console.log(`Updated descriptions of ${b} cards. Encountered ${e} errors.`)
//     console.log(names.sort().join('\n'))
//     return
// })()


// ;(async () => {
//     let b = 0
//     let e = 0
//     const allStats = await Stats.findAll()
//     for (let i = 0; i < allStats.length; i++) {
//         try {
//             const stats = allStats[i]
//             const format = await Format.findOne({
//                 where: {
//                     name: {[Op.iLike]: stats.formatName }
//                 }
//             })
    
//             await stats.update({ formatId: format.id })
//             b++
//         } catch (err) {
//             e++
//             console.log(err)
//         }
//     }

//     return console.log(`updated ${b} out of ${allStats.length} stats rows, encountered ${e} errors`)
// })()

// ;(async () => { 
//     const players = await Player.findAll({
//         where: {
//             country: {
//                 [Op.not]: null
//             }
//         }
//     })

//     for (let i = 0; i < players.length; i++) {
//         const player = players[i]
//         const country = iso2ToCountries[player.country]
//         await player.update({ country })
//     }

//     return console.log('Fin.')
// })()



// ;(async () => { 
//     // find latest prints for all tengu cards
//     const cards = await Card.findAll({
//         where: {
//             tcgDate: {
//                 [Op.lte]: '2011-09-17'
//             }
//         }
//     })

//     const prints = []

//     for (let i = 0; i < cards.length; i++) {
//         const card = cards[i]
//         try {
//             const print = await Print.findOne({
//                 where: {
//                     cardId: card.id,
//                     description: {[Op.not]: null},
//                     '$set.tcgDate$': {[Op.lte]: '2011-09-17'}
//                 },
//                 include: Set,
//                 order: [[Set, 'tcgDate', 'DESC']] 
//             }) || await Print.findOne({
//                 where: {
//                     cardId: card.id,
//                     original: true
//                 }
//             })
    
//             if (!print) {
//                 console.log(`no print found for ${card.name}`)
//                 continue
//             }

//             if (!print.description) {
//                 await print.update({ description: card.description })
//             }    

//             prints.push(print)
//         } catch (err) {
//             console.log(`Error !!! ${card.name}`, err)
//         }
//     }

//     fs.writeFile('./tengu-prints.json', JSON.stringify(prints), (err) => {
//         if (err) return console.error(err)
//         console.log('Tengu prints stored to', './tengu-prints.json')
//     })

//     return console.log('Fin.')
// })()

// ;(async () => { 
//     const cards = await Card.findAll()
//     for (let i = 0; i < cards.length; i++) {
//         const card = cards[i]
//         const artwork = await Artwork.findOne({
//             where: {
//                 cardId: card.id,
//                 isOriginal: true
//             }
//         })

//         if (artwork) {
//             await card.update({ artworkId: artwork.artworkId })
//         } else {
//             console.log(`hmm no original artwork for ${card.name}?`)
//             await card.update({ artworkId: card.ypdId })
//         }
//     }
// })()

// ;(async () => { 
//     const events = await Event.findAll({ 
//         where: {
//             tournamentId: {[Op.not]: null }
//         },
//         include: Tournament
//      })

//     for (let i = 0; i < events.length; i++) {
//         const event = events[i]
//         await event.update({ serverId: event.tournament.serverId})
//     }

//     return console.log('done')
// })()

// ;(async () => { 
//     const cards = await Card.findAll()
//     for (let i = 0; i < cards.length; i++) {
//         const card = cards[i]
//         const artwork = await Artwork.findOne({
//             where: {
//                 cardId: card.id,
//                 isOriginal: true
//             }
//         })

//         if (artwork) {
//             await card.update({ artworkId: artwork.artworkId })
//         } else {
//             console.log(`hmm no original artwork for ${card.name}?`)
//             await card.update({ artworkId: card.ypdId })
//         }
//     }
// })()


// ;(async () => { 
//     let b = 0
//     b = 0
//     const blogposts = await BlogPost.findAll({ 
//         where: { 
//             winningTeamId: null
//         },
//         include: [Event, Format, Server, { model: Player, as: 'winner' }]
//     })


//     for (let i = 0; i < blogposts.length; i++) {
//         try {
//             const blogpost = blogposts[i]
            
//             const deck = await Deck.findOne({
//                 where: {
//                     eventId: blogpost.eventId,
//                     placement: 1
//                 }
//             })

//             const decks = await Deck.findAll({ 
//                 where: {
//                     formatId: blogpost.formatId
//                 }
//             })
                     
//             const sortFn = (a, b) => b[1] - a[1]

//             const freqs = (decks || []).reduce((acc, curr) => (acc[curr.deckTypeName] ? acc[curr.deckTypeName]++ : acc[curr.deckTypeName] = 1, acc), {})
//             const popularDecks = Object.entries(freqs).sort(sortFn).map((e) => e[0]).slice(0, 6)
            
//             console.log(`updating blogpost for ${blogpost.eventAbbreviation}, popular decktype: ${blogpost.winningDeckTypeIsPopular} -> ${popularDecks.includes(deck.deckTypeName)}`)
//             await blogpost.update({ 
//                 winningDeckTypeIsPopular: popularDecks.includes(deck.deckTypeName),
//                 serverId: blogpost.server?.id
//             })
//             b++
//         } catch (err) {
//             console.log('blogpost error', err)
//         }
//     }

//     return console.log('updated blogposts:', b)
// })()


// ;(async () => { 
//     let b = 0
//     b = 0
//     const matchups = await Matchup.findAll({ 
//         include: [{ model: DeckType, as: 'winningDeckType'}, { model: DeckType, as: 'losingDeckType' }]
//     })


//     for (let i = 0; i < matchups.length; i++) {
//         try {
//             const matchup = matchups[i]
            
//             await matchup.update({ 
//                 winningDeckTypeName: matchup.winningDeckType.name,
//                 losingDeckTypeName: matchup.losingDeckType.name
//             })
//             b++
//         } catch (err) {
//             console.log('matchup error', err)
//         }
//     }

//     console.log('updated matchup:', b)
//     return
// })()

// ;(async () => { 
//     let b = 0
//     let e = 0
//     const replays = await Replay.findAll({
//         where: {
//             eventId: null,
//             tournamentId: {[Op.not]: null},
//             '$tournament.state$': 'complete'
//         },
//         include: Tournament,
//         order: [['tournamentId', 'DESC']]
//     })

//     for (let i = 0; i < replays.length; i++) {
//         try {
//             const replay = replays[i]
//             const event = await Event.findOne({
//                 where: {
//                     [Op.or]: {
//                         primaryTournamentId: replay.tournamentId,
//                         topCutTournamentId: replay.tournamentId
//                     }
//                 }
//             })

//             if (!event) {
//                 console.log('no event found for tournament name:', replay.tournament.name, 'id:', replay.tournamentId, )
//             } else {
//                 await replay.update({ 
//                     eventId: event.id,
//                     eventAbbreviation: event.abbreviation
//                 })
//                 b++
//             }
//         } catch (err) {
//             console.log('replay error', err)
//             e++
//         }
//     }

//     console.log('updated replays:', b, '\nerrors:', e)
//     return
// })()


// ;(async () => { 
//     let b = 0
//     let e = 0
//     const stats = await Stats.findAll()

//     for (let i = 0; i < stats.length; i++) {
//         try {
//             const stat = stats[i]
//             await stat.update({ isActive: !stat.isActive})
//             b++
//         } catch (err) {
//             console.log('stats error', err)
//             e++
//         }
//     }

//     console.log('updated stats:', b, '\nerrors:', e)

//     b = 0
//     e = 0

//     const tournaments = await Tournament.findAll()
//     for (let i = 0; i < tournaments.length; i++) {
//         try {
//             const tournament = tournaments[i]
//             await tournament.update({ isRated: !tournament.isRated})
//             b++
//         } catch (err) {
//             console.log('tournament error', err)
//             e++
//         }
//     }

//     console.log('updated tournaments:', b, '\nerrors:', e)
//     return
// })()


// ;(async () => { 
//     let b = 0
//     let e = 0
//     const servers = await Server.findAll({ where: { formatName: {[Op.not]: null}}})

//     for (let i = 0; i < servers.length; i++) {
//         try {
//             const server = servers[i]
//             const format = await Format.findOne({
//                 where: {
//                     name: server.formatName
//                 }
//             })

//             if (format) {
//                 await server.update({ formatId: format?.id })
//                 b++
//             }
//         } catch (err) {
//             console.log('server error', err)
//             e++
//         }
//     }

//     console.log('updated servers:', b, '\nerrors:', e)
//     return
// })()


// ;(async () => { 
//     let b = 0
//     let e = 0
//     const matches = await Match.findAll({ 
//         where: { 
//             loserName: null
//         },
//         include: { model: Player, as: 'loser' }
//     })

//     for (let i = 0; i < matches.length; i++) {
//         try {
//             const match = matches[i]
//             await match.update({ loserName: match.loser?.name })
//             b++
//         } catch (err) {
//             console.log('match error', err)
//             e++
//         }
//     }

//     console.log('updated matches:', b, '\nerrors:', e)


//     const stats = await Stats.findAll({ 
//         include: Player
//     })

//     b = 0
//     e = 0
//     for (let i = 0; i < stats.length; i++) {
//         try {
//             const stat = stats[i]
//             await stat.update({ playerName: stat.player?.name })
//             b++
//         } catch (err) {
//             console.log('stat error', err)
//             e++
//         }
//     }

//     console.log('updated stats:', b, '\nerrors:', e)
//     return
// })()


// ;(async () => { 
//     const replays = await Replay.findAll({ include: Tournament })

//     let b = 0
//     for (let i = 0; i < replays.length; i++) {
//         const replay = replays[i]

//         await replay.update({ 
//             display: false, 
//             roundName: getRoundName(replay?.tournament, replay.roundInt, replay?.tournament?.size) || replay.roundName,
//             roundAbs: Math.abs(replay.roundInt)
//         })
//         b++
//     }

//     console.log('updated replays:', b)

//     const events = await Event.findAll()
//     for (let i = 0; i < events.length; i++) {
//         const event = events[i]

//         if (event.primaryTournamentId && !event.topCutTournamentId) {
//             const primaryTournament = await Tournament.findOne({ where: { id: event.primaryTournamentId }})
//             const primaryReplays = await Replay.findAll({ 
//                 where: {
//                     tournamentId: primaryTournament.id
//                 }
//             })
         
//             let b = 0
//             for (let i = 0; i < primaryReplays.length; i++) {
//                 try {
//                     const replay = primaryReplays[i]
//                     const round = replay.roundInt
//                     let display = false
            
//                     if (primaryTournament.type === 'single elimination') {
//                         const totalRounds = Math.ceil(Math.log2(event.size))
//                         const roundsRemaining = totalRounds - round
//                         display = roundsRemaining === 0 || 
//                             event.size > 8 && roundsRemaining <= 1 ||
//                             event.size > 16 && roundsRemaining <= 2 ||
//                             event.size > 32 && roundsRemaining <= 3
//                     } else if (primaryTournament.type === 'double elimination') {
//                         const totalWinnersRounds = Math.ceil(Math.log2(event.size)) + 1
//                         const fullBracketSize = Math.pow(2, Math.ceil(Math.log2(event.size)))
//                         const correction = (event.size - (fullBracketSize / 2)) <= (fullBracketSize / 4) ? -1 : 0
//                         const totalLosersRounds = (totalWinnersRounds - 2) * 2 + correction

//                         if (round > 0) {
//                             const roundsRemaining = totalWinnersRounds - round
//                             display = roundsRemaining <= 0 || 
//                                 event.size > 8 && roundsRemaining <= 1 ||
//                                 event.size > 16 && roundsRemaining <= 2 ||
//                                 event.size > 64 && roundsRemaining <= 3
//                         } else {
//                             const roundsRemaining = totalLosersRounds - Math.abs(round)
//                             display = event.size > 8 && roundsRemaining <= 0 ||
//                                 event.size > 16 && roundsRemaining <= 2 ||
//                                 event.size > 64 && roundsRemaining <= 4                            
//                         }
//                     }

//                     if (display && !replay.display) b++
                    
//                     await replay.update({
//                         display: display
//                     })
//                 } catch (err) {
//                     console.log(err)
//                 }
//             }
    
//            console.log(`Displayed ${b} new replays for ${event.name}.`)
//         } else if (event.topCutTournamentId) {
//             const topCutReplays = await Replay.findAll({ 
//                 where: {
//                     tournamentId: event.topCutTournamentId,
//                     display: false
//                 }
//             })
        
//             let b = 0
//             for (let i = 0; i < topCutReplays.length; i++) {
//                 try {
//                     const replay = topCutReplays[i]
//                     if (!replay.display) b++
    
//                     await replay.update({
//                         display: true
//                     })
//                 } catch (err) {
//                     console.log(err)
//                 }
//             }
        
//             if (b) {
//                 console.log(`Displayed ${b} new top cut replays for ${event.name}.`)
//             } else {
//                 console.log(`All top cut replays for ${event.name} were already published. 👏`)
//             }
//         } else {
//             console.log(`NO TOURNAMENT FOUND FOR: ${event.name}.`)
//         }
//     }
// })()


// ;(async () => {
//     let b = 0
//     let c = 0
//     let d = 0
//     let e = 0
    
//     const cards = await Card.findAll()
//     const sets = await Set.findAll({
//         where: {
//             legalDate: null
//         }
//     })
//     const missingCards = []

//     for (let i = 0; i < sets.length; i++) {
//         const set = sets[i]
//         await set.update({ legalDate: set.releaseDate })
//         b++
//     }

//     for (let i = 0; i < cards.length; i++) {
//         try {
//             const card = cards[i]
//             const prints = await Print.findAll({ 
//                 where: {
//                     cardId: card.id,
//                     '$set.legalDate$': {[Op.not]: null}
//                 }, 
//                 include: Set,
//                 order: [[Set, 'legalDate', 'ASC']]
//             })

//             if (!prints.length) {
//                 missingCards.push(card.name)
//                 continue
//             }

//             const set = prints[0]?.set

//             if (card.tcgDate === '0000-00-00' || card.tcgDate > set.legalDate) {
//                 await card.update({ tcgDate: set.legalDate })
//                 console.log(`${card.name} (${set.name}) was released on ${set.releaseDate} but not legal until ${set.legalDate}`)
//                 c++
//             }
//         } catch (err) {
//             console.log(err)
            
//             e++
//         }
//     }

//     console.log(`updated legal dates for ${b} sets`)
//     console.log(`missing ${d} cards:`, missingCards)
//     return console.log(`updated legal dates for ${c} cards and encountered ${e} errors`)
// })()


// ;(async () => {
//     let b = 0
//     const stats = await Stats.findAll({
//         where: {
//             isActive: false
//         }
//     })

//     for (let i = 0; i < stats.length; i++) {
//         const stat = stats[i]
//         await stat.update({ isActive: true })
//         b++
//     }

//     console.log(`re-activated ${b} player stats`)
// })()


// ;(async () => {
//     let b = 0
//     const tournaments = await Tournament.findAll({
//         where: {
//             serverId: {[Op.not]: null}
//         },
//         include: Server
//     })

//     for (let i = 0; i < tournaments.length; i++) {
//         const tournament = tournaments[i]
//         if (tournament.communityName !== tournament.server.communityName) {
//             await tournament.update({ communityName: tournament.server.communityName })
//             console.log(`changing the ${tournament.name} community name to ${tournament.server.communityName}`)
//             b++
//         }
//     }

//     console.log(`updated ${b} tournaments `)
// })()


// ;(async () => {
//     let b = 0
//     let e = 0

//     const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
//     const statuses = await Status.findAll()
//     for (let i = 0; i < statuses.length;i++) {
//         try {
//             const status = statuses[i]
//             const [year, month] = status.banlist.split('-')
//             const banlist = `${months[month-1]} ${year}`
//             console.log(banlist)
//             await status.update({banlist})
//             b++
//         } catch (err) {
//             console.log(err)
//             e++
//             continue
//         }
//     }

//     return console.log(`updated ${b} banlists, encountered ${e} errors`)
// })()


// ;(async () => {
//     let b = 0
//     let e = 0
//     const { data } = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes')

//     const s3 = new S3({
//         region: config.s3.region,
//         credentials: {
//             accessKeyId: config.s3.credentials.accessKeyId,
//             secretAccessKey: config.s3.credentials.secretAccessKey
//         }
//     })

//     for (let i = 0; i < data.data.length; i++) {
//         const datum = data.data[i]
//         const betaId = datum.misc_info[0]?.beta_id?.toString()
//         if (!betaId) continue

//         try {
//             const data = await s3.send(new DeleteObjectCommand({ Bucket: 'formatlibrary', Key: `images/artworks/${betaId}.jpg`}))
//             console.log("Success. Object deleted.", data)
//             b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     console.log(`deleted ${b} beta card images, encountered ${e} errors`)
// })()


// ;(async () => {
//     let b = 0
//     let e = 0
    
//     for (let i = 0; i < statuses.length; i++) {
//         try {
//             const data = statuses[i]
//             const card = await Card.findOne({
//                 where: {
//                     name: data.cardName
//                 }
//             })
            
//             await Status.create({
//                 cardName: data.cardName,
//                 cardId: card.id,
//                 restriction: data.restriction,
//                 previous: data.previous,
//                 date: data.date,
//                 banlist: data.banlist,
//                 category: 'OCG'
//             })

//             console.log(`new status: ${data.cardName} = ${data.restriction} (was ${data.previous})`)
//            b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     console.log(`created ${b} ocg statuses, encountered ${e} errors`)
// })()


// ;(async () => {
//     let b = 0
//     let e = 0

//     const statuses = await Status.findAll({
//         where: {
//             category: 'OCG'
//         }
//     })

//     const banlists = [...new Set([...await Status.findAll({
//         where: {
//             category: 'OCG'
//         },
//         order: [['date', 'ASC']]
//     })].map((s) => s.banlist))]
//     console.log('banlists', banlists)
    
//     for (let i = 0; i < banlists.length; i++) {
//         try {
//             const banlist = banlists[i]
//             const {date} = await Status.findOne({
//                 where: {
//                     banlist: banlist,
//                     category: 'OCG'
//                 }
//             }) 
            
//             // console.log(`new format: ${banlist} - ${date}`)
//             // continue
//             const format = await Format.create({
//                 name: banlist,
//                 cleanName: banlist,
//                 banlist: banlist,
//                 date: date,
//                 category: 'OCG'
//             })

//             console.log(`new format: ${format.name} - ${format.date}`)
//            b++
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     console.log(`created ${b} ocg formats, encountered ${e} errors`)
// })()


// ;(async () => {
//     let a = 0
//     let b = 0
//     let e = 0

//     // const prints = await Print.findAll({
//     //     where: {
//     //         setId: {[Op.not]: null},
//     //         cardId: {[Op.not]: null}
//     //     },
//     //     include: [Set, Card]
//     // })

//     // for (let i = 0; i < prints.length;i++) {
//     //     try {
//     //         const print = prints[i]
//     //         const legalOnRelease = !!print.set?.legalDate
//     //         const legalDate = print.set?.legalDate
//     //         await print.update({ legalOnRelease, legalDate })
//     //         b++
//     //     } catch (err) {
//     //         console.log(err)
//     //         e++
//     //         continue
//     //     }
//     // }

//     const cards = await Card.findAll({
//         where: {
//             isTcgLegal: true,
//             tcgDate: {[Op.not]: null}
//         },
//         order: [['name', 'ASC']]
//     })
    
//     for (let i = 0; i < cards.length; i++) {
//         try {
//             const card = cards[i]
//             const firstLegalPrint = await Print.findOne({
//                 where: {
//                     cardId: card.id,
//                     legalOnRelease: true
//                 },
//                 order: [['legalDate', 'ASC']]
//             })
            
//             // const firstLegalPrint = prints[i]
//             if (!firstLegalPrint) continue
    
//             if (firstLegalPrint.legalDate < card.tcgDate) {
//                 console.log(`Type 1 Discrepancy: ${card.name}'s first legal print ${firstLegalPrint.cardCode} was legal on ${firstLegalPrint.legalDate}. The card is listed as tcgLegal on ${card.tcgDate}.`)
//                 a++
//             } else if (firstLegalPrint.legalDate > card.tcgDate) {
//                 console.log(`Type 2 Discrepancy: ${card.name}'s first legal print ${firstLegalPrint.cardCode} was legal on ${firstLegalPrint.legalDate}. The card is listed as tcgLegal on ${card.tcgDate}.`)
//                 await card.update({ tcgDate: firstLegalPrint.legalDate })
//                 b++
//             // } else {
//             //    console.log(`${card.name}'s first legal print ${firstLegalPrint.cardCode} matches its tcg legal date: ${card.tcgDate}`)
//             }
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`found ${a} type 1 discrepancies and updated ${b} type 2 discrepancies, encountered ${e} errors`)
// })()


// ;(async () => {
//     let b = 0
//     let e = 0
//     const formats = []
//     const tournamentNames = []

//     const tournaments = await Tournament.findAll({
//         where: {
//             isRated: false
//         }
//     })

//     for (let i = 0; i < tournaments.length; i++) {
//         const tournament = tournaments[i]
//         if (!formats.includes(tournament.formatName)) formats.push(tournament.formatName)
//             tournamentNames.push(tournament.name)
//         const matches = await Match.findAll({
//             where: {
//                 tournamentId: tournament.id
//             }
//         })

//         for (let j = 0; j < matches.length; j++) {
//             const match = matches[j]
//             console.log(`destroying match ${match.id}: ${match.winnerName} > ${match.loserName} (${tournament.name})`)
//             await match.destroy()
//             b++
//         }
//     }

//     console.log('formats', formats)
//     console.log('tournamentNames', tournamentNames)
//     return console.log(`destroyed ${b} matches from ${tournaments.length}, encountered ${e} errors`)
// })()

// ;(async () => {
//     let d = 0
//     let e = 0
//     const playerNames = []

//     const allStats = await Stats.findAll({ where: {serverId: '414551319031054346'}, include: Player })

//     for (let i = 0; i < allStats.length; i++) {
//         try {
//             const stats = allStats[i]
//             if (!stats.playerName) await stats.update({playerName: stats.player.name})
//             const duplicates = await Stats.findAll({
//                 where: {
//                     id: {[Op.not]: stats.id},
//                     playerId: stats.playerId,
//                     formatId: stats.formatId
//                 }
//             })

//             if (duplicates.length) playerNames.push([stats.playerName, stats.formatName, duplicates.length])

//             for (let j = 0; j < duplicates.length; j++) {
//                 await duplicates[j].destroy()
//                 d++
//             }
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     console.log('affected players:\n', playerNames.join('\n'))
//     return console.log(`destroyed ${d} duplicates, encountered ${e} errors`)
// })()

// ;(async () => {
//     let c = 0
//     let d = 0
//     let e = 0

//     const events = await Event.findAll({ where: { display: true, isTeamEvent: false }, include: [Server, { model: Player, as: 'winner' }] })
//     for (let i = 0; i < events.length; i++) {
//         try {
//             const event = events[i]
//             const blogpost = await BlogPost.findOne({
//                 where: {
//                     eventId: event.id
//                 }
//             })

//             await blogpost.update({
//                 winnerPfp: event.winner?.discordId || event.winner?.name,
//             })
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`created ${d} communities, ${c} blogposts, encountered ${e} errors`)
// })()

// // COMPARE DECKS
// export const compareDecks = (arr1, arr2) => {
//     let score = 0
//     let avgSize = (arr1.length + arr2.length) / 2

//     for (let i = 0; i < arr1.length; i++) {
//         const id = arr1[i]
//         const index = arr2.indexOf(id)
//         if (index !== -1) {
//             score++
//             arr2.splice(index, 1)
//         }
//     }

//     return score / avgSize
// }

// //GET DECK TYPE
// export const getDeckType = async (deckfile, formatName) => {
//     const main = deckfile?.split('#extra')[0]
//     if (!main) return
//     const primaryDeckArr = main.split(/[\s]+/).filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()

//     const format = await Format.findOne({
//         where: {
//             name: {[Op.iLike]: formatName}
//         }
//     })

//     const priorFormats = await Format.findAll({
//         where: {
//             date: {[Op.lt]: format.date}
//         },
//         order: [['date', 'DESC']]
//     })


//     const laterFormats = await Format.findAll({
//         where: {
//             date: {[Op.gt]: format.date}
//         },
//         order: [['date', 'ASC']]
//     })

//     const interleaveArrays = (arr1, arr2) => {
//         const result = []
//         const maxLength = Math.max(arr1.length, arr2.length)
      
//         for (let i = 0; i < maxLength; i++) {
//           if (i < arr1.length) {
//             result.push(arr1[i])
//           }
//           if (i < arr2.length) {
//             result.push(arr2[i])
//           }
//         }
      
//         return result
//     }

//     const nearbyFormats = interleaveArrays(priorFormats, laterFormats)

//     let labeledDecks = await Deck.findAll({
//         where: {
//             deckTypeName: {[Op.not]: 'Other' },
//             deckTypeId: {[Op.not]: null },
//             formatId: format.id
//         },
//         include: DeckType,
//         limit: 1000,
//         order: [['createdAt', 'DESC']]
//     })

//     if (labeledDecks.length < 1000) {
//         for (let i = 0; i < nearbyFormats.length; i++) {
//             const nearbyFormat = nearbyFormats[i]
//             const additionalDecks = await Deck.findAll({
//                 where: {
//                     deckTypeName: {[Op.not]: 'Other' },
//                     deckTypeId: {[Op.not]: null },
//                     formatId: nearbyFormat.id
//                 },
//                 include: DeckType,
//                 limit: 1000 - labeledDecks.length,
//                 order: [['createdAt', 'DESC']]
//             })

//             labeledDecks = [...labeledDecks, ...additionalDecks]
//         }
//     }

//     const similarityScores = []

//     for (let i = 0; i < labeledDecks.length; i++) {
//         const otherDeck = labeledDecks[i]
//         const otherMain = otherDeck.ydk.split('#extra')[0]
//         if (!otherMain) continue
//         const comparisonDeckArr = otherMain.split(/[\s]+/).filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()

//         const score = compareDecks(primaryDeckArr, comparisonDeckArr)
//         similarityScores.push([score, otherDeck.deckType])
//     }

//     similarityScores.sort((a, b) => {
//         if (a[0] > b[0]) {
//             return -1
//         } else if (a[0] < b[0]) {
//             return 1
//         } else {
//             return 0
//         }
//     })
    
//     if (similarityScores[0]?.[0] > 0.65) {
//         return similarityScores[0][1]  
//     }
// }

// ;(async () => {
//     let d = 0
//     let e = 0
    
//     const decks = await Deck.findAll({ where: { formatName: {[Op.not]: null}, origin: 'event', deckTypeId: {[Op.or]: [null, 124]}}, order: [['id', 'ASC']]})
//     try {
//         for (let i = 0; i < decks.length; i++) {
//             const deck = decks[i]
//             console.log('getting decktype for:', deck.id)
//             const deckType = await getDeckType(deck.ydk, deck.formatName)
//             if (deckType?.id && deckType.id !== deck.deckTypeId) {
//                 console.log('new deckType:', deck.deckTypeName, '->', deckType.name)
//                 await deck.update({ deckTypeName: deckType.name, deckTypeId: deckType.id, category: deckType.category })
//                 d++
//             }
//         }
//     } catch (err) {
//         console.log(err)
//         e++
//     }

//     return console.log(`updated the ${d} decks, encountered ${e} errors`)
// })()

// ;(async () => {
//     let f = 0
//     let l = 0
//     let u = 0
//     let e = 0

//     const prints = await Print.findAll({ order: [['cardName', 'ASC']]})
//     const daysBetween = (d1, d2) => {
//         const timeElapsed = Math.abs(d2.getTime() - d1.getTime())
//         const difference = Math.ceil(timeElapsed / (1000 * 60 * 60 * 24))
//         return difference
//     }

//     try {
//         for (let i = 0; i < prints.length; i++) {
//             const print = prints[i]
//             const firstEditionPrices = await Price.findAll({
//                 where: {
//                     printId: print.id,
//                     edition: '1st Edition',
//                     source: 'TCGplayer'
//                 },
//                 order: [['createdAt', 'ASC']]
//             })

//             for (let j = 0; j < firstEditionPrices.length - 1; j++) {
//                 const currPrice = firstEditionPrices[j]
//                 const nextPrice = firstEditionPrices[j+1]
//                 const d = daysBetween(currPrice.createdAt, nextPrice.createdAt)
//                 const y = nextPrice.usd - currPrice.usd
//                 const m = y / d
//                 let t = 1
//                 while (t < d) {
//                     let newUsd = (nextPrice.usd + (t * m)).toFixed(2)
//                     if (newUsd <= 0) newUsd = 0.01
//                     const createdAt = new Date(currPrice.createdAt.getTime() + (t * 24 * 60 * 60 * 1000))
//                     await Price.create({
//                         printId: print.id,
//                         edition: currPrice.edition,
//                         source: currPrice.source,
//                         usd: newUsd,
//                         isManufactured: true,
//                         createdAt: createdAt 
//                     })

//                     f++
//                     t++
//                 }
//             }

//             const limitedEditionPrices = await Price.findAll({
//                 where: {
//                     printId: print.id,
//                     edition: 'Limited',
//                     source: 'TCGplayer'
//                 },
//                 order: [['createdAt', 'ASC']]
//             })

//             for (let j = 0; j < limitedEditionPrices.length - 1; j++) {
//                 const currPrice = limitedEditionPrices[j]
//                 const nextPrice = limitedEditionPrices[j+1]
//                 const d = daysBetween(currPrice.createdAt, nextPrice.createdAt)
//                 const y = nextPrice.usd - currPrice.usd
//                 const m = y / d
//                 let t = 1
//                 while (t < d) {
//                     let newUsd = (nextPrice.usd + (t * m)).toFixed(2)
//                     if (newUsd <= 0) newUsd = 0.01
//                     const createdAt = new Date(currPrice.createdAt.getTime() + (t * 24 * 60 * 60 * 1000))
//                     await Price.create({
//                         printId: print.id,
//                         edition: currPrice.edition,
//                         source: currPrice.source,
//                         usd: newUsd,
//                         isManufactured: true,
//                         createdAt: createdAt 
//                     })

//                     l++
//                     t++
//                 }
//             }

//             const unlimitedEditionPrices = await Price.findAll({
//                 where: {
//                     printId: print.id,
//                     edition: 'Unlimited',
//                     source: 'TCGplayer'
//                 },
//                 order: [['createdAt', 'ASC']]
//             })

//             for (let j = 0; j < unlimitedEditionPrices.length - 1; j++) {
//                 const currPrice = unlimitedEditionPrices[j]
//                 const nextPrice = unlimitedEditionPrices[j+1]
//                 const d = daysBetween(currPrice.createdAt, nextPrice.createdAt)
//                 const y = nextPrice.usd - currPrice.usd
//                 const m = y / d
//                 let t = 1
//                 while (t < d) {
//                     let newUsd = (nextPrice.usd + (t * m)).toFixed(2)
//                     if (newUsd <= 0) newUsd = 0.01
//                     const createdAt = new Date(currPrice.createdAt.getTime() + (t * 24 * 60 * 60 * 1000))
//                     await Price.create({
//                         printId: print.id,
//                         edition: currPrice.edition,
//                         source: currPrice.source,
//                         usd: newUsd,
//                         isManufactured: true,
//                         createdAt: createdAt 
//                     })

//                     l++
//                     t++
//                 }
//             }

//             console.log(`updated print: ${print.rarity} ${print.cardCode} - ${print.cardName}`)
//         }
//     } catch (err) {
//         console.log(err)
//         e++
//     }

//     return console.log(`created ${f} manufactured 1st edition prices, ${l} manufactured limited edition prices, ${u} manufactured unlimited edition prices, encountered ${e} errors`)
// })()


// UPDATE MIN MED MAX RARITIES
// ;(async () => {
//     const cards = await Card.findAll({order: [['name', 'ASC']]})
//     let b = 0
//     let e = 0

//     try {
//         for (let i = 0; i < cards.length; i++) {
//             const card = cards[i]
//             const prints = await Print.findAll({ where: { cardId: card.id, marketPrice: {[Op.not]: null} }, order: [['marketPrice', 'ASC']] })
//             console.log('prints.length', prints.length)
//             for (let j = 0; j < prints.length; j++) {
//                 const print = prints[j]
//                 await print.update({
//                     isMinRarity: false,
//                     isMedianRarity: false,
//                     isMaxRarity: false
//                 })
//             }
    
//             if (prints.length >= 2) {
//                 const minRarityPrint = await Print.findOne({
//                     where: {
//                         cardId: card.id,
//                         marketPrice: {[Op.not]: null}
//                     },
//                     order: [['marketPrice', 'ASC']]
//                 })
//                 console.log('!!minRarityPrint', !!minRarityPrint)
//                 await minRarityPrint.update({ isMinRarity: true })
//             }
    
//             if (prints.length >= 3) {
//                 const medianRarityPrint = prints[Math.floor(prints.length / 2)]
//                 console.log('!!medianRarityPrint', !!medianRarityPrint)
//                 await medianRarityPrint.update({ isMedianRarity: true })
//             }
    
//             if (prints.length >= 1) {
//                 const maxRarityPrint = await Print.findOne({
//                     where: {
//                         cardId: card.id, 
//                         marketPrice: {[Op.not]: null}
//                     },
//                     order: [['marketPrice', 'DESC']]
//                 })
//                 console.log('!!maxRarityPrint', !!maxRarityPrint)
//                 await maxRarityPrint.update({ isMaxRarity: true })
//             }
//             b++
//             console.log(`updated ${card.name}`)
//         }
//     } catch (err) {
//         console.log(err)
//         e++
//     }

//     return console.log(`updated ${b} max/median/min prints and encountered ${e} errors`)
// })()


// ;(async () => {
//     let b = 0
//     let e = 0

//     function formatDate(timestamp:Date) {
//         const date = new Date(timestamp);
//         const year = date.getFullYear();
//         const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
//         const day = String(date.getDate()).padStart(2, '0');
//         return `${year}-${month}-${day}`;
//     }

//     const prices = await Price.findAll({
//         where: {
//             date: null
//         },
//         order: [['id', 'ASC']]
//     })

//     for (let i = 0; i < prices.length; i++) {
//         try {
//             await prices[i].update({ date: formatDate(prices[i].createdAt) })
//             b++
//             console.log(`updated price ${i}`)
//         } catch (err) {
//             console.log(err)
//         }
//     }


//     return console.log(`added ${b} dates to prices and encountered ${e} errors`)
// })()


// ;(async () => {
//     let b = 0
//     let e = 0

//     const printCount = await Print.count()

//     for (let offset = 0; offset < printCount; offset+=10000) {
//         const prints = await Print.findAll({
//             where: {
//                 cardName: {[Op.gte]: 'Widespread Ruin'}
//             },
//             offset: offset,
//             limit: 10000,
//             order: [['cardName', 'ASC']]
//         })
    
//         for (let i = 0; i < prints.length; i++) {
//             try {
//                 let a = 0
//                 const print = prints[i]
//                 const manufacturedPrices = await Price.findAll({ where: { printId: print.id, isManufactured: true, date: {[Op.not]: null} }})
//                 for (let j = 0; j < manufacturedPrices.length; j++) {
//                     const price = manufacturedPrices[j]
//                     const count = await Price.count({ where: { printId: print.id, id: {[Op.not]: price.id}, edition: price.edition, date: price.date } })
//                     // console.log('count')
//                     if (count) {
//                         await price.destroy()
//                         // console.log('destroy')
//                         // console.log(`deleted manufactured price ${j} for ${print.cardName}`)
//                         b++
//                         a++
//                     }
//                 }
//                 console.log(`destroyed ${a} prices ${print.cardCode} ${print.cardName}`)
//             } catch (err) {
//                 console.log(err)
//                 e++
//             }
//         }
//     }

//     return console.log(`destroyed ${b} manufactured prints and encountered ${e} errors`)
// })()

// ;(async () => {
//     let b = 0

//     const tcgFormats = await Format.findAll({
//         where: {
//             category: 'TCG'
//         },
//         order: [['date', 'ASC']]
//     })

//     for (let i = 0; i < tcgFormats.length - 1; i++) {
//         const currFormat = tcgFormats[i]
//         const nextFormat = tcgFormats[i+1]

//         await currFormat.update({
//             nextFormatName: nextFormat.name,
//             nextFormatId: nextFormat.id
//         })

//         await nextFormat.update({
//             previousFormatName: currFormat.name,
//             previousFormatId: currFormat.id
//         })

//         b++
//     }
    
//     const ocgFormats = await Format.findAll({
//         where: {
//             category: 'OCG'
//         },
//         order: [['date', 'ASC']]
//     })

//     for (let i = 0; i < ocgFormats.length - 1; i++) {
//         const currFormat = ocgFormats[i]
//         const nextFormat = ocgFormats[i+1]

//         await currFormat.update({
//             nextFormatName: nextFormat.name,
//             nextFormatId: nextFormat.id
//         })

//         await nextFormat.update({
//             previousFormatName: currFormat.name,
//             previousFormatId: currFormat.id
//         })
//         b++
//     }

//     return console.log(`updated ${b} formats`)
// })()

// ;(async () => {
//     let b = 0

//     const tcgFormats = await Format.findAll({
//         where: {
//             category: 'TCG'
//         },
//         order: [['date', 'ASC']]
//     })

//     for (let i = 0; i < tcgFormats.length - 1; i++) {
//         const currFormat = tcgFormats[i]
//         const nextFormat = tcgFormats[i+1]

//         await currFormat.update({
//             nextFormatName: nextFormat.name,
//             nextFormatId: nextFormat.id
//         })

//         await nextFormat.update({
//             previousFormatName: currFormat.name,
//             previousFormatId: currFormat.id
//         })

//         b++
//     }
    
//     const ocgFormats = await Format.findAll({
//         where: {
//             category: 'OCG'
//         },
//         order: [['date', 'ASC']]
//     })

//     for (let i = 0; i < ocgFormats.length - 1; i++) {
//         const currFormat = ocgFormats[i]
//         const nextFormat = ocgFormats[i+1]

//         await currFormat.update({
//             nextFormatName: nextFormat.name,
//             nextFormatId: nextFormat.id
//         })

//         await nextFormat.update({
//             previousFormatName: currFormat.name,
//             previousFormatId: currFormat.id
//         })
//         b++
//     }

//     return console.log(`updated ${b} formats`)
// })()


// ;(async () => {
//     let b = 0
//     let e = 0

//     for (let i = 0; i < imported_prices.length; i++) {
//         try {
//             const price = imported_prices[i]
//             await Price.create({
//                 usd: price.usd,
//                 edition: price.edition,
//                 source: price.source,
//                 printId: price.printId,
//                 createdAt: price.createdAt,
//                 updatedAt: price.updatedAt,
//                 isManufactured: false
//             })
//             console.log('created price for printId', price.printId)
//             b++
            
//         } catch (err) {
//             console.log(err)
//             e++
//         }
//     }

//     return console.log(`created ${b} prices, encountered ${e} errors`)
// })()


;(async () => {
    let b = 0
    let e = 0
    const elevenCards = await Card.findAll({
        where: {
            sortPriority: 11
        }
    })

    for (let i = 0; i < elevenCards.length; i++) {
        try {
            await elevenCards[i].update({sortPriority: 16})
            console.log('updated sortPriority for', elevenCards[i].name)
            b++
            
        } catch (err) {
            console.log(err)
            e++
        }
    }

    const tenCards = await Card.findAll({
        where: {
            sortPriority: 10
        }
    })

    for (let i = 0; i < tenCards.length; i++) {
        try {
            await tenCards[i].update({sortPriority: 15})
            console.log('updated sortPriority for', tenCards[i].name)
            b++
            
        } catch (err) {
            console.log(err)
            e++
        }
    }

    const nineCards = await Card.findAll({
        where: {
            sortPriority: 9
        }
    })

    for (let i = 0; i < nineCards.length; i++) {
        try {
            await nineCards[i].update({sortPriority: 13})
            console.log('updated sortPriority for', nineCards[i].name)
            b++
            
        } catch (err) {
            console.log(err)
            e++
        }
    }

    const eightCards = await Card.findAll({
        where: {
            sortPriority: 9
        }
    })

    for (let i = 0; i < eightCards.length; i++) {
        try {
            await eightCards[i].update({sortPriority: 11})
            console.log('updated sortPriority for', eightCards[i].name)
            b++
            
        } catch (err) {
            console.log(err)
            e++
        }
    }

    const sevenCards = await Card.findAll({
        where: {
            sortPriority: 9
        }
    })

    for (let i = 0; i < sevenCards.length; i++) {
        try {
            await sevenCards[i].update({sortPriority: 9})
            console.log('updated sortPriority for', sevenCards[i].name)
            b++
            
        } catch (err) {
            console.log(err)
            e++
        }
    }

    const sixCards = await Card.findAll({
        where: {
            sortPriority: 9
        }
    })

    for (let i = 0; i < sixCards.length; i++) {
        try {
            await sixCards[i].update({sortPriority: 7})
            console.log('updated sortPriority for', sixCards[i].name)
            b++
            
        } catch (err) {
            console.log(err)
            e++
        }
    }

    const linkPends = await Card.findAll({
        where: {
            isLink: true,
            isPendulum: true
        }
    })

    for (let i = 0; i < linkPends.length; i++) {
        try {
            await linkPends[i].update({sortPriority: 14})
            console.log('updated sortPriority for', linkPends[i].name)
            b++
            
        } catch (err) {
            console.log(err)
            e++
        }
    }

    const xyzPends = await Card.findAll({
        where: {
            isXyz: true,
            isPendulum: true
        }
    })

    for (let i = 0; i < xyzPends.length; i++) {
        try {
            await xyzPends[i].update({sortPriority: 12})
            console.log('updated sortPriority for', xyzPends[i].name)
            b++
            
        } catch (err) {
            console.log(err)
            e++
        }
    }

    const synchroPends = await Card.findAll({
        where: {
            isSynchro: true,
            isPendulum: true
        }
    })

    for (let i = 0; i < synchroPends.length; i++) {
        try {
            await synchroPends[i].update({sortPriority: 10})
            console.log('updated sortPriority for', synchroPends[i].name)
            b++
            
        } catch (err) {
            console.log(err)
            e++
        }
    }


    const fusionPends = await Card.findAll({
        where: {
            isFusion: true,
            isPendulum: true
        }
    })

    for (let i = 0; i < fusionPends.length; i++) {
        try {
            await fusionPends[i].update({sortPriority: 8})
            console.log('updated sortPriority for', fusionPends[i].name)
            b++
            
        } catch (err) {
            console.log(err)
            e++
        }
    }

    const ritualPends = await Card.findAll({
        where: {
            isRitual: true,
            isPendulum: true
        }
    })

    for (let i = 0; i < ritualPends.length; i++) {
        try {
            await ritualPends[i].update({sortPriority: 6})
            console.log('updated sortPriority for', ritualPends[i].name)
            b++
            
        } catch (err) {
            console.log(err)
            e++
        }
    }

    return console.log(`updated ${b} sortPriorities, encountered ${e} errors`)
})()