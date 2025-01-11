import { Sequelize } from 'sequelize'
import { db } from './db'

export const Community = db.define('communities', {
  id: {
    primaryKey: true,
    type: Sequelize.STRING
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  logo: {
    type: Sequelize.STRING
  },
  serverId: {
    type: Sequelize.STRING
  }
})