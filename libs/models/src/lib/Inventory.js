
import { Sequelize } from 'sequelize'
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
    }
})