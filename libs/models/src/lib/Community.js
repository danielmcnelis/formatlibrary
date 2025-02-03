import { Sequelize } from 'sequelize'
import { db } from './db'

export const Community = db.define('communities', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    unique: true
  },
  logo: {
    type: Sequelize.STRING
  },
  serverName: {
    type: Sequelize.STRING
  },
  serverId: {
    type: Sequelize.STRING
  }
})