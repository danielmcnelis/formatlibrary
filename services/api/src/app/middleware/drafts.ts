import { Card, Cube, CubeDraft, CubeDraftEntry, CubePackContent, Player } from '@fl/models'

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

        const { draftId, playerId } = req.query
        const { slot } = await CubeDraftEntry.findOne({
            where: {
                playerId: playerId,
                cubeDraftId: draftId
            }
        })

        const { round, pick, packsPerPlayer, playerCount} = await CubeDraft.findOne({
            where: {
                id: draftId
            }
        })

        const arr = []
        const nums = Array.from(Array(packsPerPlayer * playerCount).keys()).map((e) => e + 1)
        for (let i = 0; i < packsPerPlayer; i++) { arr[i] = [...nums.slice(i * playerCount, i * playerCount + playerCount)] }
        const packNumber = arr[round - 1][(pick + slot - 2) % playerCount]
        console.log('round, pick, slot, playerCount', round, pick, slot, playerCount)
        console.log('round - 1', round - 1)
        console.log('pick + slot - 2', pick + slot - 2)
        console.log('(pick + slot - 2) % playerCount', (pick + slot - 2) % playerCount)
        console.log('arr', arr)
        console.log('packNumber', packNumber)

        const contents = await CubePackContent.findAll({
            where: {
                packNumber: packNumber,
                cubeDraftId: req.query.draftId,
            },
            include: Card,
            order: [[Card, 'sortPriority', 'ASC'], [Card, 'name', 'ASC']]
        })

        const data = {
            contents: contents, 
            packNumber: packNumber
        }

        res.json(data)
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

        if (entry) {
            res.sendStatus(200)
        } else {
            res.sendStatus(400)
        }
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

        await draft.update({ playerCount })
    
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
    } catch (err) {
      next(err)
    }
  }
