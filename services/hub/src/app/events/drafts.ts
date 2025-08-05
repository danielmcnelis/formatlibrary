
import { Card, Cube, Draft, DraftEntry, Inventory, PackContent, Player, Set } from '@fl/models'
import axios from 'axios'
import { config } from '@fl/config'

//GET RANDOM ELEMENT
const getRandomElement = (arr) => {
    const index = Math.floor((arr.length) * Math.random())
    return arr[index]
}

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

// SET INTERNAL TIMER
const setInternalTimer = async (draftId, round, pick, timer = 60, socket) => {
    setTimeout(async () => {
        const draft = await Draft.findOne({
            where: {
                id: draftId,
                round: round,
                pick: pick
            }
        })
        
        if (draft) {
            const entries = await DraftEntry.findAll({
                where: {
                    draftId: draftId
                }
            })
            
            const { packsPerPlayer, packSize, playerCount} = draft
            const arr = []
            const nums = Array.from(Array(packsPerPlayer * playerCount).keys()).map((e) => e + 1)
            for (let i = 0; i < packsPerPlayer; i++) { arr[i] = [...nums.slice(i * playerCount, i * playerCount + playerCount)] }
            
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                const count = await Inventory.count({ 
                    where: {
                        draftEntryId: entry.id,
                        round: round,
                        pick: pick
                    }
                })
            
                if (!count) {
                    const packNumber = arr[round - 1][(pick + entry.slot - 2) % playerCount]
                    const contents = await PackContent.findAll({
                        where: {
                            packNumber: packNumber,
                            draftId: draftId,
                        }
                    })
            
                    const packContent = getRandomElement(contents)

                    const count2 = await Inventory.count({ 
                        where: {
                            draftEntryId: entry.id,
                            round: round,
                            pick: pick
                        }
                    })
            
                    if (!count2) {
                        await Inventory.create({
                            cardId: packContent.cardId,
                            cardName: packContent.cardName,
                            draftId: draftId,
                            draftEntryId: entry.id,
                            round: round,
                            pick: pick,
                            compositeKey: `${entry.id}${pick}`
                        })
    
                        await packContent.destroy()
                    }
                }
            }

            const count = await Draft.count({
                where: {
                    id: draftId,
                    round: round,
                    pick: pick
                }
            })

            // If the draft is still on the current pick (n.b. timer has expired):
            if (count) {
                // And this is the final pick of the final round:
                if (pick === (packsPerPlayer * packSize)) {
                    await draft.update({ state: 'complete' })

                    socket.emit('draft complete', draft)
                    socket.broadcast.emit('draft complete', draft)
                // Or this is the final pick of the current round:
                } else if (pick === (round * packSize)) {
                    await draft.update({
                        round: round + 1,
                        pick: pick + 1
                    })
    
                    socket.emit('next pick', draft)
                    socket.broadcast.emit('next pick', draft)
                    return setInternalTimer(draft.id, round + 1, pick + 1, draft.timer, socket)
                // Or this round should continue with the next pick:
                } else {
                    await draft.update({
                        pick: draft.pick + 1
                    })
                    
                    socket.emit('next pick', draft)
                    socket.broadcast.emit('next pick', draft)
                    return setInternalTimer(draft.id, round, pick + 1, draft.timer, socket)
                }
            }
        }
    }, (timer + 3) * 1000)
}

// JOIN DRAFT
export const joinDraft = async (playerId, draftId, socket, setEntry) => {
    console.log('playerId', playerId)
    console.log('draftId', draftId)
    console.log('socket', socket)
    console.log('setEntry', setEntry)
    try {
        const count = await DraftEntry.count({
            where: {
                draftId: draftId,
                playerId: playerId
            }    
        })

        if (!count) {
            const player = await Player.findOne({
                where: {
                    id: playerId
                }
            })

            const entry = await DraftEntry.create({
                draftId: draftId,
                playerName: player.name,
                playerId: player.id
            })
    
            const data = {
                ...entry.dataValues,
                player
            }
    
            socket.emit('new entry', data)
            socket.broadcast.emit('new entry', data)
            setEntry(entry)
        } else {
            throw new Error('Player has already joined this draft.')
        }
    } catch (err) {
      console.log(err)
    }
}

// LEAVE DRAFT
export const leaveDraft = async (playerId, draftId, socket, setEntry) => {
    try {
        const entry = await DraftEntry.findOne({
            where: {
                draftId: draftId,
                playerId: playerId
            }
        })
        
        if (entry) {
            const data = {
                ...entry.dataValues
            }
    
            await entry.destroy()

            socket.emit('removed entry', data)
            socket.broadcast.emit('removed entry', data)
            setEntry({})
        } else {
            throw new Error('Player is not in this draft.')
        }
    } catch (err) {
      console.log(err)
    }
}

