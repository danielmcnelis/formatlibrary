
import { Card, Cube, Draft, DraftEntry, Inventory, PackContent, Player, Set } from '@fl/models'

// GET DRAFT
export const getDraft = async (req, res, next) => {
    try {
        const draft = await Draft.findOne({
            where: {
                shareLink: req.params.id
            },
            include: [Cube, Set]
        })

        res.json(draft)
    } catch (err) {
      next(err)
    }
}

// GET PACK
export const getPack = async (req, res, next) => {
    try {
        const entry = await DraftEntry.findOne({
            where: {
                id: req.query.entryId
            }
        })

        const { round, pick, packsPerPlayer, playerCount} = await Draft.findOne({
            where: {
                id: entry.draftId
            }
        })

        const arr = []
        const nums = Array.from(Array(packsPerPlayer * playerCount).keys()).map((e) => e + 1)
        for (let i = 0; i < packsPerPlayer; i++) { arr[i] = [...nums.slice(i * playerCount, i * playerCount + playerCount)] }
        
        const packNumber = arr[round - 1][(pick + entry.slot - 2) % playerCount]

        const contents = await PackContent.findAll({
            where: {
                packNumber: packNumber,
                draftId: entry.draftId,
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
        const inventory = await Inventory.findAll({
            where: {
                draftEntryId: req.query.entryId
            },
            order: [["createdAt", "ASC"]],
            include: Card
        })

        res.json(inventory)
    } catch (err) {
      next(err)
    }
}

// DOWNLOAD INVENTORY
export const downloadInventory = async (req, res, next) => {
    try {
        const inventoryCodes = [...await Inventory.findAll({
            where: {
                draftEntryId: req.query.entryId
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
export const getParticipants = async (req, res, next) => {
    try {
        const participants = await DraftEntry.findAll({
            where: {
                draftId: req.params.id
            },
            include: Player,
            order: [['createdAt', 'ASC']]
        })

        res.json(participants)
    } catch (err) {
      next(err)
    }
  }

  // LAUNCH DRAFT
  export const launchDraft = async (req, res, next) => {
    try {  
      const cube = req.body.type === 'cube' ? await Cube.findOne({
        where: {
            id: req.body.cubeId
        }
      }) : {}

      const cubeName = cube?.id ? `${cube.name} by ${cube.builderName}` : null

      const set = req.body.type === 'booster' ? await Set.findOne({
        where: {
            id: req.body.boosterId
        }
      }) : {}

      const player = await Player.findOne({
        where: {
            id: req.body.hostId
        }
      })

      const shareLink = await Draft.generateShareLink()

      const draft = await Draft.create({
        type: req.body.type,
        cubeId: cube?.id,
        cubeName: cubeName,
        setName: set?.name,
        setId: set?.id,
        hostName: player.name,
        hostId: player.id,
        packSize: req.body.packSize,
        packsPerPlayer: req.body.packsPerPlayer,
        timer: req.body.timer,
        shareLink: shareLink
      })

      res.json(`https://formatlibrary.com/drafts/${draft.shareLink}`)
    } catch (err) {
      next(err)
    }
  }