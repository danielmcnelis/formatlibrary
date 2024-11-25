import { Deck, Format, Match, Pairing, Player, Pool } from '@fl/models'
import { Op } from 'sequelize'

// GET ACTIVE PAIRINGS
export const getActivePairings = async (req, res, next) => {
    try {
        const now = new Date()
        const twoHoursAgo = new Date(now.getDate() - (60 * 60 * 1000))
        const pairings = await Pairing.findAll({
            where: {
                status: 'active',
                createdAt: {[Op.gte]: twoHoursAgo}
            },
            include: [{ model: Player, as: 'playerA' }, { model: Player, as: 'playerB' }, Format],
            order: [['createdAt', 'DESC']]
        })

        return res.json(pairings)
      } catch (err) {
        next(err)
      }
}

// GET ACTIVE POOLS
export const getActivePools = async (req, res, next) => {
    try {
        const pools = await Pool.findAll({
            where: {
                status: {[Op.not]: 'inactive'}
            },
            include: [Player, Format],
            order: [['createdAt', 'DESC']]
        })

        return res.json(pools)
      } catch (err) {
        next(err)
      }
}

// GET RATED DECKS
export const getRatedDecks = async (req, res, next) => {
    try {
        const decks = await Deck.findAll({
            where: {
                builderId: req.user?.playerId,
                origin: 'user'
            },
            attributes: ['id', 'name', 'ydk', 'builderId', 'formatId', 'updatedAt'],
            include: Format,
            order: [['updatedAt', 'DESC']]
        })
    
        res.json(decks)
    } catch (err) {
        next(err)
    }
}