
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Pool = db.define('pools', {
    playerName: {
        type: Sequelize.STRING
    },
    formatName: {
        type: Sequelize.STRING
    },
    formatId: {
        type: Sequelize.INTEGER
    },
    status: {
        type: Sequelize.STRING,      
        defaultValue: 'pending'
    },
    playerId: {
        type: Sequelize.STRING
    },
    deckFile: {
        type: Sequelize.TEXT
    }
})