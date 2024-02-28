import { Card, Status } from '@fl/models'
import {Op} from 'sequelize'

export const banlistsAll = async (req, res, next) => {
  try {
    const category = req.query?.category || 'TCG'
    const onlyUnique = (value, index, self) => self.indexOf(value) === index
    const banlists = [...(await Status.findAll({ where: { category }}))]
      .map((s) => s.banlist)
      .filter(onlyUnique)
      .sort()

    res.json(banlists)
  } catch (err) {
    next(err)
  }
}

export const banlistsDate = async (req, res, next) => {
  try {
    const date = req.params?.date?.replaceAll('-', ' ')
    const category = req.query?.category || 'TCG'

    const forbidden = await Status.findAll({
      where: {
        banlist: {[Op.iLike]: date},
        category: category,
        restriction: 'forbidden'
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ model: Card, attributes: ['id', 'name', 'ypdId', 'sortPriority'] }],
      order: [
        [Card, 'sortPriority', 'ASC'],
        ['name', 'ASC']
      ]
    })

    const limited = await Status.findAll({
      where: {
        banlist: {[Op.iLike]: date},
        category: category,
        restriction: 'limited'
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ model: Card, attributes: ['id', 'name', 'ypdId', 'sortPriority'] }],
      order: [
        [Card, 'sortPriority', 'ASC'],
        ['name', 'ASC']
      ]
    })

    const semiLimited = await Status.findAll({
        where: {
            banlist: {[Op.iLike]: date},
            category: category,
            restriction: 'semi-limited'
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [{ model: Card, attributes: ['id', 'name', 'ypdId', 'sortPriority'] }],
        order: [
          [Card, 'sortPriority', 'ASC'],
          ['name', 'ASC']
        ]
      })

    const unlimited = await Status.findAll({
      where: {
        banlist: {[Op.iLike]: date},
        category: category,
        restriction: 'no longer on list'
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ model: Card, attributes: ['id', 'name', 'ypdId', 'sortPriority'] }],
      order: [
        [Card, 'sortPriority', 'ASC'],
        ['name', 'ASC']
      ]
    })

    const limited1 = await Status.findAll({
        where: {
            banlist: {[Op.iLike]: date},
            category: category,
            restriction: 'limited-1'
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [{ model: Card, attributes: ['id', 'name', 'ypdId', 'sortPriority'] }],
        order: [
          [Card, 'sortPriority', 'ASC'],
          ['name', 'ASC']
        ]
      })

      
    const limited2 = await Status.findAll({
        where: {
            banlist: {[Op.iLike]: date},
            category: category,
            restriction: 'limited-2'
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [{ model: Card, attributes: ['id', 'name', 'ypdId', 'sortPriority'] }],
        order: [
          [Card, 'sortPriority', 'ASC'],
          ['name', 'ASC']
        ]
      })

      
    const limited3 = await Status.findAll({
        where: {
            banlist: {[Op.iLike]: date},
            category: category,
            restriction: 'limited-3'
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [{ model: Card, attributes: ['id', 'name', 'ypdId', 'sortPriority'] }],
        order: [
          [Card, 'sortPriority', 'ASC'],
          ['name', 'ASC']
        ]
      })
  
    const banlist = {
      id: date,
      forbidden: forbidden,
      limited: limited,
      semiLimited: semiLimited,
      unlimited: unlimited,
      limited1: limited1,
      limited2: limited2,
      limited3: limited3
    }

    res.json(banlist)
  } catch (err) {
    next(err)
  }
}

export const banlistsSimpleDate = async (req, res, next) => {
  try {
    const {date} = req.params
    const category = req.query?.category || 'TCG'

    const statuses = [
      ...(await Status.findAll({
        where: {
          banlist: date,
          category: category
        },
        attributes: ['cardId', 'restriction']
      }))
    ].map((s) => [s.cardId, s.restriction])

    const banlist = Object.fromEntries(statuses)
    res.json(banlist)
  } catch (err) {
    next(err)
  }
}

export const banlistsCreate = async (req, res, next) => {
  try {
    const {month, year, changes, category} = req.body
    const banlist = `${month}${year}`
    let b = 0

    for (let i = 0; i < changes.length; i++) {
      try {
        const c = changes[i]
        const card = await Card.findOne({ where: { name: c.name } })
        await Status.create({
          name: c.name,
          restriction: c.newStatus,
          banlist: banlist,
          category: category,
          cardId: card.id
        })

        b++
      } catch (err) {
        console.log(err)
      }
    }

    const prevStatuses = await Status.findAll({
      where: {
        banlist: req.body.previous,
        category: category
      }
    })

    for (let i = 0; i < prevStatuses.length; i++) {
      const ps = prevStatuses[i]
      const count = await Status.count({
        where: {
          name: ps.name,
          category: category,
          banlist: banlist
        }
      })

      if (!count) {
        try {
          await Status.create({
            name: ps.name,
            restriction: ps.restriction,
            cardId: ps.cardId,
            banlist: banlist,
            category: category
          })

          b++
        } catch (err) {
          console.log(err)
        }
      }
    }

    res.json(b)
  } catch (err) {
    next(err)
  }
}
