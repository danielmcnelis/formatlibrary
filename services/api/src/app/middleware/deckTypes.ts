import { Card, Deck, DeckThumb, DeckType, Event, Format, Matchup } from '@fl/models'
import { Op } from 'sequelize'
import axios from 'axios'
import * as fs from 'fs'

export const getDeckTypes = async (req, res, next) => {
  try {
    const deckTypes = await DeckType.findAll({
      attributes: ['id', 'name', 'category'],
      order: [['name', 'ASC']]
    })

    return res.json(deckTypes)
  } catch (err) {
    next(err)
  }
}

export const getDeckTypeByName = async (req, res, next) => {
    try {
        const deckType = await DeckType.findOne({
            where: { 
                cleanName: {[Op.iLike]: req.params.name?.replaceAll('-', '_') }
            },
            attributes: ['id', 'name', 'category'],
            order: [['name', 'ASC']]
        })
    
        return res.json(deckType)
    } catch (err) {
        next(err)
    }
}

export const downloadDeckType = async (req, res, next) => {
    try {
      const format = await Format.findOne({
        where: {
          cleanName: { [Op.iLike]: req.query.format?.replaceAll('-', '_') }
        },
        attributes: ['id', 'name', 'banlist', 'date', 'icon']
      })

      const deckType = await DeckType.findOne({
        where: {
            cleanName: { [Op.iLike]: req.query.id?.replaceAll('-', '_') },
        }
      })

      const decks =
        (await Deck.findAll({
            where: {
                deckTypeId: deckType.id,
                formatId: format.id,
                origin: 'event',
                eventId: { [Op.not]: null },
                '$event.isRepresentative$': true
            },
            attributes: ['id', 'ydk', 'eventId'],
            include: { model: Event, attributes: ['id', 'isRepresentative']}
        })) || []

      const data = {
        analyzed: 0,
        main: {},
        mainMonsters: [],
        mainSpells: [],
        mainTraps: [],
        extra: {},
        extraMonsters: [],
        side: {},
        sideMonsters: [],
        sideSpells: [],
        sideTraps: []
      }
  
      for (let i = 0; i < decks.length; i++) {
        const deck = decks[i]
        data.analyzed++
  
        const mainKonamiCodes = deck.ydk
            .split('#main')[1]
            .split('#extra')[0]
            .split(/[\s]+/)
            .filter((e) => e.length)
            .map((e) => e.trim().replace(/^0+/, ''))

        const extraKonamiCodes = deck.ydk
            .split('#extra')[1]
            .split('!side')[0]
            .split(/[\s]+/)
            .filter((e) => e.length)
            .map((e) => e.trim().replace(/^0+/, ''))

        const sideKonamiCodes = deck.ydk
            .split('!side')[1]
            .split(/[\s]+/)
            .filter((e) => e.length)
            .map((e) => e.trim().replace(/^0+/, ''))
  
        const main = mainKonamiCodes.reduce((acc, curr) => (acc[curr] ? acc[curr]++ : (acc[curr] = 1), acc), {})
        const extra = extraKonamiCodes.reduce((acc, curr) => (acc[curr] ? acc[curr]++ : (acc[curr] = 1), acc), {})
        const side = sideKonamiCodes.reduce((acc, curr) => (acc[curr] ? acc[curr]++ : (acc[curr] = 1), acc), {})

        Object.entries(main).forEach((e) => {
          const konamiCode = e[0]
          const count = e[1]
          if (data.main[konamiCode]) {
            data.main[konamiCode][count]++
            data.main[konamiCode].decks++
            data.main[konamiCode].total += count
          } else {
            data.main[konamiCode] = {
              total: count,
              decks: 1,
              1: count === 1 ? 1 : 0,
              2: count === 2 ? 1 : 0,
              3: count === 3 ? 1 : 0
            }
          }
        })
  
        Object.entries(extra).forEach((e) => {
          const konamiCode = e[0]
          const count = e[1]
          if (data.extra[konamiCode]) {
            data.extra[konamiCode][count]++
            data.extra[konamiCode].decks++
            data.extra[konamiCode].total += count
          } else {
            data.extra[konamiCode] = {
              total: count,
              decks: 1,
              1: count === 1 ? 1 : 0,
              2: count === 2 ? 1 : 0,
              3: count === 3 ? 1 : 0
            }
          }
        })
  
        Object.entries(side).forEach((e) => {
          const konamiCode = e[0]
          const count = e[1]
          if (data.side[konamiCode]) {
            data.side[konamiCode][count]++
            data.side[konamiCode].decks++
            data.side[konamiCode].total += count
          } else {
            data.side[konamiCode] = {
              total: count,
              decks: 1,
              1: count === 1 ? 1 : 0,
              2: count === 2 ? 1 : 0,
              3: count === 3 ? 1 : 0
            }
          }
        })
      }
  
      const main = Object.entries(data.main)
  
      for (let j = 0; j < main.length; j++) {
        const e: any = main[j]
        if (e[1].decks < 0.25 * data.analyzed) {
          delete data.main[e[0]]
        } else {
          let konamiCode = e[0]
          while (konamiCode.length < 8) konamiCode = '0' + konamiCode
          const card =
            (await Card.findOne({
              where: {
                konamiCode
              },
              attributes: ['id', 'name', 'cleanName', 'category', 'artworkId', 'konamiCode', 'sortPriority']
            })) || {}
  
          data.main[e[0]].card = card
        }
      }
  
      const extra = Object.entries(data.extra)
  
      for (let j = 0; j < extra.length; j++) {
        const e: any = extra[j]
        if (e[1].decks < 0.25 * data.analyzed) {
          delete data.extra[e[0]]
        } else {
          let konamiCode = e[0]
          while (konamiCode.length < 8) konamiCode = '0' + konamiCode
          const card =
            (await Card.findOne({
              where: {
                konamiCode
              },
              attributes: ['id', 'name', 'cleanName', 'category', 'artworkId', 'konamiCode', 'sortPriority']
            })) || {}
  
          data.extra[e[0]].card = card
        }
      }
  
      const side = Object.entries(data.side)
  
      for (let j = 0; j < side.length; j++) {
        const e: any = side[j]
        if (e[1].decks < 0.25 * data.analyzed) {
          delete data.side[e[0]]
        } else {
          let konamiCode = e[0]
          while (konamiCode.length < 8) konamiCode = '0' + konamiCode
          const card =
            (await Card.findOne({
              where: {
                konamiCode
              },
              attributes: ['id', 'name', 'cleanName', 'category', 'artworkId', 'konamiCode', 'sortPriority']
            })) || {}
  
          data.side[e[0]].card = card
        }
      }
  
      const sortFn = (a, b) => {
        if (a.card.sortPriority > b.card.sortPriority) {
          return 1
        } else if (b.card.sortPriority > a.card.sortPriority) {
          return -1
        } else if (a.card.name > b.card.name) {
          return 1
        } else if (b.card.name > a.card.name) {
          return -1
        } else {
          return 0
        }
      }

      data.mainMonsters = Object.values(data.main).filter((v: any) => v.card.category === 'Monster').sort(sortFn)
      data.mainSpells = Object.values(data.main).filter((v: any) => v.card.category === 'Spell').sort(sortFn)
      data.mainTraps = Object.values(data.main).filter((v: any) => v.card.category === 'Trap').sort(sortFn)
      data.extraMonsters = Object.values(data.extra).sort(sortFn)
      data.sideMonsters = Object.values(data.side).filter((v: any) => v.card.category === 'Monster').sort(sortFn)
      data.sideSpells = Object.values(data.side).filter((v: any) => v.card.category === 'Spell').sort(sortFn)
      data.sideTraps = Object.values(data.side).filter((v: any) => v.card.category === 'Trap').sort(sortFn)

        const mainYdk = []
        const sideYdk = []
        const extraYdk = []

        data.mainMonsters.forEach((el) => {
            const avg = Math.round(el.total / el.decks)
            for (let i = 0; i < avg; i++) mainYdk.push(el.card.konamiCode)
        })

        data.mainSpells.forEach((el) => {
            const avg = Math.round(el.total / el.decks)
            for (let i = 0; i < avg; i++) mainYdk.push(el.card.konamiCode)
        })

        data.mainTraps.forEach((el) => {
            const avg = Math.round(el.total / el.decks)
            for (let i = 0; i < avg; i++) mainYdk.push(el.card.konamiCode)
        })

        data.extraMonsters.forEach((el) => extraYdk.push(el.card.konamiCode))
        data.sideMonsters.forEach((el) => sideYdk.push(el.card.konamiCode))
        data.sideSpells.forEach((el) => sideYdk.push(el.card.konamiCode))
        data.sideTraps.forEach((el) => sideYdk.push(el.card.konamiCode))

        const ydk = ['created by...', '#main', ...mainYdk, '#extra', ...extraYdk, '!side', ...sideYdk, ''].join('\n')
        res.send(ydk)
    } catch (err) {
      console.log(err)
    }
  }

  
