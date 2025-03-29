
import { Deck, DeckType, Format, Matchup } from '@fl/models'
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
        return res.json(data)
    } else {
        return res.json(false)
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

            if (!format) return res.json({})

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
            
            
            const tournamentWins = await Matchup.findAll({
                where: {
                    winningDeckTypeId: deckType.id,
                    source: 'tournament',
                    formatId: format.id
                }
            })
        
            const tournamentLosses = await Matchup.findAll({
                where: {
                    losingDeckTypeId: deckType.id,
                    source: 'tournament',
                    formatId: format.id
                }
            })

            const matrix = {}

            wins.forEach((matchup) => {
                if (!matrix[matchup.losingDeckTypeName]) {
                    matrix[matchup.losingDeckTypeName] = {
                        wins: 1,
                        losses: 0,
                        total: 1
                    }
                } else {
                    matrix[matchup.losingDeckTypeName].wins++
                    matrix[matchup.losingDeckTypeName].total++
                }
            })

            losses.forEach((matchup) => {
                if (!matrix[matchup.winningDeckTypeName]) {
                    matrix[matchup.winningDeckTypeName] = {
                        wins: 0,
                        losses: 1,
                        total: 1
                    }
                } else {
                    matrix[matchup.winningDeckTypeName].losses++
                    matrix[matchup.winningDeckTypeName].total++
                }
            })

            const deckRepresentation = await Deck.count({
                where: {
                    deckTypeId: deckType.id,
                    origin: 'event',
                    formatId: format?.id
                }
            })

            const topDeckRepresentation = await Deck.count({
                where: {
                    display: true,
                    deckTypeId: deckType.id,
                    origin: 'event',
                    formatId: format?.id
                }
            })

            const conversionRate = Math.round((topDeckRepresentation / deckRepresentation) * 100)
            const overallWinRate = Math.round(wins / (wins + losses) * 100)
            const tournamentWinRate = Math.round(tournamentWins / (tournamentWins + tournamentLosses) * 100)
            
            return res.json({...matrix, conversionRate, overallWinRate, tournamentWinRate})
        } else {
            return res.json({})
        }
    } catch (err) {
      next(err)
    }
  }
  