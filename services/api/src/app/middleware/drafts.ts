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
        console.log('req.params.id', req.params.id)
        const draft = await CubeDraft.findOne({
            where: {
                shareLink: req.params.id
            },
            include: Cube
        })

        const participants = await CubeDraftEntry.findAll({
            where: {
                cubeDraftId: draft.id
            },
            include: Player
        })

        const packs = await CubePackContent.findAll({
            where: {
                cubeDraftId: draft.id
            }
        })

        const data = {
            draft: draft,
            participants: participants,
            packs: packs,
            pick: draft.pick,
            round: draft.round
        }

        res.json(data)
    } catch (err) {
      next(err)
    }
  }


// JOIN DRAFT
export const joinDraft = async (req, res, next) => {
    try {
        console.log('joinDraft()')
        console.log('req.body.playerId', req.body.playerId)
        const player = await Player.findOne({
            where: {
                id: req.body.playerId
            }
        })

        console.log('!!player', !!player)
        console.log('req.params.id', req.params.id)
        console.log('player.name', player.name)
        console.log('player.id', player.id)
        const entry = await CubeDraftEntry.create({
            cubeDraftId: req.params.id,
            playerName: player.name,
            playerId: player.id
        })
        
        console.log('!!entry', !!entry)

        if (entry) {
            res.sendStatus(200)
        } else {
            res.sendStatus(400)
        }
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

        for (let i = 0; i < playerCount; i++) {
            for (let j = 1; j <= draft.packsPerPlayer; j++) {
                for (let k = 1; k <= draft.packSize; k++) {
                    const index = (i * j * draft.packSize) + k
                    console.log('index', index)
                    const card = shuffledCards[index]
                    await CubePackContent.create({
                        cardId: card.id,
                        packNumber: i * j,
                        cubeDraftId: draft.id
                    })
                }
            }
        }

        res.json(draft)
    } catch (err) {
      next(err)
    }
  }
