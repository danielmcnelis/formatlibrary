
import { Sequelize } from 'sequelize'
import { db } from './db'

export const DraftEntry = db.define('draftEntries', {
    playerName: {
        type: Sequelize.STRING
    },
    playerId: {
        type: Sequelize.STRING
    },
    slot: {
        type: Sequelize.INTEGER
    },
    draftId: {
        type: Sequelize.STRING
    }
})