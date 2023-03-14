
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Match = db.define('matches', {
    url: {
        type: Sequelize.TEXT
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
        type: Sequelize.STRING
    },
    eventName: {
        type: Sequelize.STRING,
    },
    eventId: {
        type: Sequelize.STRING,
    },
    round: {
        type: Sequelize.STRING
    }
})