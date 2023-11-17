
import { Sequelize } from 'sequelize'
import { db } from './db'

export const PackContent = db.define('packContents', {
    cardName: {
        type: Sequelize.STRING
    },
    cardId: {
        type: Sequelize.STRING,
    },
    rarity: {
        type: Sequelize.STRING,
    },
    packNumber: {
        type: Sequelize.INTEGER
    },
    draftId: {
        type: Sequelize.STRING,
    }
})