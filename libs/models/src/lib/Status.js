import { Sequelize } from 'sequelize'
import { db } from './db'

export const Status = db.define('statuses', {
  name: {
    type: Sequelize.STRING
  },
  banlist: {
    type: Sequelize.STRING
  },
  date: {
    type: Sequelize.STRING
  },
  restriction: {
    type: Sequelize.STRING
  },
  previous: {
    type: Sequelize.STRING
  },
  category: {
    type: Sequelize.STRING
  }
})
