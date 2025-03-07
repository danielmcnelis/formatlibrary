import { Card, Deck, Event, Format, Player, Replay, Server, Team, Tournament } from '@fl/models'
import { arrayToObject, capitalize, getRandomColor } from '@fl/utils'
import { Op } from 'sequelize'
import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import { config } from '@fl/config'

export const getCommunities = async (req, res, next) => {
    try {        
        const communities = [...await Event.findAll({
            where: { display: true },
            attributes: ['communityName']
        })].reduce((accum, val) => {
            if (!accum.includes(val.communityName)) {
                accum.push(val.communityName)
                return accum
            } else {
                return accum
            }
        }, [])

        communities.sort()
        communities.unshift('All Communities')
        res.json(communities.sort())
    } catch (err) {
        console.log(err)
    }
}

export const getEventGallery = async (req, res, next) => {
    try {
      const format = await Format.findOne({
        where: {
          name: { [Op.iLike]: req.params.format }
        },
        attributes: ['id', 'name', 'icon', 'videoName', 'videoId', 'videoPlaylistId']
      })
  
      if (!format) return false

      const events = await Event.findAll({
        where: {
          formatId: format.id,
          display: true
        },
        include: [
            { model: Player, as: 'winner', attributes: ['id', 'name', 'discordId', 'discordPfp', 'pfp']},
            { model: Team, as: 'winningTeam', attributes: ['id', 'name', 'captainId', 'playerAId', 'playerBId', 'playerCId']}
        ],
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        order: [['endDate', 'DESC']]
      })
  
      if (!events.length) return false
      const winners = events.map((e) => e.winner)

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
        if (limit > 100) return res.json({})
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
        }, []) : [['startedAt', 'desc']]

        const events = await Event.find(filter, limit, page, sort)
        res.json(events)
    } catch (err) {
        next(err)
    }
}

export const getEventCommunity = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: {
        display: true,
        communityName: { [Op.iLike]: req.params.community }
      },
      attributes: [
        'id',
        'name',
        'abbreviation',
        'formatName',
        'formatId',
        'size',
        'winnerName',
        'winnerId',
        'communityName',
        'startedAt',
        'endDate'
      ],
      include: [
        { model: Format, attributes: ['id', 'name', 'icon'] },
        { model: Player, as: 'winner', attributes: ['id', 'name', 'discordId', 'discordPfp', 'pfp']},
        { model: Team, as: 'winningTeam', attributes: ['id', 'name', 'captainId', 'playerAId', 'playerBId', 'playerCId']}
      ],
      order: [['startedAt', 'DESC']]
    })

    console.log('events', events)

    res.json(events)
  } catch (err) {
    next(err)
  }
}

