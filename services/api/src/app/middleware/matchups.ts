
import { Matchup } from '@fl/models'
import { Op } from 'sequelize'

export const getMatchupH2H = async (req, res, next) => {
  try {
    const wins = await Matchup.count({
        where: {
            winningDeckType: {[Op.iLike]: req.params.name},
            losingDeckType: {[Op.iLike]: req.query.versus},
            formatName: {[Op.iLike]: req.query.formatName}
        }
    })

    const losses = await Matchup.count({
        where: {
            winningDeckType: {[Op.iLike]: req.query.versus},
            losingDeckType: {[Op.iLike]: req.params.name},
            formatName: {[Op.iLike]: req.query.formatName}
        }
    })

    const percentage = (wins / (wins + losses)).toFixed(3) * 100

    const data = { wins, losses, percentage }
    res.json(data)
  } catch (err) {
    next(err)
  }
}
