
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Match = db.define('matches', {
    url: {
        type: Sequelize.STRING
    },
    formatName: {
        type: Sequelize.STRING
    },
    formatId: {
      type: Sequelize.INTEGER
    },
    winner: {
        type: Sequelize.STRING
    },
    loser: {
        type: Sequelize.STRING
    },
    matchId: {
        type: Sequelize.INTEGER
    },
    eventName: {
        type: Sequelize.STRING,
    },
    eventId: {
        type: Sequelize.INTEGER,
    },
    round: {
        type: Sequelize.STRING
    }
})