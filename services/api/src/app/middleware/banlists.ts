import { Card, Status } from '@fl/models'
import {Op} from 'sequelize'

export const getAllBanlists = async (req, res, next) => {
  try {
    const category = req.query?.category || 'TCG'
    const onlyUnique = (value, index, self) => self.indexOf(value) === index
    const banlists = [...(await Status.findAll({ 
            where: {
                category: {[Op.iLike]: category}
            }
        }
    ))]
      .map((s) => s.banlist)
      .filter(onlyUnique)
      .sort()

    res.json(banlists)
  } catch (err) {
    next(err)
  }
}

export const getBanlistByDate = async (req, res, next) => {
  try {
    const date = req.params?.date?.replaceAll('-', ' ')
    const category = req.query?.category || 'TCG'

    const forbidden = await Status.findAll({
      where: {
        banlist: {[Op.iLike]: date},
        category: {[Op.iLike]: category},
        restriction: 'forbidden'
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ model: Card, attributes: ['id', 'name', 'cleanName', 'artworkId', 'sortPriority'] }],
      order: [
        [Card, 'sortPriority', 'ASC'],
        ['cardName', 'ASC']
      ]
    })

    const limited = await Status.findAll({
      where: {
        banlist: {[Op.iLike]: date},
        category: {[Op.iLike]: category},
        restriction: 'limited'
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ model: Card, attributes: ['id', 'name', 'cleanName', 'artworkId', 'sortPriority'] }],
      order: [
        [Card, 'sortPriority', 'ASC'],
        ['cardName', 'ASC']
      ]
    })

    const semiLimited = await Status.findAll({
        where: {
            banlist: {[Op.iLike]: date},
            category: {[Op.iLike]: category},
            restriction: 'semi-limited'
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [{ model: Card, attributes: ['id', 'name', 'cleanName', 'artworkId', 'sortPriority'] }],
        order: [
          [Card, 'sortPriority', 'ASC'],
          ['cardName', 'ASC']
        ]
      })

    const unlimited = await Status.findAll({
      where: {
        banlist: {[Op.iLike]: date},
        category: {[Op.iLike]: category},
        restriction: 'no longer on list'
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ model: Card, attributes: ['id', 'name', 'cleanName', 'artworkId', 'sortPriority'] }],
      order: [
        [Card, 'sortPriority', 'ASC'],
        ['cardName', 'ASC']
      ]
    })

    const limited1 = await Status.findAll({
        where: {
            banlist: {[Op.iLike]: date},
            category: {[Op.iLike]: category},
            restriction: 'limited-1'
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [{ model: Card, attributes: ['id', 'name', 'cleanName', 'artworkId', 'sortPriority'] }],
        order: [
          [Card, 'sortPriority', 'ASC'],
          ['cardName', 'ASC']
        ]
      })

      
    const limited2 = await Status.findAll({
        where: {
            banlist: {[Op.iLike]: date},
            category: {[Op.iLike]: category},
            restriction: 'limited-2'
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [{ model: Card, attributes: ['id', 'name', 'cleanName', 'artworkId', 'sortPriority'] }],
        order: [
          [Card, 'sortPriority', 'ASC'],
          ['cardName', 'ASC']
        ]
      })

      
    const limited3 = await Status.findAll({
        where: {
            banlist: {[Op.iLike]: date},
            category: {[Op.iLike]: category},
            restriction: 'limited-3'
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [{ model: Card, attributes: ['id', 'name', 'cleanName', 'artworkId', 'sortPriority'] }],
        order: [
          [Card, 'sortPriority', 'ASC'],
          ['cardName', 'ASC']
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

export const getBanlistAsCardsByDate = async (req, res, next) => {
  try {
    const {date} = req.params
    const category = req.query?.category || 'TCG'

    const statuses = [
      ...(await Status.findAll({
        where: {
          banlist: {[Op.iLike]: date},
          category: {[Op.iLike]: category}
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

export const createNewBanlist = async (req, res, next) => {
  try {
    const {month, day, year, changes, category} = req.body
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const banlist = `${months[(Number(month)-1)]} ${year}`
    let b = 0

    for (let i = 0; i < changes.length; i++) {
      try {
        const change = changes[i]
        const card = await Card.findOne({ where: { name: change.name } })
        const previous = change.previous && change.previous !== 'no longer on list' ? change.previous : 'unlimited'
        await Status.create({
          cardName: change.name,
          cardId: card.id,
          restriction: change.restriction,
          previous: previous,
          date: `${year}-${month}-${day}`,
          banlist: banlist,
          category: category
        })

        b++
      } catch (err) {
        console.log(err)
      }
    }

    const previousStatuses = await Status.findAll({
      where: {
        banlist: req.body.previousBanlist,
        restriction: {[Op.notIn]: ['unlimited', 'no longer on list']},
        category: category
      }
    })

    for (let i = 0; i < previousStatuses.length; i++) {
      const ps = previousStatuses[i]
      const statusIsChanging = await Status.count({
        where: {
          cardName: ps.cardName,
          category: category,
          banlist: banlist
        }
      })

      if (!statusIsChanging) {
        try {
          await Status.create({
            cardName: ps.cardName,
            restriction: ps.restriction,
            previous: ps.restriction,
            cardId: ps.cardId,
            date: `${year}-${month}-${day}`,
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
