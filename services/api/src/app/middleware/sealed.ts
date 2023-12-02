
import { Card, Cube, Draft, DraftEntry, Inventory, PackContent, Player, Set } from '@fl/models'

// LAUNCH SEALED
export const launchSealed = async (req, res, next) => {
    try {  
        const packIds = req.body.packIds
        const packQuants = req.body.packQuants
        const sealedStructure = {}

        for (let i = 0; i < packIds.length; i++) {
            sealedStructure[packIds[i]] = packQuants[i]
        }

        const player = await Player.findOne({
          where: {
              id: req.body.hostId
          }
        })
  
        const shareLink = await Draft.generateShareLink()
  
        const draft = await Draft.create({
          type: 'sealed',
          sealedStructure: JSON.stringify(sealedStructure),
          hostName: player.name,
          hostId: player.id,
          shareLink: shareLink
        })
  
        res.json(`https://formatlibrary.com/sealed/${draft.shareLink}`)
      } catch (err) {
        next(err)
      }
}


// GET SEALED PACKS
export const getSealedPacks = async (req, res, next) => {
    try {
        const entry = await DraftEntry.findOne({
            where: {
                id: req.query.entryId
            },
            include: Draft
        })

        const sealedStructure = JSON.parse(entry.draft.sealedStructure)
        const instructions = Object.entries(sealedStructure)
        const packs = []

        for (let i = 0; i < instructions.length; i++) {
            const instruction:Array<any> = instructions[i]
            const [setId, packsPerPlayer] = instruction
            console.log('setId', setId, 'packsPerPlayer', packsPerPlayer)              
            const packNumbers = Array.from(Array(packsPerPlayer).keys()).map((e) => e + 1 + (packsPerPlayer * (entry.slot - 1)))
            console.log('packNumbers sealed.ts ln55', packNumbers)

            for (let j = 0; j < packNumbers.length; j++) {
                const packNumber = packNumbers[j]
                const contents = await PackContent.findAll({
                    where: {
                        packNumber: packNumber,
                        setId: setId,
                        draftId: entry.draftId,
                    },
                    include: Card,
                    order: [['id', 'ASC']]
                })

                packs.push(contents)
            }
        }

        res.json(packs)
    } catch (err) {
      next(err)
    }
}
