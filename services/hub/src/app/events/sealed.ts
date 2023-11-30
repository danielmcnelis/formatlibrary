
import { Card, Cube, Draft, DraftEntry, Inventory, PackContent, Player, Set } from '@fl/models'
import axios from 'axios'
import { config } from '@fl/config'

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

        const sealedStructure = JSON.parse(draft.sealedStructure)
        const instructions = Object.entries(sealedStructure)

        for (let i = 0; i < instructions.length; i++) {
            const [setId, packsPerPlayer] = instructions[i]
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
                        packNumber: i + 1,
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
