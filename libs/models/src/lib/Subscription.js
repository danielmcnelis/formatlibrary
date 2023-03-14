
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Subscription = db.define('subscriptions', {
  formatName: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
  },
  playerName: {
    type: Sequelize.STRING
  },
  playerId: {
    type: Sequelize.STRING
  },
  eventNotifications: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  poolNotifications: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
})
