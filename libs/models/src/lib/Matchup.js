
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
        type: Sequelize.INTEGER
    },
    winningDeckId: {
        type: Sequelize.INTEGER
    },
    losingDeckType: {
        type: Sequelize.STRING
    },
    losingDeckTypeId: {
        type: Sequelize.INTEGER
    },
    losingDeckId: {
        type: Sequelize.INTEGER
    },
    source: {
        type: Sequelize.STRING,
        defaultValue: 'tournament'
    },
    challongeMatchId: {
        type: Sequelize.INTEGER
    },
    pairingId: {
        type: Sequelize.INTEGER
    }
})