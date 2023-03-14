
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Errata = db.define('erratas', {
    cardName: {
        type: Sequelize.STRING
    },
    cardId: {
        type: Sequelize.INTEGER
    },
    description: {
        type: Sequelize.TEXT
    },
    effectiveDate: {
        type: Sequelize.STRING
    },
    expirationDate: {
        type: Sequelize.STRING
    },
    original: {
        type: Sequelize.BOOLEAN
    },
    active: {
        type: Sequelize.BOOLEAN
    }
})