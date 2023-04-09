import { Sequelize } from 'sequelize'
import { db } from './db'

export const Print = db.define('prints', {
  cardName: {
    type: Sequelize.STRING
  },
  cardCode: {
    type: Sequelize.STRING
  },
  setName: {
    type: Sequelize.STRING
  },
  rarity: {
    type: Sequelize.STRING
  },
  original: {
    type: Sequelize.BOOLEAN
  },
  marketPrice: {
    type: Sequelize.FLOAT
  },
  unlimPrice: {
    type: Sequelize.FLOAT
  },
  firstPrice: {
    type: Sequelize.FLOAT
  },
  limPrice: {
    type: Sequelize.FLOAT
  },
  tcgPlayerProductId: {
    type: Sequelize.INTEGER
  },
  tcgPlayerUrl: {
    type: Sequelize.TEXT
  },
  cardId: {
    type: Sequelize.INTEGER
  }
})
