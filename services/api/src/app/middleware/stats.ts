import { Player, Stats } from '@fl/models'
import { Op } from 'sequelize'

export const statsLeaders = async (req, res, next) => {
  try {
    const stats = await Stats.findAll({
      where: {
        format: { [Op.iLike]: req.params.format.replace(' ', '_').replace('-', '_') },
        games: { [Op.gte]: 3 },
        inactive: false,
        serverId: '414551319031054346',
        '$player.hidden$': false
      },
      attributes: ['id', 'format', 'elo', 'wins', 'losses', 'playerId'],
      include: [{ model: Player, attributes: ['id', 'name', 'discriminator', 'discordId', 'discordPfp'] }],
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
      attributes: ['id', 'format', 'elo', 'wins', 'losses', 'playerId'],
      order: [['elo', 'DESC']],
      limit: 10
    })

    res.json(stats)
  } catch (err) {
    next(err)
  }
}