export const getRecentEvents = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      where: {
        display: true,
        formatName: { [Op.iLike]: req.params.format }
      },
      // attributes: ['id', 'name', 'abbreviation', 'winnerName', 'winnerId', 'communityName', 'startedAt', 'endDate'],
      include: [
        { model: Format, attributes: ['id', 'name', 'icon'] },
        { model: Player, as: 'winner', attributes: ['id', 'name', 'discordId', 'discordPfp', 'pfp']},
        { model: Team, as: 'winningTeam', attributes: ['id', 'name', 'captainId', 'playerAId', 'playerBId', 'playerCId']}
      ],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      order: [['startedAt', 'DESC']],
      limit: 6
    })

    const winners = events.map((e) => e.winner)

    const data = {
      events,
      winners
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const getEventById = async (req, res, next) => {
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
        'winnerName',
        'winningTeamId',
        'winnerId',
        'isTeamEvent',
        'winnerId',
        'communityName',
        'serverId',
        'startedAt',
        'endDate'
      ],
      include: [
        { model: Player, as: 'winner', attributes: ['id', 'name', 'discordId', 'discordPfp', 'pfp']},
        { model: Team, as: 'winningTeam', attributes: ['id', 'name', 'captainId', 'playerAId', 'playerBId', 'playerCId']},
        { model: Server, attributes: ['id', 'inviteLink'] },
        { model: Format, attributes: ['id', 'name', 'icon', 'videoName', 'videoId', 'videoPlaylistId'] },
      ]
    })
    
    const replays = await Replay.findAll({
        where: {
            display: true,
            eventId: event.id
        },
        attributes: ['id', 'roundName', 'url', 'winnerId', 'loserId'],
        include: [
            { model: Player, as: 'loser', attributes: ['id', 'name', 'discordId', 'discordPfp', 'pfp'] }, 
            { model: Player, as: 'winner', attributes: ['id', 'name', 'discordId', 'discordPfp', 'pfp']}
        ],
        order: [['display', 'DESC'], ['roundAbs', 'DESC']]
    })

    const topDecks = await Deck.findAll({
      where: {
        display: true,
        [Op.or]: {
          eventAbbreviation: event.abbreviation,
          eventId: event.id
        }
      },
      attributes: ['id', 'deckTypeName', 'builderName', 'placement'],
      order: [
        ['placement', 'ASC'],
        ['builderName', 'ASC']
      ]
    })

    const allDecks = await Deck.findAll({
      where: {
        [Op.or]: {
          eventAbbreviation: event.abbreviation,
          eventId: event.id
        }
      },
      attributes: ['id', 'deckTypeName', 'category', 'builderName', 'ydk', 'placement']
    })

    const colors = [
        '#3d72e3', '#ff3c2e', '#ffd000', '#47ad53', '#43578f', '#b25cd6',
        '#6d9399', '#f5881b', '#31ada5', '#ffcd19', '#cf8ac5', '#8a8dcf', 
        '#d65180', '#307a3a', '#735645', '#fc8c1c', '#8dc276', '#c4495f', 
        '#3e8cbd', '#b865cf', '#fcdc5b', '#43d1a2', '#452194', '#d96827', 
        '#79b096', '#5c8fe0', '#9474b0', '#2b9dbd', '#eb692d', '#93c951'
    ]

    const deckTypes = allDecks.length >= event.size / 2 ? 
        Object.entries(arrayToObject(allDecks.map((d) => capitalize(d.deckTypeName, true)))).sort(
            (a: any, b: any) => b[1] - a[1]
        ) : []

    deckTypes.forEach((el, index) => el.push(colors[index] || getRandomColor()))

    const topDeckConversions = allDecks.length >= event.size / 2 ?
        Object.entries(arrayToObject(topDecks.map((d) => capitalize(d.deckTypeName, true)))).sort(
            (a: any, b: any) => b[1] - a[1]
        ) : []

    // @ts-ignore
    topDeckConversions.forEach((el) => el.push(deckTypes.find((e) => e[0] === el[0])[2]))

    const mainDeckCards = []
    const sideDeckCards = []
    const topMainDeckCards = []
    const topSideDeckCards = []

    if (allDecks.length >= event.size / 2) {
      for (let i = 0; i < allDecks.length; i++) {
        const ydk = allDecks[i].ydk
        const main = ydk
          .split('#extra')[0]
          .split(/[\s]+/)
          .filter((el) => !el.includes('by') && !el.includes('created') &&  el.charAt(0) !== '.' && el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '')
        mainDeckCards.push(...main)
        const side = ydk
          .split('!side')[1]
          .split(/[\s]+/)
          .filter((el) => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '')
        sideDeckCards.push(...side)
      }

      const mainDeckCardFrequencies = arrayToObject(mainDeckCards)
      const topMainDeckFrequencies = Object.entries(mainDeckCardFrequencies)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 10)

      for (let i = 0; i < topMainDeckFrequencies.length; i++) {
        const e = topMainDeckFrequencies[i]
        let konamiCode = e[0]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        try {
          const card = await Card.findOne({
            where: {
              konamiCode
            },
            attributes: ['name']
          })

          if (!card) {
            console.log(`no card: ${konamiCode}`)
            continue
          } else {
            topMainDeckCards.push([card?.name, e[1]])
          }
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
        let konamiCode = e[0]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        try {
          const card = await Card.findOne({
            where: {
              konamiCode
            },
            attributes: ['name']
          })

          if (!card) {
            console.log(`no card: ${konamiCode}`)
            continue
          } else {
            topSideDeckCards.push([card?.name, e[1]])
          }
        } catch (err) {
          console.log(err)
        }
      }
    }

    const data = {
      event: event,
      winner: event.winner,
      replays: replays,
      topDecks: topDecks,
      metagame: {
        deckTypes,
        topDeckConversions,
        topMainDeckCards,
        topSideDeckCards
      }
    }
    
    res.json(data)
  } catch (err) {
    next(err)
  }
}


