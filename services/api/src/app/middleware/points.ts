import { Card } from '@fl/models'
import { Op } from 'sequelize'

// GET PRICES
export const getPoints = async (req, res, next) => {
    try {
        const cards = await Card.findAll({
            where: {
                genesysPoints: {[Op.gt]: 0}
            },
            attributes: ['id', 'name', 'artworkId', 'cleanName', 'genesysPoints', 'sortPriority'],
            order: [['sortPriority', 'ASC'], ['points', 'ASC']]
        })

        return res.json(cards)
    } catch (err) {
        next(err)
    }
}