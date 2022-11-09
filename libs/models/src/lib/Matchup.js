
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Matchup = db.define('matchups', {
    format: {
        type: Sequelize.STRING
    },
    winningDeck: {
        type: Sequelize.STRING
    },
    winningDeckId: {
        type: Sequelize.STRING
    },
    losingDeck: {
        type: Sequelize.STRING
    },
    losingDeckId: {
        type: Sequelize.INTEGER
    }
})