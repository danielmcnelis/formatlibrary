
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Role = db.define('roles', {
    roleId: {
        type: Sequelize.STRING
    },
    roleName: {
        type: Sequelize.STRING
    },
    membershipId: {
        type: Sequelize.INTEGER
    }
})