import { Sequelize } from 'sequelize'
import { db } from './db'

export const Community = db.define('communities', {
  id: {
    primaryKey: true,
    type: Sequelize.INTEGER
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