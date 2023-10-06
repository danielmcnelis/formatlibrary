
import { Sequelize } from 'sequelize'
import { db } from './db'

export const CubeDraftEntry = db.define('cubeDraftEntries', {
    playerName: {
        type: Sequelize.STRING
    },
    playerId: {
        type: Sequelize.STRING
    },
    slot: {
        type: Sequelize.STRING
    },
    currentPackNumber: {
        type: Sequelize.INTEGER
    },
    cubeDraftId: {
        type: Sequelize.STRING
    }
})