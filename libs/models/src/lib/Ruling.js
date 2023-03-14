
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Ruling = db.define('rulings', {
    cardName: {
        type: Sequelize.STRING
    },
    cardId: {
        type: Sequelize.INTEGER
    },
    content: {
        type: Sequelize.TEXT
    },
    region: {
        type: Sequelize.STRING
    },
    effectiveDate: {
        type: Sequelize.STRING
    },
    expirationDate: {
        type: Sequelize.STRING
    }
})