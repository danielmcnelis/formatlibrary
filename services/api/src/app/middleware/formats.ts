import { Format, Deck, Stats, Tournament } from '@fl/models'
import { Op } from 'sequelize'

export const formatsName = async (req, res, next) => {
  try {
    const format = await Format.findOne({
      where: {
        name: { [Op.iLike]: req.params.name.replace(' ', '_').replace('-', '_') }
      },
      attributes: ['id', 'name', 'icon', 'date', 'banlist', 'category', 'eventName', 'description', 'isPopular', 'isSpotlight', 'videoEmbed', 'videoPlaylistId']
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
        formatId: format.id,
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
          isSpotlight: true,
          category: 'TCG'
        },
        isHighlander: false
      },
      attributes: ['id', 'name', 'icon', 'date', 'banlist', 'category', 'eventName', 'description', 'isPopular', 'isSpotlight'],
      order: [
        ['isPopular', 'DESC'],
        ['isSpotlight', 'DESC'],
        ['date', 'ASC']
      ]
    })

    res.json(formats)
  } catch (err) {
    next(err)
  }
}

export const updateFormatInfo = async (req, res, next) => {
    try {
        const format = await Format.findOne({
            where: {
                id: req.query.id
            }
        })

        await format.update({ ...req.body })
        res.json(format)
    } catch (err) {
    next(err)
    }
}