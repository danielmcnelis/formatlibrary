import { Card, Deck, DeckThumb, DeckType, Format, Player } from '@fl/models'
import { Op } from 'sequelize'
const FuzzySet = require('fuzzyset')

export const decksReadYdk = async (req, res, next) => {
    try {
        const main = []
        const extra = []
        const side = []
        const mainKonamiCodes = req.body.ydk
            .split('#main')[1]
            .split('#extra')[0]
            .split('\n')
            .filter((e) => e.length)
            .map((e) => e.trim())

        const extraKonamiCodes = req.body.ydk
            .split('#extra')[1]
            .split('!side')[0]
            .split('\n')
            .filter((e) => e.length)
            .map((e) => e.trim())

        const sideKonamiCodes = req.body.ydk
            .split('!side')[1]
            .split('\n')
            .filter((e) => e.length)
            .map((e) => e.trim())

        for (let i = 0; i < mainKonamiCodes.length; i++) {
            let konamiCode = mainKonamiCodes[i]
            while (konamiCode.length < 8) konamiCode = '0' + konamiCode
            const card = await Card.findOne({ 
                where: { 
                    konamiCode: konamiCode
                },
                attributes: ['name', 'id', 'konamiCode', 'ypdId', 'sortPriority'],
            })

            if (!card) continue
            main.push(card)
        }

        for (let i = 0; i < extraKonamiCodes.length; i++) {
            let konamiCode = extraKonamiCodes[i]
            while (konamiCode.length < 8) konamiCode = '0' + konamiCode
            const card = await Card.findOne({ 
                where: { 
                    konamiCode: konamiCode
                },
                attributes: ['name', 'id', 'konamiCode', 'ypdId', 'sortPriority'],
            })

            if (!card) continue
            extra.push(card)
        }

        for (let i = 0; i < sideKonamiCodes.length; i++) {
            let konamiCode = sideKonamiCodes[i]
            while (konamiCode.length < 8) konamiCode = '0' + konamiCode
            const card = await Card.findOne({ 
                where: { 
                    konamiCode: konamiCode
                },
                attributes: ['name', 'id', 'konamiCode', 'ypdId', 'sortPriority'],
            })
            
            if (!card) continue
            side.push(card)
        }

        const data = {
            name: req.body.name,
            main, 
            extra, 
            side
        }

        res.json(data)
    } catch (err) {
        console.log(err)
    }
}

export const decksDeleteId = async (req, res, next) => {
    try {
        const deck = await Deck.findOne({ 
            where: {
                id: req.params.id
            }
        })

        await deck.destroy()
        res.sendStatus(200)
    } catch (err) {
        console.log(err)
    }
}

export const decksUpdateId = async (req, res, next) => {
    try {
        const deck = await Deck.findOne({ 
            where: {
                id: req.params.id
            }
        })

        const legal = await Deck.verifyLegality(req.body.ydk, req.body.formatName, req.body.formatDate, req.body.formatBanlist, req.body.formatCategory)

        if (!legal) {
            res.sendStatus(409)
        } else {
            await deck.update({ 
                name: req.body.name,
                formatName: req.body.formatName,
                formatId: req.body.formatId,
                type: req.body.type,
                deckTypeId: req.body.deckTypeId,
                suggestedType: req.body.suggestedType,
                ydk: req.body.ydk
             })

            res.sendStatus(200)
        }
    } catch (err) {
        console.log(err)
    }
}

export const decksPublishId = async (req, res, next) => {
    try {
        const deck = await Deck.findOne({ 
            where: {
                id: req.params.id
            }
        })

        await deck.update({ display: true, publishDate: new Date() })
        res.sendStatus(200)
    } catch (err) {
        console.log(err)
    }
}

export const decksUnpublishId = async (req, res, next) => {
    try {
        const deck = await Deck.findOne({ 
            where: {
                id: req.params.id
            }
        })

        await deck.update({ display: false })
        res.sendStatus(200)
    } catch (err) {
        console.log(err)
    }
}

export const decksShareId = async (req, res, next) => {
    try { 
        const deck = await Deck.findOne({ 
            where: {
                id: req.params.id
            }
        })

        const shareLink = await Deck.generateShareLink()
        
        await deck.update({
            shareLink: shareLink,
            linkExpiration: req.body.linkExpiration
        })

        res.json({ shareLink })
    } catch (err) {
        console.log(err)
    }
}

