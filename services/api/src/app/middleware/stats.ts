import { Player, Stats } from '@fl/models'
import { Op } from 'sequelize'

export const getClassicLeaderboard = async (req, res, next) => {
    try {
      const stats = await Stats.findAll({
        where: {
          formatName: { [Op.iLike]: req.params.format.replace(' ', '_').replace('-', '_') },
          games: { [Op.gte]: 3 },
          serverId: '414551319031054346',
          '$player.isHidden$': false
        },
        attributes: [
          'id', 'formatName', 'formatId', ['classicElo', 'elo'], 'wins', 'losses', 'games', 'playerId', 'serverId'
        ],
        include: [{ model: Player, attributes: ['id', 'name', 'discordId', 'discordPfp']}],
        limit: parseInt(req.params.limit) || 10,
        order: [['elo', 'DESC']]
      })
  
      res.json(stats)
    } catch (err) {
      next(err)
    }
  }

export const getGeneralLeaderboard = async (req, res, next) => {
    try {
      const stats = await Stats.findAll({
        where: {
          formatName: { [Op.iLike]: req.params.format.replace(' ', '_').replace('-', '_') },
          games: { [Op.gte]: 3 },
          serverId: '414551319031054346',
          '$player.isHidden$': false
        },
        attributes: [
          'id', 'formatName', 'formatId', 'elo', 'wins', 'losses', 'games', 'playerId', 'serverId'
        ],
        include: [{ model: Player, attributes: ['id', 'name', 'discordId', 'discordPfp']}],
        limit: parseInt(req.params.limit) || 10,
        order: [['elo', 'DESC']]
      })
  
      res.json(stats)
    } catch (err) {
      next(err)
    }
  }

export const getSeasonalLeaderboard = async (req, res, next) => {
  try {
    const stats = await Stats.findAll({
      where: {
        formatName: { [Op.iLike]: req.params.format.replace(' ', '_').replace('-', '_') },
        seasonalGames: { [Op.gte]: 3 },
        serverId: '414551319031054346',
        '$player.isHidden$': false
      },
      attributes: [
        'id', 'formatName', 'formatId', ['seasonalElo', 'elo'], ['seasonalWins', 'wins'], ['seasonalLosses', 'losses'], ['seasonalGames', 'games'], 'playerId', 'serverId'
      ],
      include: [{ model: Player, attributes: ['id', 'name', 'discordId', 'discordPfp']}],
      limit: parseInt(req.params.limit) || 10,
      order: [['elo', 'DESC']]
    })

    res.json(stats)
  } catch (err) {
    next(err)
  }
}

export const statsPlayer = async (req, res, next) => {
  try {
    const stats = await Stats.findAll({
      where: {
        playerId: req.params.playerId,
        games: { [Op.gte]: 3 },
        serverId: '414551319031054346'
      },
      attributes: ['id', 'formatName', 'formatId', 'elo', 'wins', 'losses', 'playerId'],
      order: [['elo', 'DESC']],
      limit: 10
    })

    res.json(stats)
  } catch (err) {
    next(err)
  }
}
