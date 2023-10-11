
import { Sequelize } from 'sequelize'
import { db } from './db'

export const CubeDraftInventory = db.define('cubeDraftInventories', {
    cardName: {
        type: Sequelize.STRING
    },
    cardId: {
        type: Sequelize.INTEGER
    },
    cubeDraftId: {
        type: Sequelize.INTEGER
    },
    cubeDraftEntryId: {
        type: Sequelize.INTEGER
    }
})