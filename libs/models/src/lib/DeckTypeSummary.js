
import { Sequelize } from 'sequelize'
import { db } from './db'

export const DeckTypeSummary = db.define('deckTypeSummaries', {
  deckTypeName: {
    type: Sequelize.STRING
  },
  deckTypeId: {
    type: Sequelize.INTEGER
  },
  cardName: {
    type: Sequelize.STRING
  },
  cardId: {
    type: Sequelize.INTEGER
  },
  formatName: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
  },
  location: {
    type: Sequelize.STRING
  },
  zeroCopyPercent: {
    type: Sequelize.INTEGER
  },
  oneCopyPercent: {
    type: Sequelize.INTEGER
  },
  twoCopyPercent: {
    type: Sequelize.INTEGER
  },
  threeCopyPercent: {
    type: Sequelize.INTEGER
  }
})