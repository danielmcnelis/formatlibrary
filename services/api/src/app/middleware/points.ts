import { Card } from '@fl/models'
import { Op } from 'sequelize'

// GET PRICES
export const getPoints = async (req, res, next) => {
    console.log('getPoints()')
    try {
        const points = await Card.findAll({
            where: {
                genesysPoints: {[Op.gt]: 0}
            },
            attributes: ['id', 'name', 'cleanName', 'genesysPoints']
        })
        console.log('points.length', points.length)

        return res.json(points)
    } catch (err) {
        next(err)
    }
}