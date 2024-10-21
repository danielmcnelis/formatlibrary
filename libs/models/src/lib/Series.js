import { Sequelize } from 'sequelize'
import { db } from './db'

export const Series = db.define('series', {
  name: {
    type: Sequelize.STRING
  },
  abbreviation: {
    type: Sequelize.STRING
  },
  serverId: {
    type: Sequelize.STRING
  }
})
