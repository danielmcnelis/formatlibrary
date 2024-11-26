
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Membership = db.define('memberships', {
    communityName: {
        type: Sequelize.STRING
    },
    serverId: {
        type: Sequelize.INTEGER
    },
    playerName: {
        type: Sequelize.STRING
    },
    isActive: {
        type: Sequelize.BOOLEAN,  
        defaultValue: true
    }
})