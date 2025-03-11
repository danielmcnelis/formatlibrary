import { Card, Format, Price, Print, Ruling, Set, Status } from '@fl/models'
import { Op } from 'sequelize'
import * as fs from 'fs'

export const getCardsByPartialName = async (req, res, next) => {
  try {
    const cards = await Card.findAll({
      where: {
        name: { [Op.iLike]: '%' + req.params.query + '%'}
      },
      attributes: ['name', 'cleanName', 'artworkId'],
      order: [['name', 'ASC']]
    })

    res.json(cards)
  } catch (err) {
    next(err)
  }
}

export const countCards = async (req, res, next) => {
    try {
        const booster = req.query.booster

        const filter = req.query.filter ? req.query.filter.split(',').reduce((reduced, val) => {
            let [field, operator, value] = val.split(':')
            if (value.startsWith('arr(') && value.endsWith(')')) value = (value.slice(4, -1)).split(';')
            reduced[field] = {operator, value}
            return reduced
        }, {}) : {}

        const count = await Card.countResults(filter, booster)
        res.json(count)
    } catch (err) {
        next(err)
    }
}

export const getCards = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit || 10)
        if (limit > 100) return res.json({})
        const page = parseInt(req.query.page || 1)
        const booster = req.query.booster

        const filter = req.query.filter ? req.query.filter.split(',').reduce((reduced, val) => {
            let [field, operator, value] = val.split(':')
            if (value.startsWith('arr(') && value.endsWith(')')) value = (value.slice(4, -1)).split(';')
            reduced[field] = {operator, value}
            return reduced
        }, {}) : {}
        
        if (req.headers.name) filter.name = {operator: 'inc', value: req.headers.name}
        if (req.headers.description) filter.description = {operator: 'inc', value: req.headers.description}

        const sort = req.query.sort ? req.query.sort.split(',').reduce((reduced, val) => {
            const [field, value] = val.split(':')
            reduced.push([field, value])
            return reduced
        }, []) : []

        sort.push(['name', 'asc'])
        const cards = await Card.find(filter, booster, limit, page, sort)
        res.json(cards)
    } catch (err) {
        next(err)
    }
}

// GET CARD BY ID
export const getCardById = async (req, res, next) => {
    const id = req.params.id.replaceAll('%2F', '/')
        .replaceAll('%3F', '?')
        .replaceAll('%23', '#')
        .replaceAll('%25', '%')
        .replaceAll('%26', '&')
        .replaceAll('-', ' ')
        .replaceAll('   ', ' - ')

    try {
        const card = await Card.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: id},
                    cleanName: {[Op.iLike]: id}
                }
            },
            attributes: { exclude: ['konamiCode', 'isTcgLegal', 'isOcgLegal', 'createdAt', 'updatedAt'] }
        })

        const statuses =
        (
            await Status.findAll({
            where: {
                cardId: card.id,
                category: 'TCG'
            },
            attributes: { exclude: ['createdAt', 'updatedAt'] }
            })
        ).map((s) => [s.banlist, s.restriction]) || []

        const prints = await Print.findAll({
            where: {
                cardId: card.id
            },
            attributes: { exclude: ['tcgPlayerProductId', 'description', 'createdAt', 'updatedAt'] },
            include: [{ model: Set, attributes: ['releaseDate', 'legalDate'] }],
            order: [[Set, 'releaseDate', 'ASC']]
        })

        const minRarityPrint = await Print.findOne({ where: { cardId: card.id, isMinRarity: true }, attributes: ['id', 'rarity', 'cardCode', 'unlimitedPrice', 'firstEditionPrice', 'limitedPrice']})
        const medianRarityPrint = await Print.findOne({ where: { cardId: card.id, isMedianRarity: true }, attributes: ['id', 'rarity', 'cardCode', 'unlimitedPrice', 'firstEditionPrice', 'limitedPrice']})
        const maxRarityPrint = await Print.findOne({ where: { cardId: card.id, isMaxRarity: true }, attributes: ['id', 'rarity', 'cardCode', 'unlimitedPrice', 'firstEditionPrice', 'limitedPrice']})

        const genericRulings = await Ruling.findAll({
            where: {
                cardId: card.id,
                formatId: null
            },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            order: [['id', 'ASC']]
        })

        const additionalRulings = await Ruling.findAll({
            where: {
                cardId: card.id,
                formatId: {[Op.not]: null}
            },
            include: Format,
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            order: [[Format, 'date', 'ASC'], ['id', 'ASC']]
        })
        
        const oneYearAgo = new Date(Date.now() - (550 * 24 * 60 * 60 * 1000))
 
        // @ts-ignore
        const lowestCurrentPrice = Math.min(...[minRarityPrint?.unlimitedPrice, minRarityPrint?.firstEditionPrice, minRarityPrint?.limitedPrice].filter((el) => el !== null))
        const minRarityEditionToFind = minRarityPrint?.firstEditionPrice === lowestCurrentPrice ? '1st Edition' :
            minRarityPrint?.limitedPrice === lowestCurrentPrice ? 'Limited' :
            'Unlimited'

        const minRarityPrices = minRarityPrint?.id ? [...await Price.findAll({
            where: {
                printId: minRarityPrint?.id,
                createdAt: {[Op.gte]: oneYearAgo},
                edition: minRarityEditionToFind
            },
            order: [['createdAt', 'ASC']]
        })].map((p) => p.usd) : []

        const currentMedianRarityPricesOfAllEditions = [medianRarityPrint?.unlimitedPrice, medianRarityPrint?.firstEditionPrice, medianRarityPrint?.limitedPrice].filter((el) => el !== null).sort()
        const medianCurrentPrice = currentMedianRarityPricesOfAllEditions[Math.floor(currentMedianRarityPricesOfAllEditions.length / 2)]
        const medianRarityEditionToFind = medianRarityPrint?.firstEditionPrice === medianCurrentPrice ? '1st Edition' :
            medianRarityPrint?.limitedPrice === medianCurrentPrice ? 'Limited' :
            'Unlimited'

        const medianRarityPrices = medianRarityPrint?.id ? [...await Price.findAll({
            where: {
                printId: medianRarityPrint?.id,
                createdAt: {[Op.gte]: oneYearAgo},
                edition: medianRarityEditionToFind
            },
            include: Print,
            order: [['createdAt', 'ASC']]
        })].map((p) => p.usd) : []
        
        // @ts-ignore
        const highestCurrentPrice = Math.max(...[maxRarityPrint?.unlimitedPrice, maxRarityPrint?.firstEditionPrice, maxRarityPrint?.limitedPrice].filter((el) => el !== null))
        const maxRarityEditionToFind = maxRarityPrint?.firstEditionPrice === highestCurrentPrice ? '1st Edition' :
            maxRarityPrint?.limitedPrice === highestCurrentPrice ? 'Limited' :
            'Unlimited'

        const maxRarityPrices =  maxRarityPrint?.id ? [...await Price.findAll({
            where: {
                printId: maxRarityPrint?.id,
                createdAt: {[Op.gte]: oneYearAgo},
                edition: maxRarityEditionToFind
            },
            include: Print,
            order: [['createdAt', 'ASC']]
        })].map((p) => p.usd) : []

        const minRarityMonthlyChange = minRarityPrices[-1] - minRarityPrices[-30]
        const medianRarityMonthlyChange = medianRarityPrices[-1] - medianRarityPrices[-30]
        const maxRarityMonthlyChange = maxRarityPrices[-1] - maxRarityPrices[-30]

        const minRarityYearlyChange = minRarityPrices[-1] - minRarityPrices[0]
        const medianRarityYearlyChange = medianRarityPrices[-1] - medianRarityPrices[0]
        const maxRarityYearlyChange = maxRarityPrices[-1] - maxRarityPrices[0]

        const specificRulings = {}

        for (let i = 0; i < additionalRulings.length; i++) {
            const additionalRuling = additionalRulings[i]
            const formatName = additionalRuling.formatName
            specificRulings[formatName] ? specificRulings[formatName] = [...specificRulings[formatName], additionalRuling] : specificRulings[formatName] = [additionalRuling]
        }

        const info = {
            card,
            statuses: Object.fromEntries(statuses),
            prints: prints || [],
            rulings: {
                generic: genericRulings || [],
                specific: specificRulings || {}
            },
            prices: {
                minRarityPrint,
                medianRarityPrint,
                maxRarityPrint,
                minRarityMonthlyChange,
                medianRarityMonthlyChange,
                maxRarityMonthlyChange,
                minRarityYearlyChange,
                medianRarityYearlyChange,
                maxRarityYearlyChange,
                minRarityPrices,
                medianRarityPrices,
                maxRarityPrices
            }
        }

        res.json(info)
    } catch (err) {
        next(err)
    }
}

