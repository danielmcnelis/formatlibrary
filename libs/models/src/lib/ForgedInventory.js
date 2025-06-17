
import {db} from './db'
import { Op, Sequelize } from 'sequelize'
import { Card } from './Card'
// import { ForgedPrint } from './ForgedPrint'

export const ForgedInventory = db.define('forgedInventories', {
    playerName: {
        type: Sequelize.STRING,
    },
    playerId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    cardCode: {
        type: Sequelize.STRING,
    },
    cardName: {
        type: Sequelize.STRING,
    },
    quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    forgedPrintId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
})


ForgedInventory.countResults = async (filter = {}, booster) => {
    filter = Object.entries(filter).reduce((reduced, [key, by]) => {
        let value = by.value
        if (typeof value === 'string') value.replaceAll('%20', ' ')
        let operator = by.operator
        if (['isNormal', 'isEffect', 'isFusion', 'isRitual', 'isSynchro', 'isXyz', 'isPendulum', 'isLink', 'isFlip', 'isGemini', 'isSpirit', 'isToon', 'isTuner', 'isUnion'].includes(key)) { value = value.toLowerCase() === 'true' }
        if (['level', 'rating', 'scale', 'sortPriority'].includes(key) && operator !== 'btw') { value = parseInt(value) }

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

    let include = [{ model: Card } ]
    if (booster) {
        filter['$prints.cardCode$'] = {[Op.iLike]: booster + '%' }        
    }

    const count = await ForgedInventory.count({ 
        where: filter,
        include: include
     })
    return count
}

ForgedInventory.find = async (filter = {}, booster, limit = 10, page = 1, sort = []) => {
    filter = Object.entries(filter).reduce((reduced, [key, by]) => {
        let value = by.value
        if (typeof value === 'string') value.replaceAll('%20', ' ')
        let operator = by.operator
        if (['isNormal', 'isEffect', 'isFusion', 'isRitual', 'isSynchro', 'isXyz', 'isPendulum', 'isLink', 'isFlip', 'isGemini', 'isSpirit', 'isToon', 'isTuner', 'isUnion'].includes(key)) { value = value.toLowerCase() === 'true' }
        if (['level', 'rating', 'scale', 'sortPriority'].includes(key) && operator !== 'btw') { value = parseInt(value) }

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

    const cards = await ForgedInventory.findAll({
        where: filter,
        offset: (page - 1) * limit,
        limit: limit,
        subQuery: false,
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [{model: Card}],
        // include: [{ model: ForgedPrint, separate: !booster, attributes: ['id'] }],
        order: sort
    })

    return cards
}