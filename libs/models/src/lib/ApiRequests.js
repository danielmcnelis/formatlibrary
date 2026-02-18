
import { Sequelize } from 'sequelize'
import { db } from './db'

export const ApiRequests = db.define('ApiRequests', {
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