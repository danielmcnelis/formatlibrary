
import { DeckType, Format, Matchup } from '@fl/models'
import { Op } from 'sequelize'

export const getMatchupH2H = async (req, res, next) => {
  try {
    if (req.query.isSubscriber === 'true' || req.query.isAdmin === 'true') {
        const deckType1 = await DeckType.findOne({
            where: {
                cleanName: {[Op.iLike]: req.params.id.replaceAll('-', '_')}
            }
        })

        const deckType2 = await DeckType.findOne({
            where: {
                cleanName: {[Op.iLike]: req.query.versus.replaceAll('-', '_')}
            }
        })

        const format = await Format.findOne({
            where: {
                cleanName: {[Op.iLike]: req.query.format?.replaceAll('-', '_')}
            }
        })

        const wins = await Matchup.count({
            where: {
                winningDeckTypeId: deckType1.id,
                losingDeckTypeId: deckType2.id,
                formatId: format?.id
            }
        })
    
        const losses = await Matchup.count({
            where: {
                winningDeckTypeId: deckType2.id,
                losingDeckTypeId: deckType1.id,
                formatId: format?.id
            }
        })
    
        const total = wins + losses
        const data = { wins, losses, total }
        res.json(data)
    } else {
        res.json(false)
    }
  } catch (err) {
    next(err)
  }
}

export const getMatchupMatrix = async (req, res, next) => {
    try {
        if (req.query.isSubscriber === 'true' || req.query.isAdmin === 'true') {
            const deckType = await DeckType.findOne({
                where: {
                    cleanName: {[Op.iLike]: req.params.id?.replaceAll('-', '_')}
                }
            })

            const format = await Format.findOne({
                where: {
                    cleanName: {[Op.iLike]: req.query.format?.replaceAll('-', '_')}
                }
            })

            const wins = await Matchup.findAll({
                where: {
                    winningDeckTypeId: deckType.id,
                    formatId: format.id
                }
            })
        
            const losses = await Matchup.findAll({
                where: {
                    losingDeckTypeId: deckType.id,
                    formatId: format.id
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
        } else {
            res.json({})
        }
    } catch (err) {
      next(err)
    }
  }
  