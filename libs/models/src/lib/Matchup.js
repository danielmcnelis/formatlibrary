
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Matchup = db.define('matchups', {
    formatName: {
        type: Sequelize.STRING
    },
    formatId: {
        type: Sequelize.INTEGER
    },
    winningDeckType: {
        type: Sequelize.STRING
    },
    winningDeckTypeId: {
        type: Sequelize.STRING
    },
    winningDeckId: {
        type: Sequelize.INTEGER
    },
    losingDeckType: {
        type: Sequelize.STRING
    },
    losingDeckTypeId: {
        type: Sequelize.STRING
    },
    losingDeckId: {
        type: Sequelize.INTEGER
    }
})