export const getDeckTypeSummary = async (req, res, next) => {
  try {
    const deckType = await DeckType.findOne({
        where: {
            cleanName: { [Op.iLike]: req.query.id.replaceAll('-', '_') }
        }
    })

    let format

    if (req.query.format) {
        format = await Format.findOne({
            where: {
                name: { [Op.iLike]: req.query.format.replaceAll('-', '_') }
            },
            attributes: ['id', 'name', 'banlist', 'date', 'icon', 'videoName', 'videoId', 'videoPlaylistId']
        })
    } else {
        const deckThumb = await DeckThumb.findOne({
            where: {
                deckTypeId: deckType.id,
                isPrimary: true
            }
        })
        
        format = await Format.findOne({
            where: {
                id: deckThumb.formatId
            },
            attributes: ['id', 'name', 'banlist', 'date', 'icon']
        })
    }

    const decks = await Deck.findAll({
        where: {
            deckTypeId: deckType.id,
            formatId: format.id,
            origin: 'event',
            eventId: { [Op.not]: null },
            '$event.isRepresentative$': true
        },
        attributes: ['id', 'eventId', 'deckTypeName', 'category', 'ydk', 'formatName'],
        include: { model: Event, attributes: ['id', 'isRepresentative']},
        order: [['publishDate', 'DESC']],
        limit: 100
    })

    const count = await Deck.count({
        where: {
            deckTypeId: deckType.id,
            formatId: format.id,
            origin: 'event',
            eventId: { [Op.not]: null }
        }
    })

    const mostRecent = await Deck.findOne({
        where: {
            deckTypeId: deckType.id,
            formatId: format.id,
            origin: 'event',
            eventId: { [Op.not]: null },
            display: true,
            '$event.isRepresentative$': true
        },
        attributes: ['id', 'builderName', 'eventAbbreviation', 'eventId', 'deckTypeName', 'downloads', 'views', 'publishDate', 'placement'],
        include: { model: Event, attributes: ['id', 'isRepresentative']},
        order: [['publishDate', 'DESC'], ['placement', 'ASC']]
    })

    const mostPopular = await Deck.findOne({
        where: {
            id: {[Op.not]: mostRecent?.id},
            deckTypeId: deckType.id,
            formatId: format.id,
            origin: 'event',
            eventId: { [Op.not]: null },
            display: true,
            '$event.isRepresentative$': true
        },
        attributes: ['id', 'builderName', 'eventAbbreviation', 'eventId', 'deckTypeName', 'downloads', 'views', 'placement'],
        include: { model: Event, attributes: ['id', 'isRepresentative']},
        order: [['downloads', 'DESC']]
    })

    const showExtra = format.date >= '2008-08-05' || !format.date
    const total = await Deck.count({ where: { origin: 'event', formatId: format.id }})

    const data = {
      percent: Math.round((count / total) * 100) || '<1',
      deckType: deckType.name,
      deckCategory: deckType.category,
      analyzed: 0,
      main: {},
      mainMonsters: [],
      mainSpells: [],
      mainTraps: [],
      extra: {},
      extraMonsters: [],
      side: {},
      sideMonsters: [],
      sideSpells: [],
      sideTraps: [],
      format: format,
      examples: [mostPopular, mostRecent]
    }

    for (let i = 0; i < decks.length; i++) {
        try {

            data.analyzed++
            const deck = decks[i]
      
            const mainKonamiCodes = deck.ydk
              ?.split('#main')[1]
              ?.split('#extra')[0]
              ?.split(/[\s]+/)
              ?.filter((e) => e.length)
              ?.map((e) => e.trim().replace(/^0+/, ''))
              || []
      
            const extraKonamiCodes = showExtra
              ? deck.ydk
                  ?.split('#extra')[1]
                  ?.split('!side')[0]
                  ?.split(/[\s]+/)
                  ?.filter((e) => e.length)
                  ?.map((e) => e.trim().replace(/^0+/, ''))
              : []
              
            const sideKonamiCodes = deck.ydk
              ?.split('!side')[1]
              ?.split(/[\s]+/)
              ?.filter((e) => e.length)
              ?.map((e) => e.trim().replace(/^0+/, ''))
              || []
      
            const main = mainKonamiCodes.reduce((acc, curr) => (acc[curr] ? acc[curr]++ : (acc[curr] = 1), acc), {})
            const extra = showExtra
              ? extraKonamiCodes.reduce((acc, curr) => (acc[curr] ? acc[curr]++ : (acc[curr] = 1), acc), {})
              : {}
            const side = sideKonamiCodes.reduce((acc, curr) => (acc[curr] ? acc[curr]++ : (acc[curr] = 1), acc), {})
      
            Object.entries(main).forEach((e) => {
              const konamiCode = e[0]
              const count = e[1]
              if (data.main[konamiCode]) {
                data.main[konamiCode][count] += 1
                data.main[konamiCode].decks += 1 
                data.main[konamiCode].total += count
              } else {
                data.main[konamiCode] = {
                  total: count,
                  decks: 1,
                  1: count === 1 ? 1 : 0,
                  2: count === 2 ? 1 : 0,
                  3: count === 3 ? 1 : 0
                }
              }
            })
      
            Object.entries(extra).forEach((e) => {
              const konamiCode = e[0]
              const count = e[1]
              if (data.extra[konamiCode]) {
                data.extra[konamiCode][count] += 1
                data.extra[konamiCode].decks += 1
                data.extra[konamiCode].total += count
              } else {
                data.extra[konamiCode] = {
                  total: count,
                  decks: 1,
                  1: count === 1 ? 1 : 0,
                  2: count === 2 ? 1 : 0,
                  3: count === 3 ? 1 : 0
                }
              }
            })
      
            Object.entries(side).forEach((e) => {
              const konamiCode = e[0]
              const count = e[1]
              if (data.side[konamiCode]) {
                data.side[konamiCode][count] += 1
                data.side[konamiCode].decks += 1
                data.side[konamiCode].total += count
              } else {
                data.side[konamiCode] = {
                  total: count,
                  decks: 1,
                  1: count === 1 ? 1 : 0,
                  2: count === 2 ? 1 : 0,
                  3: count === 3 ? 1 : 0
                }
              }
            })
        } catch (err) {
            console.log(err)
        }
    }

    const main = Object.entries(data.main)

    for (let j = 0; j < main.length; j++) {
      const e: any = main[j]
      if (e[1].decks < 0.25 * data.analyzed) {
        delete data.main[e[0]]
      } else {
        let konamiCode = e[0]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        const card =
          (await Card.findOne({
            where: {
              konamiCode
            },
            attributes: ['id', 'name', 'cleanName', 'category', 'artworkId']
          })) || {}

        if (!card) console.log(`no card: ${konamiCode}`)
        data.main[e[0]].card = card
      }
    }

    const extra = Object.entries(data.extra)

    for (let j = 0; j < extra.length; j++) {
      const e: any = extra[j]
      if (e[1].decks < 0.25 * data.analyzed) {
        delete data.extra[e[0]]
      } else {
        let konamiCode = e[0]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        const card =
          (await Card.findOne({
            where: {
              konamiCode
            },
            attributes: ['id', 'name', 'cleanName', 'category', 'artworkId']
          })) || {}

        if (!card) console.log(`no card: ${konamiCode}`)
        data.extra[e[0]].card = card
      }
    }

    const side = Object.entries(data.side)

    for (let j = 0; j < side.length; j++) {
      const e: any = side[j]
      if (e[1].decks < 0.25 * data.analyzed) {
        delete data.side[e[0]]
      } else {
        let konamiCode = e[0]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        const card =
          (await Card.findOne({
            where: {
              konamiCode
            },
            attributes: ['id', 'name', 'cleanName', 'category', 'artworkId']
          })) || {}

        if (!card) console.log(`no card: ${konamiCode}`)
        data.side[e[0]].card = card
      }
    }

    data.mainMonsters = Object.values(data.main)
      .filter((v: any) => v.card.category === 'Monster')
      .sort((a: any, b: any) => b.decks - a.decks)
    data.mainSpells = Object.values(data.main)
      .filter((v: any) => v.card.category === 'Spell')
      .sort((a: any, b: any) => b.decks - a.decks)
    data.mainTraps = Object.values(data.main)
      .filter((v: any) => v.card.category === 'Trap')
      .sort((a: any, b: any) => b.decks - a.decks)
    data.extraMonsters = Object.values(data.extra).sort((a: any, b: any) => b.decks - a.decks)
    data.sideMonsters = Object.values(data.side)
      .filter((v: any) => v.card.category === 'Monster')
      .sort((a: any, b: any) => b.decks - a.decks)
    data.sideSpells = Object.values(data.side)
      .filter((v: any) => v.card.category === 'Spell')
      .sort((a: any, b: any) => b.decks - a.decks)
    data.sideTraps = Object.values(data.side)
      .filter((v: any) => v.card.category === 'Trap')
      .sort((a: any, b: any) => b.decks - a.decks)

    return res.json(data)
  } catch (err) {
    console.log(err)
  }
}

