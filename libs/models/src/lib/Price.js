import { Sequelize } from 'sequelize'
import { db } from './db'

export const Price = db.define('prices', {
  usd: {
    type: Sequelize.FLOAT,
    defaultValue: 0.0
  },
  edition: {
    type: Sequelize.STRING,
  },
  source: {
    type: Sequelize.STRING,
    defaultValue: 'TCGplayer'
  },
  printId: {
    type: Sequelize.INTEGER
  },
  isManufactured: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
})
