
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Team = db.define('irons', {
    name: {
        type: Sequelize.STRING
    },
    participantId: {
        type: Sequelize.INTEGER
    },
    tournamentId: {
        type: Sequelize.INTEGER
    },
    captainId: {
        type: Sequelize.STRING
    },
    playerAId: {
        type: Sequelize.STRING
    },
    entryAId: {
        type: Sequelize.INTEGER
    },
    playerBId: {
        type: Sequelize.STRING
    },
    entryBId: {
        type: Sequelize.INTEGER
    },
    playerCId: {
        type: Sequelize.STRING
    },
    entryCId: {
        type: Sequelize.INTEGER
    },
    wins: {
        type: Sequelize.INTEGER,
        default: 0
    },
    losses: {
        type: Sequelize.INTEGER,
        default: 0
    },
    currentRoundWins: {
        type: Sequelize.INTEGER,
        default: 0
    },
    currentRoundLosses: {
        type: Sequelize.INTEGER,
        default: 0
    }
})