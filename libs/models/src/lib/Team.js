
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Team = db.define('teams', {
    name: {
        type: Sequelize.STRING
    },
    participantId: {
        type: Sequelize.INTEGER
    },
    tournamentId: {
        type: Sequelize.STRING
    },
    captainId: {
        type: Sequelize.STRING
    },
    playerAId: {
        type: Sequelize.STRING
    },
    playerBId: {
        type: Sequelize.STRING
    },
    playerCId: {
        type: Sequelize.STRING
    },
    teamWins: {
        type: Sequelize.INTEGER,
        default: 0
    },
    teamLosses: {
        type: Sequelize.INTEGER,
        default: 0
    },
    matchWins: {
        type: Sequelize.INTEGER,
        default: 0
    },
    matchLosses: {
        type: Sequelize.INTEGER,
        default: 0
    }
})