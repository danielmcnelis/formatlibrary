import { Sequelize } from 'sequelize'
import { db } from './db'

export const Print = db.define('prints', {
  cardName: {
    type: Sequelize.STRING
  },
  cardCode: {
    type: Sequelize.STRING
  },
  cardId: {
    type: Sequelize.INTEGER
  },
  setName: {
    type: Sequelize.STRING
  },
  setId: {
    type: Sequelize.INTEGER
  },
  region: {
    type: Sequelize.STRING
  },
  rarity: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.TEXT,
  },
  marketPrice: {
    type: Sequelize.FLOAT
  },
  unlimitedPrice: {
    type: Sequelize.FLOAT
  },
  firstEditionPrice: {
    type: Sequelize.FLOAT
  },
  limitedPrice: {
    type: Sequelize.FLOAT
  },
  tcgPlayerProductId: {
    type: Sequelize.INTEGER
  },
  tcgPlayerUrl: {
    type: Sequelize.TEXT
  },
  legalOnRelease: {
    type: Sequelize.BOOLEAN
  },
  legalDate: {
    type: Sequelize.STRING
  }
})
