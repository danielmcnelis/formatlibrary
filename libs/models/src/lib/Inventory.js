
import { Sequelize } from 'sequelize'
import { Card } from './Card'
import { db } from './db'

export const Inventory = db.define('inventories', {
    cardName: {
        type: Sequelize.STRING
    },
    cardId: {
        type: Sequelize.INTEGER
    },
    draftId: {
        type: Sequelize.INTEGER
    },
    draftEntryId: {
        type: Sequelize.INTEGER
    },
    round: {
        type: Sequelize.INTEGER
    },
    pick: {
        type: Sequelize.INTEGER
    },
    compositeKey: {
        type: Sequelize.INTEGER,
        unique: true
    }
})