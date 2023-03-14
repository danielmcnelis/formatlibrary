
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
        type: Sequelize.DATE
    },
    expirationDate: {
        type: Sequelize.DATE
    },
    original: {
        type: Sequelize.BOOLEAN
    },
    current: {
        type: Sequelize.BOOLEAN
    }
})