// START DRAFT
export const startDraft = async (draftId, socket) => {
    try {
        const draft = await Draft.findOne({
            where: {
                id: draftId,
                state: 'pending'
            },
            include: [Cube]
        })

        const set = draft.setId ? await Set.findOne({
            where: {
                id: draft.setId
            }
        }) : {}

        const playerCount = await DraftEntry.count({
            where: {
                draftId: draft.id
            }
        })

        const entries = await DraftEntry.findAll({ where: { draftId: draft.id }})
        const shuffledEntries = shuffleArray(entries)

        for (let i = 0; i < shuffledEntries.length; i++) {
            const entry = shuffledEntries[i]
            await entry.update({ slot: i + 1 })
        }

        if (draft.type === 'cube') {
            const konamiCodes = draft.cube.ydk.split('#main')[1].split(/[\s]+/).filter((e) => e.length) || []
            const cards = []
            
            for (let i = 0; i < konamiCodes.length; i++) {
                let konamiCode = konamiCodes[i]
                while (konamiCode.length < 8) konamiCode = '0' + konamiCode
                const card = await Card.findOne({ where: { konamiCode: konamiCode }})
                if (!card) continue
                cards.push(card)
            }
    
            const shuffledCards = shuffleArray(cards)
            let index = 0

            const count = await PackContent.count({
                where: {
                    draftId: draftId
                }
            })
    
            if (count) return

            for (let i = 0; i < playerCount; i++) {
                for (let j = 0; j < draft.packsPerPlayer; j++) {
                    for (let k = 0; k < draft.packSize; k++) {
                        const card = shuffledCards[index]
                        await PackContent.create({
                            cardId: card.id,
                            cardName: card.name,
                            packNumber: i * draft.packsPerPlayer + j + 1,
                            draftId: draft.id
                        })
    
                        index++
                    }
                }
            }
        } else {
            const {data: packs} = await axios.get(`${config.siteUrl}/api/sets/open-packs/${set.setCode}?count=${playerCount * draft.packsPerPlayer}`)

            const count = await PackContent.count({
                where: {
                    draftId: draftId
                }
            })
    
            if (count) return
            
            for (let i = 0; i < packs.length; i++) {
                const pack = packs[i]
                for (let j = 0; j < draft.packSize; j++) {
                    await PackContent.create({
                        cardId: pack[j].card.id,
                        cardName: pack[j].card.name,
                        packNumber: i + 1,
                        draftId: draft.id
                    })
                }
            }
        }

        await draft.update({ playerCount: playerCount, round: 1, pick: 1, state: 'underway' })
        socket.emit('draft begins', draft)
        socket.broadcast.emit('draft begins', draft)
        return setInternalTimer(draft.id, 1, 1, draft.timer, socket)
    } catch (err) {
      console.log(err)
    }
  }


// SELECT CARD
export const selectCard = async (cardId, playerId, draftId, round, pick, socket, handleSelection) => {
    try {
        const entry = await DraftEntry.findOne({
            where: {
                draftId: draftId,
                playerId: playerId
            },
            include: Draft
        })

        const draft = entry.draft
        if (round !== draft.round || pick !== draft.pick) return console.log(`round or pick does not match updated draft`)
        const { packsPerPlayer, packSize, playerCount } = draft

        const arr = []
        const nums = Array.from(Array(packsPerPlayer * playerCount).keys()).map((e) => e + 1)
        for (let i = 0; i < packsPerPlayer; i++) { arr[i] = [...nums.slice(i * playerCount, i * playerCount + playerCount)] }
        const packNumber = arr[round - 1][(pick + entry.slot - 2) % playerCount]

        const packContent = await PackContent.findOne({
            where: {
                draftId: draftId,
                cardId: cardId,
                packNumber: packNumber
            },
            include: Card
        })

        if (!packContent) return console.log(`No pack content found.`)

        const card = packContent.card

        const pickHasBeenMade = await Inventory.count({
            where: {
                draftEntryId: entry.id,
                round: round,
                pick: pick
            }
        })

        const count = await Inventory.count({
            where: {
                draftEntryId: entry.id
            }
        })

        const n = round * draft.packSize + pick % draft.packSize

        // If this player has not made their pick yet:
        if (!pickHasBeenMade && count < n) {
            const inventory = await Inventory.create({
                draftId: draftId,
                draftEntryId: entry.id,
                cardId: cardId,
                cardName: card.name,
                round: round,
                pick: pick,
                compositeKey: `${entry.id}${pick}`
            })
    
            if (inventory) {
                const data = {
                    ...inventory.dataValues,
                    card
                }
                
                handleSelection(data)
                await packContent.destroy()
    
                const cardsPulled = await Inventory.count({
                    where: {
                        draftId: draftId,
                        round: round,
                        pick: pick
                    }
                })
    
                // If all players have made their picks:
                if (cardsPulled === playerCount) {
                    // And this is the final pick of the final round:
                    if (pick === (packsPerPlayer * packSize)) {
                        await draft.update({ state: 'complete' })

                        socket.emit('draft complete', draft)
                        socket.broadcast.emit('draft complete', draft)
                    // Or this is the final pick of the current round:
                    } else if (pick === (round * packSize)) {
                        await draft.update({
                            round: round + 1,
                            pick: pick + 1
                        })
    
                        socket.emit('next pick', draft)
                        socket.broadcast.emit('next pick', draft)
                        return setInternalTimer(draft.id, round + 1, pick + 1, draft.timer, socket)
                    // Or this round should continue with the next pick:
                    } else {
                        await draft.update({
                            pick: draft.pick + 1
                        })
    
                        socket.emit('next pick', draft)
                        socket.broadcast.emit('next pick', draft)
                        return setInternalTimer(draft.id, round, pick + 1, draft.timer, socket)
                    }
                }
            }    
        }
    } catch (err) {
      console.log(err)
    }
  }