export const decksBuilderId = async (req, res, next) => {
    try {
        const deck = await Deck.findOne({ 
            where: {
                id: req.params.id,
                eventName: null,
                eventId: null
            }, 
            attributes: ['id', 'name', 'url', 'ydk', 'builder', 'playerId', 'type', 'deckTypeId', 'suggestedType', 'formatName', 'formatId', 'display', 'shareLink', 'linkExpiration'],            
            include: [
                { model: Format, attributes: ['id', 'name', 'date', 'banlist', 'icon']},
                { model: Player, attributes: ['id', 'name', 'discriminator', 'discordId', 'discordPfp']}
            ],
        })

        const main = []
        const extra = []
        const side = []
        const mainKonamiCodes = deck.ydk
            .split('#main')[1]
            .split('#extra')[0]
            .split('\n')
            .filter((e) => e.length)
            .map((e) => e.trim())

        const extraKonamiCodes = deck.ydk
            .split('#extra')[1]
            .split('!side')[0]
            .split('\n')
            .filter((e) => e.length)

        const sideKonamiCodes = deck.ydk
            .split('!side')[1]
            .split('\n')
            .filter((e) => e.length)
            .map((e) => e.trim())

        for (let i = 0; i < mainKonamiCodes.length; i++) {
            let konamiCode = mainKonamiCodes[i]
            while (konamiCode.length < 8) konamiCode = '0' + konamiCode
            const card = await Card.findOne({ 
                where: { 
                    konamiCode: konamiCode
                },
                attributes: ['name', 'id',  'konamiCode', 'ypdId', 'sortPriority'],
            })

            if (!card) continue
            main.push(card)
        }

        for (let i = 0; i < extraKonamiCodes.length; i++) {
            let konamiCode = extraKonamiCodes[i]
            while (konamiCode.length < 8) konamiCode = '0' + konamiCode
            const card = await Card.findOne({ 
                where: { 
                    konamiCode: konamiCode
                },
                attributes: ['name', 'id',  'konamiCode', 'ypdId', 'sortPriority'],
            })

            if (!card) continue
            extra.push(card)
        }

        for (let i = 0; i < sideKonamiCodes.length; i++) {
            let konamiCode = sideKonamiCodes[i]
            while (konamiCode.length < 8) konamiCode = '0' + konamiCode
            const card = await Card.findOne({ 
                where: { 
                    konamiCode: konamiCode
                },
                attributes: ['name', 'id',  'konamiCode', 'ypdId', 'sortPriority'],
            })
            
            if (!card) continue
            side.push(card)
        }

        const data = {
            ...deck.dataValues, 
            main, 
            extra, 
            side
        }

        res.json(data)
    } catch (err) {
        next(err)
    }
}

export const decksMyDecks = async (req, res, next) => {
    const playerId = req.user?.playerId

    try {
        const player = await Player.findOne({
            where: {
                id: playerId
            }
        })

        if (!player) return res.json([])

        const decks = await Deck.findAll({ 
            where: {
                playerId: player.id,
                eventName: null,
                eventId: null
            },
            attributes: ['id', 'name', 'type', 'deckTypeId', 'formatName', 'formatId'],
            include: Format,
            order: [['name', 'ASC']]
        })

        return res.json(decks)
    } catch (err) {
        next(err)
    }
}

