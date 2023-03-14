
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
  eventNotifs: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  poolNotifs: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
})
