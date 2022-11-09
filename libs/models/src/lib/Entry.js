
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Entry = db.define('entries', {
    playerName: {
        type: Sequelize.STRING
    },
    url: {
        type: Sequelize.STRING
    },
    ydk: {
        type: Sequelize.TEXT
    },
    active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    losses: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    participantId: {
        type: Sequelize.INTEGER
    },
    playerId: {
        type: Sequelize.STRING
    },
    tournamentId: {
        type: Sequelize.STRING
    }
})