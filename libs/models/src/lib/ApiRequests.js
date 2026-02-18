
import { Sequelize } from 'sequelize'
import { db } from './db'

export const ApiRequests = db.define('apiRequests', {
  serverName: {
    type: Sequelize.STRING
  },
  serverId: {
    type: Sequelize.STRING
  },
  count: {
    type: Sequelize.INTEGER
  },
  date: {
    type: Sequelize.STRING
  }
})