export const getWinRateData = async (req, res, next) => {
    try {
        if (req.query.isSubscriber === 'true' || req.query.isAdmin === 'true') {
            const deckType = await DeckType.findOne({
                where: {
                    cleanName: {[Op.iLike]: req.query.id?.replaceAll('-', '_')}
                }
            })

            const format = await Format.findOne({
                where: {
                    cleanName: {[Op.iLike]: req.query.format?.replaceAll('-', '_')}
                }
            })

            if (!format) return res.json({})

            const wins = await Matchup.count({
                where: {
                    winningDeckTypeId: deckType.id,
                    losingDeckTypeId: {[Op.not]: deckType.id},
                    formatId: format.id
                }
            })

            const losses = await Matchup.count({
                where: {
                    winningDeckTypeId: {[Op.not]: deckType.id},
                    losingDeckTypeId: deckType.id,
                    formatId: format.id
                }
            })
            
            const firstPlaceRepresentation = await Deck.count({
                where: {
                    display: true,
                    placement: 1,
                    deckTypeId: deckType.id,
                    origin: 'event',
                    formatId: format?.id
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

            const tournamentCount = await Event.count({
                where: {
                    display: true,
                    formatId: format?.id
                }
            })

            const conversionRate = Math.round(topDeckRepresentation / deckRepresentation * 100)
            const overallWinRate = Math.round(wins / (wins + losses) * 100)
            const tournamentWinRate = Math.round(firstPlaceRepresentation / tournamentCount * 100)
            res.json({conversionRate, overallWinRate, tournamentWinRate})
        } else {
            return res.json({})
        }
    } catch (err) {
        console.log(err)
    }
}

export const createDeckType = async (req, res, next) => {
  try {
    const deckType =
      (await DeckType.findOne({
        where: {
          name: req.body.name
        }
      })) ||
      (await DeckType.create({
        name: req.body.name,
        cleanName: req.body.name.replaceAll('-', ' '),
        category: req.body.category
      }))

    const count = await DeckThumb.count({ where: { deckTypeName: req.body.name } })

    const deckThumb =
      (await DeckThumb.findOne({
        where: {
          deckTypeName: req.body.name,
          formatId: req.body.formatId
        }
      })) ||
      (await DeckThumb.create({
        deckTypeName: deckType.name,
        deckTypeId: deckType.id,
        formatName: req.body.formatName,
        formatId: req.body.formatId,
        iSPrimary: !!count
      }))

    ;(deckThumb.leftCard = req.body.leftCardName),
      (deckThumb.leftCardArtworkId = req.body.leftCardArtworkId),
      (deckThumb.centerCard = req.body.centerCardName),
      (deckThumb.centerCardArtworkId = req.body.centerCardArtworkId),
      (deckThumb.rightCard = req.body.rightCardName),
      (deckThumb.rightCardArtworkId = req.body.rightCardArtworkId),
      await deckThumb.save()

    if (!fs.existsSync(`https://cdn.formatlibrary.com/images/artworks/${deckThumb.leftCardArtworkId}.jpg`)) {
      try {
        const { data } = await axios({
          method: 'GET',
          url: `https://storage.googleapis.com/ygoprodeck.com/pics_artgame/${deckThumb.leftCardArtworkId}.jpg`,
          responseType: 'stream'
        })

        data.pipe(fs.createWriteStream(`https://cdn.formatlibrary.com/images/artworks/${deckThumb.leftCardArtworkId}.jpg`))
        console.log(
          `saved ${deckThumb.leftCard} artwork to ${`https://cdn.formatlibrary.com/images/artworks/${deckThumb.leftCardArtworkId}.jpg`}`
        )
      } catch (err) {
        console.log(err)
      }
    }

    if (!fs.existsSync(`https://cdn.formatlibrary.com/images/artworks/${deckThumb.centerCardArtworkId}.jpg`)) {
      try {
        const { data } = await axios({
          method: 'GET',
          url: `https://storage.googleapis.com/ygoprodeck.com/pics_artgame/${deckThumb.centerCardArtworkId}.jpg`,
          responseType: 'stream'
        })

        data.pipe(fs.createWriteStream(`https://cdn.formatlibrary.com/images/artworks/${deckThumb.centerCardArtworkId}.jpg`))
        console.log(
          `saved ${deckThumb.centerCard} artwork to ${`https://cdn.formatlibrary.com/images/artworks/${deckThumb.centerCardArtworkId}.jpg`}`
        )
      } catch (err) {
        console.log(err)
      }
    }

    if (!fs.existsSync(`https://cdn.formatlibrary.com/images/artworks/${deckThumb.rightCardArtworkId}.jpg`)) {
      try {
        const { data } = await axios({
          method: 'GET',
          url: `https://storage.googleapis.com/ygoprodeck.com/pics_artgame/${deckThumb.rightCardArtworkId}.jpg`,
          responseType: 'stream'
        })

        data.pipe(fs.createWriteStream(`https://cdn.formatlibrary.com/images/artworks/${deckThumb.rightCardArtworkId}.jpg`))
        console.log(
          `saved ${deckThumb.rightCard} artwork to ${`https://cdn.formatlibrary.com/images/artworks/${deckThumb.rightCardArtworkId}.jpg`}`
        )
      } catch (err) {
        console.log(err)
      }
    }

    return res.json(deckType)
  } catch (err) {
    next(err)
  }
}
