import { Card, Deck, Format, Stats, Tournament } from '@fl/models'
import { Op } from 'sequelize'

export const getOCGExclusives = async (req, res, next) => {
    try {
        const format = await Format.findOne({
            where: {
                name: { [Op.iLike]: req.params.name.replaceAll(' ', '_').replaceAll('-', '_') }
            },
            attributes: [
                'id', 'date'
            ]
        })

        console.log('format', format)

        const ocgExclusives = await Card.findAll({
            where: {
                isOcgLegal: true,
                isTcgLegal: false,
                ocgDate: {[Op.lte]: format.date }
            },
            attributes: [
                'id', 'artworkId', 'sortPriority', 'isOcgLegal', 'isTcgLegal', 'ocgDate'
            ]
        })

        console.log('ocgExclusives')

        const data = { ocgExclusives }
        res.json(data)
    } catch (err) {
        next(err)
    }
}

export const getFormatByName = async (req, res, next) => {
  try {
    const format = await Format.findOne({
      where: {
        name: { [Op.iLike]: req.params.name.replaceAll(' ', '_').replaceAll('-', '_') }
      },
      attributes: [
        'id', 'name', 'icon', 'date', 'banlist', 'category', 'eventName', 'description', 
        'isPopular', 'isSpotlight', 'videoEmbed', 'videoId', 'videoPlaylistId', 'useSeasonalElo', 'seasonResetDate',
        'previousFormatId', 'previousFormatName', 'nextFormatId', 'nextFormatName'
      ]
    })

    const deckCount = await Deck.count({
      where: {
        formatName: { [Op.iLike]: format.name.replaceAll(' ', '_').replaceAll('-', '_') }
      }
    })

    const eventCount = await Tournament.count({
      where: {
        formatName: { [Op.iLike]: format.name.replaceAll(' ', '_').replaceAll('-', '_') }
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

    return res.json(data)
  } catch (err) {
    next(err)
  }
}

export const getFormats = async (req, res, next) => {
  try {
    const formats = await Format.findAll({
      where: {
        [Op.or]: {
          isSpotlight: true,
          category: {[Op.or]: ['TCG', 'OCG']}
        },
        isHighlander: false
      },
      attributes: ['id', 'name', 'icon', 'date', 'banlist', 'category', 'era', 'eventName', 'description', 'isPopular', 'isSpotlight', 'useSeasonalElo', 'sortPriority'],
      order: [ 
        ["sortPriority", "ASC"], 
        ["isSpotlight", "DESC"], 
        ["date", "ASC"]
      ]
    })

    return res.json(formats)
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
        return res.json(format)
    } catch (err) {
    next(err)
    }
}