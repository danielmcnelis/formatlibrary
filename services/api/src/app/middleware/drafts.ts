import { Card, Cube, CubeDraft, CubeDraftEntry, CubeDraftInventory, CubePackContent, Player } from '@fl/models'

//GET RANDOM ELEMENT
const getRandomElement = (arr) => {
    const index = Math.floor((arr.length) * Math.random())
    return arr[index]
}

const setInternalTimer = async (draftId, currentPick, timer = 60) => {
    setTimeout(async () => {
        const draft = await CubeDraft.findOne({
            where: {
                id: draftId
            }
        })

        console.log('draft.pick', draft.pick)
        console.log('currentPick', currentPick)
        console.log('draft.pick === currentPick', draft.pick === currentPick)
        if (draft.pick === currentPick) {
            const entries = await CubeDraftEntry.findAll({
                where: {
                    cubeDraftId: draftId
                }
            })
            console.log('draftId', draftId)
            console.log('entries.length', entries.length)
            const nextPick = draft.pick + 1
            const { round, pick, packsPerPlayer, playerCount} = draft
            console.log('round, pick, packsPerPlayer, playerCount', round, pick, packsPerPlayer, playerCount)
            const arr = []
            const nums = Array.from(Array(packsPerPlayer * playerCount).keys()).map((e) => e + 1)
            for (let i = 0; i < packsPerPlayer; i++) { arr[i] = [...nums.slice(i * playerCount, i * playerCount + playerCount)] }
            console.log('nums', nums)
            console.log('arr', arr)
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                console.log('entry.playerName', entry.playerName)
                const count = await CubeDraftInventory.count({ 
                    where: {
                        cubeDraftEntryId: entry.id
                    }
                })
                console.log('count', count)
                console.log('count < currentPick', count < currentPick)

                if (count < currentPick) {
                    const packNumber = arr[round - 1][(pick + entry.slot - 2) % playerCount]
                    console.log('packNumber', packNumber)
                    const contents = await CubePackContent.findAll({
                        where: {
                            packNumber: packNumber,
                            cubeDraftId: entry.cubeDraftId,
                        },
                        include: Card,
                        order: [[Card, 'sortPriority', 'ASC'], [Card, 'name', 'ASC']]
                    })
                    console.log('contents.length', contents.length)
                    const packContent = getRandomElement(contents)

                    const count2 = await CubeDraftInventory.count({ 
                        where: {
                            cubeDraftEntryId: entry.id
                        }
                    })
                    console.log('count2', count2)
                    console.log('count2 < currentPick', count2 < currentPick)

                    if (count2 < currentPick) {
                        await CubeDraftInventory.create({
                            cardId: packContent.cardId,
                            cardName: packContent.cardName,
                            cubeDraftId: draftId,
                            cubeDraftEntryId: entry.id
                        })
    
                        await packContent.destroy()
                    }
                }
            }

            if (nextPick > draft.packsPerPlayer * draft.packSize) {
                console.log('COMPLETE')
                await draft.update({ state: 'complete' })
            } else if (nextPick % draft.packSize === 1) {
                console.log('draft.update -> next round')
                await draft.update({
                    pick: nextPick,
                    round: draft.round + 1
                })

                return setInternalTimer(draft.id, nextPick, draft.timer)
            } else {
                console.log('draft.update -> next pick')
                await draft.update({
                    pick: draft.pick + 1
                })
                
                return setInternalTimer(draft.id, nextPick, draft.timer)
            }
        }
    }, (timer + 2) * 1000)

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

// DRAFTS ID
export const draftsId = async (req, res, next) => {
    try {
        const draft = await CubeDraft.findOne({
            where: {
                shareLink: req.params.id
            },
            include: Cube
        })

        res.json(draft)
    } catch (err) {
      next(err)
    }
  }


// GET PACK
export const getPack = async (req, res, next) => {
    try {
        const entry = await CubeDraftEntry.findOne({
            where: {
                id: req.query.entryId
            }
        })

        const { round, pick, packsPerPlayer, playerCount} = await CubeDraft.findOne({
            where: {
                id: entry.cubeDraftId
            }
        })

        const arr = []
        const nums = Array.from(Array(packsPerPlayer * playerCount).keys()).map((e) => e + 1)
        for (let i = 0; i < packsPerPlayer; i++) { arr[i] = [...nums.slice(i * playerCount, i * playerCount + playerCount)] }
        
        const packNumber = arr[round - 1][(pick + entry.slot - 2) % playerCount]

        const contents = await CubePackContent.findAll({
            where: {
                packNumber: packNumber,
                cubeDraftId: entry.cubeDraftId,
            },
            include: Card,
            order: [[Card, 'sortPriority', 'ASC'], [Card, 'name', 'ASC']]
        })

        res.json(contents)
    } catch (err) {
      next(err)
    }
  }

// GET INVENTORY
export const getInventory = async (req, res, next) => {
    try {
        const inventory = [...await CubeDraftInventory.findAll({
            where: {
                cubeDraftEntryId: req.query.entryId
            },
            order: [["createdAt", "ASC"]],
            include: Card
        })].map((c) => c.card)

        res.json(inventory)
    } catch (err) {
      next(err)
    }
  }

