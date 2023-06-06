
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Replay = db.define('replays', {
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
    winnerId: {
        type: Sequelize.STRING
    },
    loser: {
        type: Sequelize.STRING
    },
    loserId: {
        type: Sequelize.STRING
    },
    matchId: {
        type: Sequelize.INTEGER
    },
    tournamentId: {
        type: Sequelize.STRING,
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