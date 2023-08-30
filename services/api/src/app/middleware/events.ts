import { Card, Deck, Event, Format, Player, Replay, Tournament } from '@fl/models'
import { arrayToObject, capitalize } from '@fl/utils'
import { Op } from 'sequelize'
import { S3 } from 'aws-sdk'
import { config } from '@fl/config'

export const eventsAll = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: {
        display: true
      },
      attributes: [
        'id',
        'name',
        'abbreviation',
        'formatName',
        'formatId',
        'size',
        'winner',
        'playerId',
        'community',
        'startDate',
        'endDate'
      ],
      include: [
        { model: Format, attributes: ['id', 'name', 'icon'] },
        { model: Player, attributes: ['id', 'name', 'discriminator', 'discordId', 'discordPfp'] }
      ],
      order: [['startDate', 'DESC']]
    })

    res.json(events)
  } catch (err) {
    next(err)
  }
}


export const eventsGallery = async (req, res, next) => {
    try {
        console.log('req.params.format', req.params.format)
      const format = await Format.findOne({
        where: {
          name: { [Op.iLike]: req.params.format }
        },
        attributes: ['id', 'name', 'icon']
      })
  
      if (!format) return false
      console.log('!!format', !!format)

      const events = await Event.findAll({
        where: {
          formatId: format.id,
          display: true
        },
        include: [
          { model: Player, attributes: ['id', 'name', 'discriminator', 'discordId', 'discordPfp'] }
        ],
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        order: [['endDate', 'DESC']]
      })
  
      console.log('events.length', events.length)
      if (!events.length) return false
      const winners = events.map((e) => e.player)

      const data = {
        format,
        events,
        winners
      }
  
      res.json(data)
    } catch (err) {
      next(err)
    }
  }


export const countEvents = async (req, res, next) => {
    try {
        const filter = req.query.filter ? req.query.filter.split(',').reduce((reduced, val) => {
            let [field, operator, value] = val.split(':')
            if (value.startsWith('arr(') && value.endsWith(')')) value = (value.slice(4, -1)).split(';')
            reduced[field] = {operator, value}
            return reduced
        }, { display: {operator: 'eq', value: 'true'} }) : { display: {operator: 'eq', value: 'true'} }

        const count = await Event.countResults(filter)
        res.json(count)
    } catch (err) {
        next(err)
    }
}

export const getEvents = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit || 10)
        const page = parseInt(req.query.page || 1)

        const filter = req.query.filter ? req.query.filter.split(',').reduce((reduced, val) => {
            let [field, operator, value] = val.split(':')
            if (value.startsWith('arr(') && value.endsWith(')')) value = (value.slice(4, -1)).split(';')
            reduced[field] = {operator, value}
            return reduced
        }, { display: {operator: 'eq', value: 'true'} }) : { display: {operator: 'eq', value: 'true'} }

        const sort = req.query.sort ? req.query.sort.split(',').reduce((reduced, val) => {
            const [field, value] = val.split(':')
            reduced.push([field, value])
            return reduced
        }, []) : [['startDate', 'desc']]

        const events = await Event.find(filter, limit, page, sort)
        res.json(events)
    } catch (err) {
        next(err)
    }
}

export const eventsCommunity = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: {
        display: true,
        community: { [Op.iLike]: req.params.community }
      },
      attributes: [
        'id',
        'name',
        'abbreviation',
        'formatName',
        'formatId',
        'size',
        'winner',
        'playerId',
        'community',
        'startDate',
        'endDate'
      ],
      include: [
        { model: Format, attributes: ['id', 'name', 'icon'] },
        { model: Player, attributes: ['id', 'name', 'discriminator', 'discordId', 'discordPfp'] }
      ],
      order: [['startDate', 'DESC']]
    })

    res.json(events)
  } catch (err) {
    next(err)
  }
}

export const eventsRecent = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: {
        display: true,
        formatName: { [Op.iLike]: req.params.format }
      },
      // attributes: ['id', 'name', 'abbreviation', 'winner', 'playerId', 'community', 'startDate', 'endDate'],
      include: [
        { model: Format, attributes: ['id', 'name', 'icon'] },
        { model: Player, attributes: ['id', 'name', 'discriminator', 'discordId', 'discordPfp'] }
      ],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      order: [['startDate', 'DESC']],
      limit: 6
    })

    const winners = events.map((e) => e.player)

    const data = {
      events,
      winners
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const eventsFirst = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: { display: true },
      attributes: [
        'id',
        'name',
        'abbreviation',
        'formatName',
        'formatId',
        'size',
        'winner',
        'playerId',
        'community',
        'startDate',
        'endDate'
      ],
      include: [
        { model: Format, attributes: ['id', 'name', 'icon'] },
        { model: Player, attributes: ['id', 'name', 'discriminator', 'discordId', 'discordPfp'] }
      ],
      order: [['startDate', 'DESC']],
      limit: req.params.x
    })

    res.json(events)
  } catch (err) {
    next(err)
  }
}