export const getEventByIdAsSubscriber = async (req, res, next) => {
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
          'winnerName',
          'winningTeamId',
          'winnerId',
          'isTeamEvent',
          'winnerId',
          'communityName',
          'serverId',
          'startedAt',
          'endDate'
        ],
        include: [
          { model: Player, as: 'winner', attributes: ['id', 'name', 'discordId', 'discordPfp', 'pfp']},
          { model: Team, as: 'winningTeam', attributes: ['id', 'name', 'captainId', 'playerAId', 'playerBId', 'playerCId']},
          { model: Server, attributes: ['id', 'inviteLink'] },
          { model: Format, attributes: ['id', 'name', 'icon', 'videoName', 'videoId', 'videoPlaylistId'] },
        ]
      })
      
      const replays = await Replay.findAll({
          where: {
              display: {[Op.or]: [true, false]},
              eventId: event.id
          },
          include: [
              { model: Player, as: 'loser', attributes: ['id', 'name', 'discordId', 'discordPfp', 'pfp'] }, 
              { model: Player, as: 'winner', attributes: ['id', 'name', 'discordId', 'discordPfp', 'pfp']}
          ],
          order: [['display', 'DESC'], ['roundAbs', 'DESC']]
      })
  
      const trueTopDecks = await Deck.findAll({
        where: {
          display: true,
          [Op.or]: {
            eventAbbreviation: event.abbreviation,
            eventId: event.id
          }
        },
        attributes: ['id', 'deckTypeName', 'builderName', 'placement'],
        order: [
          ['placement', 'ASC'],
          ['builderName', 'ASC']
        ]
      })

      const topDecks = await Deck.findAll({
        where: {
          display: true,
          [Op.or]: {
            eventAbbreviation: event.abbreviation,
            eventId: event.id
          }
        },
        attributes: ['id', 'deckTypeName', 'builderName', 'placement'],
        order: [
          ['placement', 'ASC'],
          ['builderName', 'ASC']
        ]
      })
  
      const allDecks = await Deck.findAll({
        where: {
          [Op.or]: {
            eventAbbreviation: event.abbreviation,
            eventId: event.id
          }
        },
        attributes: ['id', 'deckTypeName', 'category', 'builderName', 'ydk', 'placement']
      })
  
      const colors = [
        '#3d72e3', '#ff3c2e', '#ffd000', '#47ad53', '#43578f', '#b25cd6',
        '#6d9399', '#f5881b', '#31ada5', '#ffcd19', '#cf8ac5', '#8a8dcf', 
        '#d65180', '#307a3a', '#735645', '#fc8c1c', '#8dc276', '#c4495f', 
        '#3e8cbd', '#b865cf', '#fcdc5b', '#43d1a2', '#452194', '#d96827', 
        '#79b096', '#5c8fe0', '#9474b0', '#2b9dbd', '#eb692d', '#93c951'
    ]

    const deckTypes = allDecks.length >= event.size / 2 ? 
        Object.entries(arrayToObject(allDecks.map((d) => capitalize(d.deckTypeName, true)))).sort(
            (a: any, b: any) => b[1] - a[1]
        ) : []

    deckTypes.forEach((el, index) => el.push(colors[index] || getRandomColor()))

    const topDeckConversions = allDecks.length >= event.size / 2 ?
        Object.entries(arrayToObject(topDecks.map((d) => capitalize(d.deckTypeName, true)))).sort(
            (a: any, b: any) => b[1] - a[1]
        ) : []

    // @ts-ignore
    topDeckConversions.forEach((el) => el.push(deckTypes.find((e) => e[0] === el[0])[2]))
        
        
      const mainDeckCards = []
      const sideDeckCards = []
      const topMainDeckCards = []
      const topSideDeckCards = []
  
      if (allDecks.length >= event.size / 2) {
        for (let i = 0; i < allDecks.length; i++) {
          const ydk = allDecks[i].ydk
          const main = ydk
            .split('#extra')[0]
            .split(/[\s]+/)
            .filter((el) => !el.includes('by') && !el.includes('created') &&  el.charAt(0) !== '.' && el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '')
          mainDeckCards.push(...main)
          const side = ydk
            .split('!side')[1]
            .split(/[\s]+/)
            .filter((el) => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '')
          sideDeckCards.push(...side)
        }
  
        const mainDeckCardFrequencies = arrayToObject(mainDeckCards)
        const topMainDeckFrequencies = Object.entries(mainDeckCardFrequencies)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 10)
  
        for (let i = 0; i < topMainDeckFrequencies.length; i++) {
          const e = topMainDeckFrequencies[i]
          let konamiCode = e[0]
          while (konamiCode.length < 8) konamiCode = '0' + konamiCode
          try {
            const card = await Card.findOne({
              where: {
                konamiCode
              },
              attributes: ['name']
            })
  
            if (!card) {
              console.log(`no card: ${konamiCode}`)
              continue
            } else {
              topMainDeckCards.push([card?.name, e[1]])
            }
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
          let konamiCode = e[0]
          while (konamiCode.length < 8) konamiCode = '0' + konamiCode
          try {
            const card = await Card.findOne({
              where: {
                konamiCode
              },
              attributes: ['name']
            })
  
            if (!card) {
              console.log(`no card: ${konamiCode}`)
              continue
            } else {
              topSideDeckCards.push([card?.name, e[1]])
            }
          } catch (err) {
            console.log(err)
          }
        }
      }
  
      const data = {
        event: event,
        winner: event.winner,
        replays: replays,
        topDecks: topDecks,
        metagame: {
          deckTypes,
          topDeckConversions,
          topMainDeckCards,
          topSideDeckCards
        }
      }
      
      res.json(data)
    } catch (err) {
      next(err)
    }
  }

