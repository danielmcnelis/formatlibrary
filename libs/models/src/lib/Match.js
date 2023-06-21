
import { Op, Sequelize } from 'sequelize'
import { db } from './db'

export const Match = db.define('matches', {
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
    delta: {
        type: Sequelize.FLOAT,  
        defaultValue: 10.00
    },
    isTournament: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    },
    tournamentId: {
        type: Sequelize.STRING,
    },
    challongeMatchId: {
        type: Sequelize.INTEGER
    },
    round: {
        type: Sequelize.INTEGER
    },
    isRatedPairing: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    },
    pairingId: {
        type: Sequelize.INTEGER,
    },
    internal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
})

Match.checkIfVanquished = async (formatId, winnerId, loserId, createdAt) => createdAt ? 
    await Match.count({ 
        where: { 
            formatId, winnerId, loserId,
            createdAt: {[Op.lt]: createdAt}
        }
    }) : await Match.count({ where: { formatId, winnerId, loserId }})
    