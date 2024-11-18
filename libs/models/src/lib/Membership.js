
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Membership = db.define('memberships', {
    guildName: {
        type: Sequelize.STRING
    },
    playerName: {
        type: Sequelize.STRING, 
    },
    active: {
        type: Sequelize.BOOLEAN,  
        defaultValue: true
    }
})