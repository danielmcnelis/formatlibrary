
import { Card, Cube, Draft, DraftEntry, Inventory, PackContent, Player, Set } from '@fl/models'
import axios from 'axios'
import { config } from '@fl/config'

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

// START DRAFT
export const startSealed = async (draftId, socket) => {
    try {
        const draft = await Draft.findOne({
            where: {
                id: draftId,
                state: 'pending'
            }
        })

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

        const sealedStructure = JSON.parse(draft.sealedStructure)
        const instructions:Array<any> = Object.entries(sealedStructure)

        for (let i = 0; i < instructions.length; i++) {
            const [setId, packsPerPlayer]:[number, number] =  instructions[i]
            console.log('setId', setId)
            console.log('packsPerPlayer', packsPerPlayer)
            const set = await Set.findOne({
                where: {
                    id: setId
                }
            })

            const {data: packs} = await axios.get(`${config.siteUrl}/api/sets/open-packs/${set.setCode}?count=${packsPerPlayer * playerCount}`)

            for (let j = 0; j < packs.length; j++) {
                const pack = packs[j]
                for (let k = 0; k < pack.length; k++) {
                    await PackContent.create({
                        cardId: pack[k].card.id,
                        cardName: pack[k].card.name,
                        packNumber: j + 1,
                        draftId: draft.id,
                        rarity: pack[k].rarity,
                        setId: setId
                    })
                }
            }
        }

        await draft.update({ playerCount: playerCount, round: 1, pick: 1, state: 'underway' })
        socket.emit('sealed begins', draft)
        return socket.broadcast.emit('sealed begins', draft)
    } catch (err) {
      console.log(err)
    }
  }
