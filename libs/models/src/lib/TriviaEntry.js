
import { Sequelize } from 'sequelize'
import { db } from './db'

const TriviaEntry = db.define('triviaEntries', {
    playerName: {
        type: Sequelize.STRING
    },
    playerId: {
        type: Sequelize.STRING
    },
    confirmed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: Sequelize.STRING,   
        defaultValue: 'pending'
    },
    score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    answer: {
        type: Sequelize.TEXT,
        defaultValue: null
    }
})

module.exports = TriviaEntry

