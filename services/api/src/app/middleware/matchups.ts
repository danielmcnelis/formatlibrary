
import { Matchup } from '@fl/models'
import { Op } from 'sequelize'

export const getMatchupH2H = async (req, res, next) => {
  try {
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

    const total = wins + losses
    const data = { wins, losses, total }
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const getMatchupMatrix = async (req, res, next) => {
    try {
      const wins = await Matchup.findAll({
          where: {
              winningDeckType: {[Op.iLike]: req.params.id},
              formatName: {[Op.iLike]: req.query.format}
          }
      })
  
      const losses = await Matchup.findAll({
          where: {
              losingDeckType: {[Op.iLike]: req.params.id},
              formatName: {[Op.iLike]: req.query.format}
          }
      })

      const matrix = {}

      wins.forEach((matchup) => {
        if (!matrix[matchup.losingDeckType]) {
            matrix[matchup.losingDeckType] = {
                wins: 1,
                losses: 0,
                total: 1
            }
        } else {
            matrix[matchup.losingDeckType].wins++
            matrix[matchup.losingDeckType].total++
        }
      })

      losses.forEach((matchup) => {
        if (!matrix[matchup.winningDeckType]) {
            matrix[matchup.winningDeckType] = {
                wins: 0,
                losses: 1,
                total: 1
            }
        } else {
            matrix[matchup.winningDeckType].losses++
            matrix[matchup.winningDeckType].total++
        }
      })
  
      res.json(matrix)
    } catch (err) {
      next(err)
    }
  }
  