export const createEvents = async (req, res, next) => {
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
    
        const { Location: uri} = await new Upload({
          client: s3,

          params: { 
              Bucket: 'formatlibrary', 
              Key: `images/brackets/${req.body.abbreviation}.png`, 
              Body: buffer,
              ContentType: 'image/png'
          }
        }).done()
    
        console.log('uri', uri)
    }

    if (req.body.id) {
      await Tournament.create({
        id: req.body.id,
        name: req.body.challongeName,
        url: req.body.url,
        format: req.body.format.name,
        communityName: req.body.communityName,
        emoji: req.body.emoji,
        type: req.body.type,
        channelId: req.body.channelId,
        serverId: req.body.serverId,
        state: 'complete',
        startedAt: req.body.startedAt
      })
    }

    const event = await Event.create({
      name: req.body.fullName,
      abbreviation: req.body.abbreviation,
      formatName: req.body.format.name,
      formatId: req.body.format.id,
      referenceUrl: req.body.referenceUrl,
      primaryTournamentId: req.body.id,
      display: true,
      size: req.body.size,
      type: req.body.type,
      series: req.body.series,
      isTeamEvent: req.body.isTeamEvent,
      winnerName: req.body.winner,
      winnerId: req.body.playerId,
      communityName: req.body.communityName,
      emoji: req.body.emoji,
      startedAt: req.body.startedAt,
      endDate: req.body.endDate
    })

    res.json(event)
  } catch (err) {
    next(err)
  }
}
