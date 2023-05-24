
import { Matchup } from '@fl/models'
import { Op } from 'sequelize'

export const getMatchupH2H = async (req, res, next) => {
  try {
    console.log('req.params', req.params)
    console.log('req.query', req.query)
    console.log('req.params.id', req.params.id)
    console.log('req.query.versus', req.query.versus)
    console.log('req.query.format', req.query.format)
    const wins = await Matchup.count({
        where: {
            winningDeckType: {[Op.iLike]: req.params.id},
            losingDeckType: {[Op.iLike]: req.query.versus},
            formatName: {[Op.iLike]: req.query.format}
        }
    })

    const losses = await Matchup.count({
        where: {
            winningDeckType: {[Op.iLike]: req.query.versus},
            losingDeckType: {[Op.iLike]: req.params.id},
            formatName: {[Op.iLike]: req.query.format}
        }
    })

    const data = { wins, losses }
    res.json(data)
  } catch (err) {
    next(err)
  }
}