export const eventsId = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: {
        abbreviation: req.params.id
      },
      attributes: [
        'id',
        'name',
        'abbreviation',
        'referenceUrl',
        'formatName',
        'formatId',
        'size',
        'winner',
        'playerId',
        'community',
        'startDate',
        'endDate'
      ],
      include: [
        { model: Format, attributes: ['id', 'name', 'icon'] },
        { model: Player, attributes: ['id', 'name', 'discriminator', 'discordId', 'discordPfp'] }
      ]
    })
    
    const replays = await Replay.findAll({
        where: {
            display: (req.query.isAdmin === 'true' || req.query.isSubscriber === 'true') ? {[Op.or]: [true, false]} : true,
            eventId: event.id
        },
        include: [{ model: Player, as: 'loser' }, { model: Player, as: 'winner' }],
        order: [['display', 'DESC'], ['suggestedOrder', 'DESC']]
    })

    const topDecks = await Deck.findAll({
      where: {
        display: (req.query.isAdmin === 'true' || req.query.isSubscriber === 'true') ? {[Op.or]: [true, false]} : true,
        [Op.or]: {
          eventName: event.abbreviation,
          eventId: event.id
        }
      },
      attributes: ['id', 'type', 'builder', 'placement'],
      order: [
        ['placement', 'ASC'],
        ['builder', 'ASC']
      ]
    })

    const allDecks = await Deck.findAll({
      where: {
        [Op.or]: {
          eventName: event.abbreviation,
          eventId: event.id
        }
      },
      attributes: ['id', 'type', 'category', 'builder', 'ydk', 'placement']
    })

    const deckTypes =
      allDecks.length >= event.size / 2
        ? Object.entries(arrayToObject(allDecks.map((d) => capitalize(d.type, true)))).sort(
            (a: any, b: any) => b[1] - a[1]
          )
        : []
    const deckCategories =
      allDecks.length >= event.size / 2
        ? Object.entries(arrayToObject(allDecks.map((d) => capitalize(d.category, true)))).sort(
            (a: any, b: any) => b[1] - a[1]
          )
        : []
    const mainDeckCards = []
    const sideDeckCards = []
    const topMainDeckCards = []
    const topSideDeckCards = []

    if (allDecks.length >= event.size / 2) {
      for (let i = 0; i < allDecks.length; i++) {
        const ydk = allDecks[i].ydk
        const main = ydk
          .split('#extra')[0]
          .split('\n')
          .filter((el) => !el.includes('by') && !el.includes('created') && el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '')
        mainDeckCards.push(...main)
        const side = ydk
          .split('!side')[1]
          .split('\n')
          .filter((el) => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '')
        sideDeckCards.push(...side)
      }

      const mainDeckCardFrequencies = arrayToObject(mainDeckCards)
      const topMainDeckFrequencies = Object.entries(mainDeckCardFrequencies)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 10)

      for (let i = 0; i < topMainDeckFrequencies.length; i++) {
        const e = topMainDeckFrequencies[i]
        const konamiCode = e[0]
        try {
          const card = await Card.findOne({
            where: {
              konamiCode
            },
            attributes: ['name']
          })

          topMainDeckCards.push([card.name, e[1]])
        } catch (err) {
          console.log(err)
        }
      }

      const sideDeckCardFrequencies = arrayToObject(sideDeckCards)
      const topSideDeckFrequencies = Object.entries(sideDeckCardFrequencies)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 10)

      for (let i = 0; i < topSideDeckFrequencies.length; i++) {
        const e = topSideDeckFrequencies[i]
        const konamiCode = e[0]
        try {
          const card = await Card.findOne({
            where: {
              konamiCode
            },
            attributes: ['name']
          })

          topSideDeckCards.push([card.name, e[1]])
        } catch (err) {
          console.log(err)
        }
      }
    }

    const data = {
      event: event,
      winner: event.player,
      replays: replays,
      topDecks: topDecks,
      metagame: {
        deckTypes,
        deckCategories,
        topMainDeckCards,
        topSideDeckCards
      }
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const eventsCreate = async (req, res, next) => {
  try {
    if (req.body.bracket) {
        const buffer = Buffer.from(req.body.bracket.replace(/^data:image\/\w+;base64,/, ''), 'base64')

        const s3 = new S3({
            region: config.s3.region,
            credentials: {
                accessKeyId: config.s3.credentials.accessKeyId,
                secretAccessKey: config.s3.credentials.secretAccessKey
            }
        })
    
        const { Location: uri} = await s3.upload({ 
            Bucket: 'formatlibrary', 
            Key: `images/brackets/${req.body.abbreviation}.png`, 
            Body: buffer,
            ContentType: 'image/png'
        }).promise()
    
        console.log('uri', uri)
    }

    if (req.body.id) {
      await Tournament.create({
        id: req.body.id,
        name: req.body.challongeName,
        url: req.body.url,
        format: req.body.format.name,
        community: req.body.community,
        emoji: req.body.emoji,
        type: req.body.type,
        channelId: req.body.channelId,
        serverId: req.body.serverId,
        state: 'complete',
        startDate: req.body.startDate
      })
    }

    const event = await Event.create({
      name: req.body.fullName,
      abbreviation: req.body.abbreviation,
      formatName: req.body.format.name,
      formatId: req.body.format.id,
      referenceUrl: req.body.referenceUrl,
      tournamentId: req.body.id,
      primaryTournamentId: req.body.id,
      display: true,
      size: req.body.size,
      type: req.body.type,
      series: req.body.series,
      winner: req.body.winner,
      playerId: req.body.playerId,
      community: req.body.community,
      emoji: req.body.emoji,
      startDate: req.body.startDate,
      endDate: req.body.endDate
    })

    res.json(event)
  } catch (err) {
    next(err)
  }
}
