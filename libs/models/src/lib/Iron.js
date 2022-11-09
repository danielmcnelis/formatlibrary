
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Iron = db.define('irons', {
    name: {
        type: Sequelize.STRING
    },
    format: {
        type: Sequelize.STRING
    },
    team: {
        type: Sequelize.STRING
    },
    eliminated: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    },
    position: {
        type: Sequelize.INTEGER
    },
    captain: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    },
    confirmed: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    },
    status: {
        type: Sequelize.STRING,   
        defaultValue: 'pending'
    },
    playerId: {
        type: Sequelize.STRING
    }
})