
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Pairing = db.define('pairings', {
    formatName: {
        type: Sequelize.STRING
    },
    formatId: {
        type: Sequelize.INTEGER
    },
    status: {
        type: Sequelize.STRING,      
        defaultValue: 'active'
    },
    playerAName: {
        type: Sequelize.STRING
    },
    playerAId: {
        type: Sequelize.STRING
    },
    deckFileA: {
        type: Sequelize.TEXT
    },
    playerBName: {
        type: Sequelize.STRING
    },
    playerBId: {
        type: Sequelize.STRING
    },
    deckFileB: {
        type: Sequelize.TEXT
    },
    serverName: {
        type: Sequelize.STRING
    },
    serverId: {
        type: Sequelize.INTEGER
    }
})