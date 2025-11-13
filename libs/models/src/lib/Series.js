import { Sequelize } from 'sequelize'
import { db } from './db'

export const Series = db.define('series', {
  name: {
    type: Sequelize.STRING
  },
  abbreviation: {
    type: Sequelize.STRING
  },
  emoji: {
    type: Sequelize.STRING
  },
  communityName: {
    type: Sequelize.STRING
  },
  serverId: {
    type: Sequelize.STRING
  },
  requiredRoleId: {
    type: Sequelize.STRING
  },
  alternateRoleId: {
    type: Sequelize.STRING
  }
})
