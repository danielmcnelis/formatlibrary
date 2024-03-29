
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
    formatName: {
        type: Sequelize.STRING
    },
    formatId: {
        type: Sequelize.INTEGER
    }
})