export const updateCard = async (req, res, next) => {
    try {
        const card = await Card.findOne({
            where: {
                id: req.query.id
            }
        })

        await card.update({ ...req.body })
        res.json(card)
    } catch (err) {
    next(err)
    }
}

export const createCard = async (req, res, next) => {
    try {
        if (req.body.image) {
            const buffer = req.body.image
            .replace(/^data:image\/jpg;base64,/, '')
            .replace(/^data:image\/jpeg;base64,/, '')
            .replace(/^data:image\/png;base64,/, '')            
            fs.writeFileSync(`https://cdn.formatlibrary.com/images/cards/${req.body.artworkId}.jpg`, buffer, 'base64')
        }

        const alreadyExists = await Card.count({
            where: {
                [Op.or]: [
                    { name: req.body.name },
                    { konamiCode: req.body.konamiCode },
                    { ypdId: req.body.ypdId.toString() },
                    { artworkId: req.body.artworkId.toString() }
                ]
            }
        })

        if (alreadyExists) throw new Error('This card already exists')

        const card = await Card.create({
            name: req.body.name,
            cleanName: req.body.name.replaceAll(/['"]/g, '').split(/[^A-Za-z0-9]/).filter((e) => e.length).join(' '),
            description: req.body.description,
            konamiCode: req.body.konamiCode,
            ypdId: req.body.ypdId.toString(),
            artworkId: req.body.artworkId.toString(),
            tcgDate: req.body.tcgDate,
            ocgDate: req.body.ocgDate,
            isTcgLegal: req.body.isTcgLegal,
            isOcgLegal: req.body.isOcgLegal,
            category: req.body.category,
            icon: req.body.icon,
            attribute: req.body.attribute,
            type: req.body.type,
            atk: req.body.atk,
            def: req.body.def,
            level: req.body.level,
            rating: req.body.rating,
            scale: req.body.scale,
            arrows: req.body.arrows,
            isNormal: req.body.isNormal,
            isEffect: req.body.isEffect,
            isFusion: req.body.isFusion,
            isRitual: req.body.isRitual,
            isSynchro: req.body.isSynchro,
            isXyz: req.body.isXyz,
            isPendulum: req.body.isPendulum,
            isLink: req.body.isLink,
            isFlip: req.body.isFlip,
            isGemini: req.body.isGemini,
            isSpirit: req.body.isSpirit,
            isToon: req.body.isToon,
            isTuner: req.body.isTuner,
            isUnion: req.body.isUnion,
            color: req.body.color,
            isExtraDeck: req.body.isExtraDeck,
            sortPriority: req.body.sortPriority
        })

        res.json(card)
    } catch (err) {
    next(err)
    }
}