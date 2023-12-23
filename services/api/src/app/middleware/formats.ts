import { Format, Deck, Stats, Tournament } from '@fl/models'
import { Op } from 'sequelize'

export const formatsName = async (req, res, next) => {
  try {
    const format = await Format.findOne({
      where: {
        name: { [Op.iLike]: req.params.name.replace(' ', '_').replace('-', '_') }
      },
      attributes: ['id', 'name', 'icon', 'date', 'banlist', 'category', 'event', 'description']
    })

    const deckCount = await Deck.count({
      where: {
        formatName: { [Op.iLike]: format.name.replace(' ', '_').replace('-', '_') }
      }
    })

    const eventCount = await Tournament.count({
      where: {
        formatName: { [Op.iLike]: format.name.replace(' ', '_').replace('-', '_') }
      }
    })

    const statsCount = await Stats.count({
      where: {
        format: { [Op.iLike]: format.name.replace(' ', '_').replace('-', '_') },
        serverId: '414551319031054346'
      }
    })

    const data = {
      format,
      deckCount,
      eventCount,
      statsCount
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const formatsAll = async (req, res, next) => {
  try {
    const formats = await Format.findAll({
      where: {
        [Op.or]: {
          spotlight: true,
          category: 'TCG'
        },
        isHighlander: false
      },
      attributes: ['id', 'name', 'icon', 'date', 'banlist', 'category', 'event', 'description', 'popular', 'spotlight'],
      order: [
        ['popular', 'DESC'],
        ['spotlight', 'DESC'],
        ['date', 'ASC']
      ]
    })

    res.json(formats)
  } catch (err) {
    next(err)
  }
}
