
import { Op, Sequelize } from 'sequelize'
import { db } from './db'
import { Print } from './Print'

export const Card = db.define('cards', {
  name: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  cleanName: {
    type: Sequelize.STRING,
    unique: true
  },
  konamiCode: {
    type: Sequelize.STRING
  },
  ypdId: {
    type: Sequelize.STRING
  },
  artworkId: {
    type: Sequelize.STRING
  },
  isTcgLegal: {
    type: Sequelize.BOOLEAN
  },
  isOcgLegal: {
    type: Sequelize.BOOLEAN
  },
  isSpeedLegal: {
    type: Sequelize.BOOLEAN
  },
  category: {
    type: Sequelize.STRING
  },
  icon: {
    type: Sequelize.STRING
  },
  isNormal: {
    type: Sequelize.BOOLEAN
  },
  isEffect: {
    type: Sequelize.BOOLEAN
  },
  isFusion: {
    type: Sequelize.BOOLEAN
  },
  isRitual: {
    type: Sequelize.BOOLEAN
  },
  isSynchro: {
    type: Sequelize.BOOLEAN
  },
  isXyz: {
    type: Sequelize.BOOLEAN
  },
  isPendulum: {
    type: Sequelize.BOOLEAN
  },
  isLink: {
    type: Sequelize.BOOLEAN
  },
  isFlip: {
    type: Sequelize.BOOLEAN
  },
  isGemini: {
    type: Sequelize.BOOLEAN
  },
  isSpirit: {
    type: Sequelize.BOOLEAN
  },
  isToon: {
    type: Sequelize.BOOLEAN
  },
  isTuner: {
    type: Sequelize.BOOLEAN
  },
  isUnion: {
    type: Sequelize.BOOLEAN
  },
  attribute: {
    type: Sequelize.STRING
  },
  type: {
    type: Sequelize.STRING
  },
  level: {
    type: Sequelize.INTEGER
  },
  rating: {
    type: Sequelize.INTEGER
  },
  arrows: {
    type: Sequelize.STRING
  },
  scale: {
    type: Sequelize.INTEGER
  },
  atk: {
    type: Sequelize.STRING
  },
  def: {
    type: Sequelize.STRING
  },
  pendulumEffect: {
    type: Sequelize.TEXT
  },
  description: {
    type: Sequelize.TEXT
  },
  tcgDate: {
    type: Sequelize.STRING
  },
  ocgDate: {
    type: Sequelize.STRING
  },
  speedDate: {
    type: Sequelize.STRING
  },
  color: {
    type: Sequelize.STRING
  },
  isExtraDeck: {
    type: Sequelize.BOOLEAN
  },
  sortPriority: {
    type: Sequelize.INTEGER
  }
})

Card.countResults = async (filter = {}, booster) => {
    filter = Object.entries(filter).reduce((reduced, [key, by]) => {
        let value = by.value
        if (typeof value === 'string') value.replaceAll('%20', ' ')
        let operator = by.operator
        if (['isNormal', 'isEffect', 'isFusion', 'isRitual', 'isSynchro', 'isXyz', 'isPendulum', 'isLink', 'isFlip', 'isGemini', 'isSpirit', 'isToon', 'isTuner', 'isUnion'].includes(key)) { value = value.toLowerCase() === 'true' }
        if (['level', 'rating', 'scale', 'sortPriority'].includes(key) && operator !== 'btw') { value = parseInt(value) }
        
        if (['tcg'].includes(key)) { 
            key = 'isTcgLegal'
        } else if (['ocg'].includes(key)) { 
            key = 'isOcgLegal'
        } else if (['speed'].includes(key)) { 
            key = 'isSpeedLegal'
        } else if (['extra'].includes(key)) { 
            key = 'isExtraDeck'
        }

        if (operator === 'eq') {
            operator = Op.eq
        } else if (operator === 'not') {
            operator = Op.not
        } else if (operator === 'like') {
            operator = Op.iLike
        } else if (operator === 'gt') {
            operator = Op.gt
        } else if (operator === 'gte') {
            operator = Op.gte
        } else if (operator === 'lt') {
            operator = Op.lt
        } else if (operator === 'lte') {
            operator = Op.lte
        } else if (operator === 'or') {
            operator = Op.or
        } else if (operator === 'and') {
            operator = Op.and
        } else if (operator === 'inc') {
            operator = Op.iLike
            value = '%' + value + '%'
        } else if (operator === 'btw') {
            operator = Op.and
            value = {[Op.gte]: parseInt(value[0]), [Op.lte]: parseInt(value[1])}
        }

        reduced[key] = {[operator]: value}
        return reduced
    }, {})

    let include = []
    if (booster) {
        filter['$prints.cardCode$'] = {[Op.iLike]: booster + '%' }        
        include = [{ model: Print } ]
    }

    const count = await Card.count({ 
        where: filter,
        include: include
     })
    return count
}

Card.find = async (filter = {}, booster, limit = 10, page = 1, sort = []) => {
    filter = Object.entries(filter).reduce((reduced, [key, by]) => {
        let value = by.value
        if (typeof value === 'string') value.replaceAll('%20', ' ')
        let operator = by.operator
        if (['tcg', 'ocg', 'speed', 'extra', 'isNormal', 'isEffect', 'isFusion', 'isRitual', 'isSynchro', 'isXyz', 'isPendulum', 'isLink', 'isFlip', 'isGemini', 'isSpirit', 'isToon', 'isTuner', 'isUnion'].includes(key)) { value = value.toLowerCase() === 'true' }
        if (['level', 'rating', 'scale', 'sortPriority'].includes(key) && operator !== 'btw') { value = parseInt(value) }
        
        if (['tcg'].includes(key)) { 
            key = 'isTcgLegal'
        } else if (['ocg'].includes(key)) { 
            key = 'isOcgLegal'
        } else if (['speed'].includes(key)) { 
            key = 'isSpeedLegal'
        } else if (['extra'].includes(key)) { 
            key = 'isExtraDeck'
        }

        if (operator === 'eq') {
            operator = Op.eq
        } else if (operator === 'not') {
            operator = Op.not
        } else if (operator === 'like') {
            operator = Op.iLike
        } else if (operator === 'gt') {
            operator = Op.gt
        } else if (operator === 'gte') {
            operator = Op.gte
        } else if (operator === 'lt') {
            operator = Op.lt
        } else if (operator === 'lte') {
            operator = Op.lte
        } else if (operator === 'or') {
            operator = Op.or
        } else if (operator === 'and') {
            operator = Op.and
        } else if (operator === 'inc') {
            operator = Op.iLike
            value = '%' + value + '%'
        } else if (operator === 'btw') {
            operator = Op.and
            value = {[Op.gte]: parseInt(value[0]), [Op.lte]: parseInt(value[1])}
        }

        reduced[key] = {[operator]: value}
        return reduced
    }, {})

    if (booster) filter['$prints.cardCode$'] = {[Op.iLike]: booster + '%' }

    const cards = await Card.findAll({
        where: filter,
        offset: (page - 1) * limit,
        limit: limit,
        subQuery: false,
        attributes: { exclude: ['isTcgLegal', 'isOcgLegal', 'isSpeedLegal', 'createdAt', 'updatedAt'] },
        include: [{ model: Print, separate: !booster, attributes: ['id'] }],
        order: sort
    })

    return cards
}