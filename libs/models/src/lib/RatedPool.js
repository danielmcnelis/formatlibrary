
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Pool = db.define('pools', {
    name: {
        type: Sequelize.STRING
    },
    format: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.STRING,      
        defaultValue: 'pending'
    },
    playerId: {
        type: Sequelize.STRING
    }
})