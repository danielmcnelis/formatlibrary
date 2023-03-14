import { Sequelize } from 'sequelize'
import { db } from './db'

export const Price = db.define('prices', {
  usd: {
    type: Sequelize.FLOAT,
    defaultValue: 0.0
  },
  source: {
    type: Sequelize.STRING,
    defaultValue: 'TCGplayer'
  },
  printId: {
    type: Sequelize.INTEGER
  }
})
