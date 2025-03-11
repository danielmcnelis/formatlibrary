import { Sequelize } from 'sequelize'
import { db } from './db'

export const Price = db.define('prices', {
  printId: {
    type: Sequelize.INTEGER
  },
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
  date: {
    type: Sequelize.STRING
  },
  isManufactured: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
})
