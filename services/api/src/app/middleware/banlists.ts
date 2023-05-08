import { Card, Status } from '@fl/models'

export const banlistsAll = async (req, res, next) => {
  try {
    const onlyUnique = (value, index, self) => self.indexOf(value) === index
    const banlists = [...(await Status.findAll())]
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
    const date = req.params.date
    const forbidden = await Status.findAll({
      where: {
        banlist: date,
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
        banlist: date,
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
          banlist: date,
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
        banlist: date,
        restriction: 'no longer on list'
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ model: Card, attributes: ['id', 'name', 'ypdId', 'sortPriority'] }],
      order: [
        [Card, 'sortPriority', 'ASC'],
        ['name', 'ASC']
      ]
    })

    const banlist = {
      forbidden: forbidden,
      limited: limited,
      semiLimited: semiLimited,
      unlimited: unlimited
    }

    res.json(banlist)
  } catch (err) {
    next(err)
  }
}

export const banlistsSimpleDate = async (req, res, next) => {
  try {
    const date = req.params.date
    const statuses = [
      ...(await Status.findAll({
        where: {
          banlist: date
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
    const changes = req.body.changes
    const banlist = `${req.body.month}${req.body.year}`
    let b = 0

    for (let i = 0; i < changes.length; i++) {
      try {
        const c = changes[i]
        const card = await Card.findOne({ where: { name: c.name } })
        await Status.create({
          name: c.name,
          restriction: c.newStatus,
          banlist: banlist,
          cardId: card.id
        })

        b++
      } catch (err) {
        console.log(err)
      }
    }

    const prevStatuses = await Status.findAll({
      where: {
        banlist: req.body.previous
      }
    })

    for (let i = 0; i < prevStatuses.length; i++) {
      const ps = prevStatuses[i]
      const count = await Status.count({
        where: {
          name: ps.name,
          banlist: banlist
        }
      })

      if (!count) {
        try {
          await Status.create({
            name: ps.name,
            restriction: ps.restriction,
            cardId: ps.cardId,
            banlist: banlist
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
