import { Card, Format, Print, Ruling, Set, Status } from '@fl/models'
import { Op } from 'sequelize'
import * as fs from 'fs'

export const cardsQuery = async (req, res, next) => {
  try {
    const cards = await Card.findAll({
      where: {
        name: { [Op.substring]: req.params.query }
      },
      attributes: ['name', 'cleanName', 'artworkId'],
      order: [['name', 'ASC']]
    })

    res.json(cards)
  } catch (err) {
    next(err)
  }
}

export const cardsCount = async (req, res, next) => {
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

export const cards = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit || 10)
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

export const cardsId = async (req, res, next) => {
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
            attributes: { exclude: ['konamiCode', 'tcgLegal', 'ocgLegal', 'createdAt', 'updatedAt'] }
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
        attributes: { exclude: ['tcgPlayerProductId', 'createdAt', 'updatedAt'] },
        include: [{ model: Set, attributes: ['tcgDate'] }],
        order: [[Set, 'tcgDate', 'ASC']]
        })

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

        const specificRulings = {}

        for (let i = 0; i < additionalRulings.length; i++) {
            const additionalRuling = additionalRulings[i]
            const formatName = additionalRuling.formatName
            specificRulings[formatName] ? specificRulings[formatName] = [...specificRulings[formatName], additionalRuling] : specificRulings[formatName] = [additionalRuling]
        }

        const info = {
            card: card,
            statuses: Object.fromEntries(statuses),
            prints: prints || [],
            rulings: {
                generic: genericRulings || [],
                specific: specificRulings || {}
            }
        }

        res.json(info)
    } catch (err) {
        next(err)
    }
}

export const updateCardInfo = async (req, res, next) => {
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

export const cardsCreate = async (req, res, next) => {
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
            tcgLegal: req.body.tcgLegal,
            ocgLegal: req.body.ocgLegal,
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
            normal: req.body.normal,
            effect: req.body.effect,
            fusion: req.body.fusion,
            ritual: req.body.ritual,
            synchro: req.body.synchro,
            xyz: req.body.xyz,
            pendulum: req.body.pendulum,
            link: req.body.link,
            flip: req.body.flip,
            gemini: req.body.gemini,
            spirit: req.body.spirit,
            toon: req.body.toon,
            tuner: req.body.tuner,
            union: req.body.union,
            color: req.body.color,
            extraDeck: req.body.extraDeck,
            sortPriority: req.body.sortPriority
        })

        res.json(card)
    } catch (err) {
    next(err)
    }
}