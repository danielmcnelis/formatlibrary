import { Card } from '@fl/models'
import { Op } from 'sequelize'

// GET PRICES
export const getPoints = async (req, res, next) => {
    try {
        const points = await Card.findAll({
            where: {
                genesysPoints: {[Op.not]: null}
            },
            attributes: ['id', 'cardName', 'genesysPoints']
        })

        return res.json(points)
    } catch (err) {
        next(err)
    }
}