export const decksPopular = async (req, res, next) => {
  try {
    const format = await Format.findOne({
        where: {
            cleanName: {[Op.iLike]: req.params.format.replaceAll(' ', '_').replaceAll('-', '_')}
        }
    })
    const decks = await Deck.findAll({
      where: {
        formatId: format.id,
        type: { [Op.not]: 'Other' }
      },
      attributes: ['id', 'type']
    })

    if (!decks.length) return false

    const freqs = decks.reduce((acc, curr) => (acc[curr.type] ? acc[curr.type]++ : (acc[curr.type] = 1), acc), {})
    const names = Object.entries(freqs)
      .sort((a: never, b: never) => b[1] - a[1])
      .map((e) => e[0])
      .slice(0, 6)
    const data = []

    for (let i = 0; i < names.length; i++) {
      try {
        const name = names[i]
        const deckType = await DeckType.findOne({
          where: {
            name: name
          },
          attributes: ['name', 'id']
        })

        const deckThumb =
          (await DeckThumb.findOne({
            where: {
                formatId: format.id,
                deckTypeId: deckType.id
            },
            attributes: ['id', 'name', 'leftCardYpdId', 'centerCardYpdId', 'rightCardYpdId']
          })) ||
          (await DeckThumb.findOne({
            where: {
              primary: true,
              deckTypeId: deckType.id
            },
            attributes: ['id', 'name', 'leftCardYpdId', 'centerCardYpdId', 'rightCardYpdId']
          })) ||
          (await DeckThumb.findOne({
            where: {
              deckTypeId: deckType.id
            },
            attributes: ['id', 'name', 'leftCardYpdId', 'centerCardYpdId', 'rightCardYpdId']
          }))

        data.push({ ...deckType.dataValues, ...deckThumb.dataValues })
      } catch (err) {
        console.log(err)
      }
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const decksGallery = async (req, res, next) => {
  try {
    const format = await Format.findOne({
      where: {
        cleanName: { [Op.iLike]: req.params.format.replaceAll(' ', '_').replaceAll('-', '_') }
      },
      attributes: ['id', 'name', 'icon']
    })

    const decks = await Deck.findAll({
      where: {
        formatId: format.id,
        type: { [Op.not]: 'Other' },
        origin: 'event'
      },
      attributes: ['id', 'type', 'deckTypeId']
    })

    if (!decks.length) return false

    const freqs = decks.reduce((acc, curr) => (acc[curr.type] ? acc[curr.type]++ : (acc[curr.type] = 1), acc), {})
    const names = Object.entries(freqs)
      .sort((a: never, b: never) => b[1] - a[1])
      .filter((e, index) => e[1] >= 3 || index <= 5)
      .map((e) => e[0])
    const data = []

    for (let i = 0; i < names.length; i++) {
      try {
        const name = names[i]
        const deckType = await DeckType.findOne({
          where: {
            name: name
          },
          attributes: ['name', 'id']
        })

        const deckThumb =
          (await DeckThumb.findOne({
            where: {
              format: { [Op.iLike]: req.params.format },
              deckTypeId: deckType.id
            },
            attributes: ['id', 'name', 'leftCardYpdId', 'centerCardYpdId', 'rightCardYpdId']
          })) ||
          (await DeckThumb.findOne({
            where: {
              primary: true,
              deckTypeId: deckType.id
            },
            attributes: ['id', 'name', 'leftCardYpdId', 'centerCardYpdId', 'rightCardYpdId']
          })) ||
          (await DeckThumb.findOne({
            where: {
              deckTypeId: deckType.id
            },
            attributes: ['id', 'name', 'leftCardYpdId', 'centerCardYpdId', 'rightCardYpdId']
          }))

        data.push({ ...deckType.dataValues, ...deckThumb.dataValues })
      } catch (err) {
        console.log(err)
      }
    }

    res.json({
      decks: data,
      format: format
    })
  } catch (err) {
    next(err)
  }
}

export const decksFrequent = async (req, res, next) => {
  try {
    const decks = await Deck.findAll({
      where: {
        playerId: req.params.id,
        origin: 'event',
        type: { [Op.not]: 'Other' }
      },
      attributes: ['id', 'type', 'formatName']
    })

    if (!decks.length) return false

    const freqs = decks.reduce(
      (acc, curr) => (
        acc[`${curr.formatName}_${curr.type}`]
          ? acc[`${curr.formatName}_${curr.type}`]++
          : (acc[`${curr.formatName}_${curr.type}`] = 1),
        acc
      ),
      {}
    )
    const arr = Object.entries(freqs)
      .sort((a: never, b: never) => b[1] - a[1])
      .map((e) => e[0])
    const data = []
    const types = []

    for (let i = 0; i < arr.length; i++) {
      try {
        const elem = arr[i]
        const name = elem.slice(elem.indexOf('_') + 1)
        const format = elem.slice(0, elem.indexOf('_'))
        const deckType = await DeckType.findOne({
          where: {
            name: { [Op.iLike]: name }
          },
          attributes: ['id', 'name']
        })

        if (types.includes(deckType.id)) continue

        const deckThumb =
          (await DeckThumb.findOne({
            where: {
              deckTypeId: deckType.id,
              format: format
            },
            attributes: ['id', 'name', 'leftCardYpdId', 'centerCardYpdId', 'rightCardYpdId']
          })) ||
          (await DeckThumb.findOne({
            where: {
              deckTypeId: deckType.id,
              primary: true
            },
            attributes: ['id', 'name', 'leftCardYpdId', 'centerCardYpdId', 'rightCardYpdId']
          }))

        types.push(deckType.id)
        data.push({ ...deckType.dataValues, ...deckThumb.dataValues })
      } catch (err) {
        console.log(err)
      }
    }

    res.json(data.slice(0, 6))
  } catch (err) {
    next(err)
  }
}

export const decksPlayer = async (req, res, next) => {
  try {
    const decks = await Deck.findAll({
      where: {
        playerId: req.params.id,
        origin: 'event',
        display: true
      },
      attributes: ['placement', 'eventId', 'eventName', 'publishDate'],
      order: [
        ['placement', 'ASC'],
        ['publishDate', 'DESC']
      ]
    })

    return res.json(decks)
  } catch (err) {
    next(err)
  }
}

export const decksLike = async (req, res, next) => {
  try {
    const deck = await Deck.findOne({
      where: {
        id: req.params.id
      },
      attributes: ['id', 'display', 'rating']
    })

    deck.rating++
    await deck.save()
    return res.status(200).send('ok')
  } catch (err) {
    next(err)
  }
}

export const decksDownload = async (req, res, next) => {
    try {
      const deck = await Deck.findOne({
        where: {
          id: req.params.id
        },
        attributes: ['id', 'display', 'ydk', 'downloads']
      })
  
      deck.downloads++
      await deck.save()
      res.send(deck.ydk)
    } catch (err) {
      next(err)
    }
  }

const findCard = async (query, fuzzyCards) => {
    const fuzzy_search = fuzzyCards.get(query, null, 0.36) || []
	fuzzy_search.sort((a, b) => b[0] - a[0])
	if (!fuzzy_search[0]) return false
	const card_name = fuzzy_search[0][0] > 0.65 ? fuzzy_search[0][1] : ''
    return card_name
}

export const convertTextToYDK = async (req, res, next) => {
    try {
        const text = req.body.headers?.text?.trim() || ''
        const arr = text.replace(/^\s*[\n]/gm, '').split('\n')
        let ydk = 'created by...\n#main\n'
        let fileName = null
        const errors = []
        if (!arr.length) res.json({ydk, fileName, errors})

        const fuzzyCards = FuzzySet([], false)
        const cards = await Card.findAll()
        cards.forEach((card) => fuzzyCards.add(card.name))

    
        for (let i = 0; i < arr.length; i++) {
            const line = arr[i].toLowerCase().trim()
                        .replace(/[“”]/g, `"`)
                        .replace(/[‘’]/g, `'`)
                        .replace(/[–]/g, '-')

            const left = line?.split(' ')[0]
            const right = line.substring(line.indexOf(' '))?.trim()

            if (
                (
                    left === 'monster' || left === 'monster:' || left === 'monsters' || left === 'monsters:' || 
                    left === 'magic' || left === 'magic:' || left === 'magics' || left === 'magics:' || 
                    left === 'spell' ||  left === 'spell:' || left === 'spells' || left === 'spells:' || 
                    left === 'trap' || left === 'trap:' || left === 'traps' || left === 'traps:'
                ) && 
                (!isNaN(right) || right === '')
            ) {
                continue
            } else if (
                (left === 'side' || left === 'side:') && 
                (!isNaN(right) || right === '' || right.startsWith('deck') || right === 'deck:')
            ) {
                ydk += '!side\n'
                continue
            } else if (
                (
                    left === 'extra' || left === 'extra:' ||
                    left === 'fusion' || left === 'fusion:' || 
                    left === 'fusions' || left === 'fusions:'
                ) &&
                (!isNaN(right) || right === '' || right.startsWith('deck'))
            ) {
                ydk += '#extra\n'
                continue
            }
            
            let qty = Number((left?.match(/\d+/) || [])[0])
            const query = qty ? right : left + ' ' + right
            const card_name = await findCard(query, fuzzyCards) || ''
            const card = await Card.findOne({
                where: {
                    name: card_name
                }
            })
    
            if (card) { 
                let kc = card.konamiCode
                while (kc.slice(0, 1) === '00') kc = kc.slice(1)
                if (!qty) qty = 1
                while (qty) {
                    ydk += `${card.konamiCode}\n`
                    qty--
                }
            } else if (
                right === 'monster' || right === 'monster:' || right === 'monsters' || right === 'monsters:' || 
                right === 'magic' || right === 'magic:' || right === 'magics' || right === 'magics:' || 
                right === 'spell' || right === 'spell:' || right === 'spells' || right === 'spells:' || 
                right === 'trap' || right === 'trap:' || right === 'traps' || right === 'traps:'
            ) {
                continue
            } else if (
                !isNaN(qty) && (
                    right === 'side' || right === 'side:' || 
                    right === 'side deck' || right === 'side deck:'
                )
            ) {
                ydk += '!side\n'
                continue
            } else if (
                !isNaN(qty) && (
                    right === 'fusion' || right === 'fusion:' || 
                    right === 'fusions' || right === 'fusions:' || 
                    right === 'fusion deck' || right === 'fusion deck:' || 
                    right === 'extra' || right === 'extra:' || 
                    right === 'extras' || right === 'extras:' ||
                    right === 'extra deck' || right === 'extra deck:'
                )
            ) {
                ydk += '#extra\n'
                continue
            } else if (i === 0) {
                fileName = arr[i].replace(/[^A-Za-z0-9\s]/g, '') + '.ydk'
                continue
            } else {
                errors.push(line)
            }
        }

        const split = ydk.split('\n')
        const extraIndex = split.indexOf('#extra')
        const sideIndex = split.indexOf('!side')

        if (sideIndex < extraIndex) {
            const main = split.slice(0, sideIndex)
            const side = split.slice(sideIndex, extraIndex)
            const extra = split.slice(extraIndex, -1)
            const repaired = [...main, ...extra, ...side, '']
            ydk = repaired.join('\n')
        }
    
        res.json({ydk, fileName, errors})
    } catch (err) {
        next(err)
    }
}

export const countDecks = async (req, res, next) => {
    try {
        const isAdmin = req.query.isAdmin
        const isSubscriber = req.query.isSubscriber
        const display = isAdmin === 'true' ? { display: {operator: 'or', value: [true, false]} } :
            isSubscriber === 'true' ? { publishDate: {operator: 'not', value: null }} :
            { display: {operator: 'eq', value: true} }

        const filter = req.query.filter ? req.query.filter.split(',').reduce((reduced, val) => {
            let [field, operator, value] = val.split(':')
            if (value.startsWith('arr(') && value.endsWith(')')) value = (value.slice(4, -1)).split(';')
            reduced[field] = {operator, value}
            return reduced
        }, display) : display

        const count = await Deck.countResults(filter)
        res.json(count)
    } catch (err) {
        next(err)
    }
}

export const getDecks = async (req, res, next) => {
    try {
        const isAdmin = req.query.isAdmin
        const isSubscriber = req.query.isSubscriber
        const limit = parseInt(req.query.limit || 10)
        const page = parseInt(req.query.page || 1)
        const display = isAdmin === 'true' ? { display: {operator: 'or', value: [true, false]} } :
            isSubscriber === 'true' ? { publishDate: {operator: 'not', value: null }} :
            { display: {operator: 'eq', value: true} }

        const filter = req.query.filter ? req.query.filter.split(',').reduce((reduced, val) => {
            let [field, operator, value] = val.split(':')
            if (value.startsWith('arr(') && value.endsWith(')')) value = (value.slice(4, -1)).split(';')
            reduced[field] = {operator, value}
            return reduced
        }, display) : display

        const sort = req.query.sort?.split(',').reduce((reduced, val) => {
            const [field, value] = val.split(':')
            reduced.push([field, value])
            return reduced
        }, [])

        const decks = await Deck.find(filter, limit, page, sort)
        res.json(decks)
    } catch (err) {
        next(err)
    }
}

export const decksId = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const shareLink = req.params.id
    const isAdmin = req.query.isAdmin
    const isSubscriber = req.query.isSubscriber
    
    const deck = await Deck.findOne({
        where: !isNaN(id) && isAdmin === 'true' ? {
            id: id
        } : !isNaN(id) && isSubscriber === 'true' ? {
            id: id,
            publishDate: {[Op.not]: null}
        } : !isNaN(id) ? {
            id: id,
            display: true,
        } : {
            shareLink: shareLink,
            linkExpiration: {[Op.gte]: new Date()}
        },
        attributes: [
            'id',
            'name',
            'ydk',
            'builder',
            'playerId',
            'type',
            'category',
            'formatName',
            'formatId',
            'community',
            'eventName',
            'eventId',
            'publishDate',
            'placement',
            'downloads',
            'views',
            'rating'
        ],
        include: [
            { model: Format, attributes: ['id', 'name', 'icon', 'banlist'] },
            { model: Player, attributes: ['id', 'name', 'discriminator', 'discordName', 'discordId', 'discordPfp'] }
        ]
    })

    if (!deck) return res.sendStatus(404)

    const main = []
    const extra = []
    const side = []
    const mainKonamiCodes = deck.ydk
      .split('#main')[1]
      .split('#extra')[0]
      .split('\n')
      .filter((e) => e.length)
      .map((e) => e.trim())

    const extraKonamiCodes = deck.ydk
      .split('#extra')[1]
      .split('!side')[0]
      .split('\n')
      .filter((e) => e.length)
      .map((e) => e.trim())

    const sideKonamiCodes = deck.ydk
      .split('!side')[1]
      .split('\n')
      .filter((e) => e.length)
      .map((e) => e.trim())

    for (let i = 0; i < mainKonamiCodes.length; i++) {
      let konamiCode = mainKonamiCodes[i]
      while (konamiCode.length < 8) konamiCode = '0' + konamiCode
      const card = await Card.findOne({
        where: {
          konamiCode: konamiCode
        },
        attributes: ['name', 'id', 'ypdId', 'sortPriority']
      })

      if (!card) continue
      main.push(card)
    }

    const sortFn = (a, b) => {
      if (a.sortPriority > b.sortPriority) {
        return 1
      } else if (b.sortPriority > a.sortPriority) {
        return -1
      } else if (a.name > b.name) {
        return 1
      } else if (b.name > a.name) {
        return -1
      } else {
        return 0
      }
    }

    main.sort(sortFn)

    for (let i = 0; i < extraKonamiCodes.length; i++) {
      let konamiCode = extraKonamiCodes[i]
      while (konamiCode.length < 8) konamiCode = '0' + konamiCode
      const card = await Card.findOne({
        where: {
          konamiCode: konamiCode
        },
        attributes: ['name', 'id', 'ypdId', 'sortPriority']
      })

      if (!card) continue
      extra.push(card)
    }

    extra.sort(sortFn)

    for (let i = 0; i < sideKonamiCodes.length; i++) {
      let konamiCode = sideKonamiCodes[i]
      while (konamiCode.length < 8) konamiCode = '0' + konamiCode
      const card = await Card.findOne({
        where: {
          konamiCode: konamiCode
        },
        attributes: ['name', 'id', 'ypdId', 'sortPriority']
      })

      if (!card) continue
      side.push(card)
    }

    side.sort(sortFn)

    deck.views++
    await deck.save()

    const data = {
      ...deck.dataValues,
      main,
      extra,
      side
    }

    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const convertYDKeToYDK = async (req, res, next) => {
    try {
        const ydke = req.body.ydke
        const [mainEncoded, extraEncoded, sideEncoded] = ydke.slice(7).split('!')
        
        const decodeBase64 = (encoded = '') => {
            const data = Buffer.from(encoded, 'base64')
            const dataArr = Object.values(data)
            const decodedArr = []
        
            for (let i = 0; i < dataArr.length; i += 4) {
              decodedArr.push(
                    (dataArr[i] <<  0) | 
                    (dataArr[i+1] <<  8) | 
                    (dataArr[i+2] <<  16) | 
                    (dataArr[i+3] <<  24)
                )
            }
        
            return decodedArr.join('\n')
        }
    
        const main = decodeBase64(mainEncoded)
        const side = decodeBase64(sideEncoded)
        const extra = decodeBase64(extraEncoded)
        const ydk = 'created by...\n#main\n' + main + '\n#extra\n' + extra + '\n!side\n' + side + '\n'

        res.send(ydk)
    } catch (err) {
        next(err)
    }
} 

export const decksCreate = async (req, res, next) => {
  try {
    const format = await Format.findOne({ where: { name: { [Op.iLike]: req.body.format || req.body.formatName } } })
    const player = await Player.findOne({ where: { id: req.body.playerId } })
    
    const deck = await Deck.create({
      builder: player.name,
      playerId: player.id,
      name: req.body.name,
      type: req.body.type,
      suggestedType: req.body.suggestedType,
      deckTypeId: req.body.deckTypeId,
      category: req.body.category,
      formatName: format.name,
      formatId: format.id,
      ydk: req.body.ydk,
      eventName: req.body.eventName,
      eventId: req.body.eventId,
      origin: req.body.origin,
      publishDate: req.body.publishDate,
      placement: req.body.placement,
      community: req.body.community,
      display: req.body.display
    })

    res.json(deck)
  } catch (err) {
    console.log('err', err)
    next(err)
  }
}
