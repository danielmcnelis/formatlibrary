
import { Sequelize, Op } from 'sequelize'
import { Tournament } from './Tournament'
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
    isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    roundDropped: {
        type: Sequelize.INTEGER
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
        type: Sequelize.STRING,
    },
    tournamentId: {
        type: Sequelize.STRING,
    },
    compositeKey: {
        type: Sequelize.STRING,
        unique: true
    },
    teamId: {
        type: Sequelize.INTEGER
    },
    slot: {
        type: Sequelize.STRING
    },
    skillCardId: {
      type: Sequelize.INTEGER
    }
})

Entry.findByPlayerIdAndTournamentId = async (playerId, tournamentId) => await Entry.findOne({ where: { playerId, tournamentId }})

Entry.findByPlayerIdAndFormatId = async (playerId, formatId) => await Entry.findAll({ 
    where: { 
        playerId,
        '$tournament.formatId$': {[Op.or]: [formatId, null]}
    }, 
    include: Tournament 
})