
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
    winnerName: {
        type: Sequelize.STRING
    },
    winnerId: {
        type: Sequelize.STRING
    },
    loserName: {
        type: Sequelize.STRING
    },
    loserId: {
        type: Sequelize.STRING
    },
    matchId: {
        type: Sequelize.INTEGER
    },
    tournamentName: {
        type: Sequelize.STRING,
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
    },
    display: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    topCut: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
})