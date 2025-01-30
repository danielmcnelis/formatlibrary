
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Subscription = db.define('subscriptions', {
  id: {
    type: Sequelize.STRING
  },
  playerName: {
    type: Sequelize.STRING
  },
  playerId: {
    type: Sequelize.STRING
  },
  customerName: {
    type: Sequelize.STRING
  },
  customerEmail: {
    type: Sequelize.STRING
  },
  customerId: {
    type: Sequelize.STRING
  },
  tier: {
    type: Sequelize.STRING
  },
  status: {
    type: Sequelize.STRING
  },
  currentPeriodStart: {
    type: Sequelize.DATE
  },
  currentPeriodEnd: {
    type: Sequelize.DATE
  },
  endedAt: {
    type: Sequelize.DATE
  }
})