// DOWNLOAD INVENTORY
export const downloadInventory = async (req, res, next) => {
    try {
        const inventoryCodes = [...await CubeDraftInventory.findAll({
            where: {
                cubeDraftEntryId: req.query.entryId
            },
            order: [["createdAt", "ASC"]],
            include: Card
        })].map((c) => c.card?.konamiCode)

        const ydk = 'created by...\n#main\n' + inventoryCodes.join('\n') + '\n#extra\n!side\n'
        res.send(ydk)
    } catch (err) {
      next(err)
    }
  }

// GET DRAFT PARTICIPANTS
export const getDraftParticipants = async (req, res, next) => {
    try {
        const participants = await CubeDraftEntry.findAll({
            where: {
                cubeDraftId: req.params.id
            },
            include: Player
        })

        res.json(participants)
    } catch (err) {
      next(err)
    }
  }

// SELECT CARD
export const selectCard = async (req, res, next) => {
    try {
        const draft = await CubeDraft.findOne({
            where: {
                id: req.params.id
            }
        })
        
        const entry = await CubeDraftEntry.findOne({
            where: {
                cubeDraftId: req.params.id,
                playerId: req.body.playerId
            }
        })

        const packContent = await CubePackContent.findOne({
            where: {
                cubeDraftId: req.params.id,
                cardId: req.query.cardId
            }
        })

        const card = await Card.findOne({
            where: {
                id: req.query.cardId
            }
        })

        const count = await CubeDraftInventory.count({
            where: {
                cubeDraftEntryId: entry.id
            }
        })

        if (count < draft.pick) {
            const inventory = await CubeDraftInventory.create({
                cubeDraftId: req.params.id,
                cubeDraftEntryId: entry.id,
                cardId: packContent.cardId,
                cardName: packContent.cardName
            })
    
            if (inventory) {
                await packContent.destroy()
                res.json(card)
    
                const cardsPulled = await CubeDraftInventory.count({
                    where: {
                        cubeDraftId: req.params.id
                    }
                })
    
                if (cardsPulled === (draft.playerCount * draft.pick)) {
                    const nextPick = draft.pick + 1
                    if (nextPick > draft.packsPerPlayer * draft.packSize) {
                        await draft.update({ state: 'complete' })
                    } else if (nextPick > (draft.round * draft.packSize)) {
                        await draft.update({
                            pick: nextPick,
                            round: draft.round + 1
                        })
    
                        return setInternalTimer(draft.id, nextPick, draft.timer)
                    } else {
                        await draft.update({
                            pick: nextPick
                        })
    
                        return setInternalTimer(draft.id, nextPick, draft.timer)
                    }
                }
            }    
        } else {
            res.sendStatus(400)
        }
    } catch (err) {
      next(err)
    }
  }

// JOIN DRAFT
export const joinDraft = async (req, res, next) => {
    try {
        const player = await Player.findOne({
            where: {
                id: req.body.playerId
            }
        })

        const entry = await CubeDraftEntry.create({
            cubeDraftId: req.params.id,
            playerName: player.name,
            playerId: player.id
        })

        const data = {
            ...entry.dataValues,
            player
        }

        res.json(data)
    } catch (err) {
      next(err)
    }
  }


// LEAVE DRAFT
export const leaveDraft = async (req, res, next) => {
    try {
        const entry = await CubeDraftEntry.findOne({
            where: {
                cubeDraftId: req.params.id,
                playerId: req.body.playerId
            }
        })

        await entry.destroy()
        res.sendStatus(200)
    } catch (err) {
      next(err)
    }
  }

  

// START DRAFTS
export const startDraft = async (req, res, next) => {
    try {
        const draft = await CubeDraft.findOne({
            where: {
                id: req.params.id,
                state: 'pending'
            },
            include: Cube
        })

        const playerCount = await CubeDraftEntry.count({
            where: {
                cubeDraftId: draft.id
            }
        })

        await draft.update({ playerCount, pick: 1, round: 1 })

        const entries = await CubeDraftEntry.findAll({ where: { cubeDraftId: draft.id }})
        const shuffledEntries = shuffleArray(entries)

        for (let i = 0; i < shuffledEntries.length; i++) {
            const entry = shuffledEntries[i]
            await entry.update({ slot: i + 1 })
        }
    
        if (!draft.cube) return res.sendStatus(404)
        const konamiCodes = draft.cube.ydk.split('#main')[1].split('\n').filter((e) => e.length) || []
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

        for (let i = 0; i < playerCount; i++) {
            for (let j = 0; j < draft.packsPerPlayer; j++) {
                for (let k = 0; k < draft.packSize; k++) {
                    const card = shuffledCards[index]
                    await CubePackContent.create({
                        cardId: card.id,
                        cardName: card.name,
                        packNumber: i * draft.packsPerPlayer + j + 1,
                        cubeDraftId: draft.id
                    })

                    index++
                }
            }
        }

        await draft.update({ state: 'underway' })
        res.json(draft)
        return setInternalTimer(draft.id, draft.pick, draft.timer)
    } catch (err) {
      next(err)
    }
  }
