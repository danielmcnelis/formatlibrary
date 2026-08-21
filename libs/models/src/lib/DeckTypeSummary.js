
import { Sequelize } from 'sequelize'
import { db } from './db'

export const DeckTypeSummary = db.define('deckTypeSummaries', {
  id: {
        type: Sequelize.INTEGER
  },
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
  zeroCopyMainFrequency: {
    type: Sequelize.INTEGER
  },
  oneCopyMainFrequency: {
    type: Sequelize.INTEGER
  },
  twoCopyMainFrequency: {
    type: Sequelize.INTEGER
  },
  threeCopyMainFrequency: {
    type: Sequelize.INTEGER
  },
  zeroCopyExtraFrequency: {
    type: Sequelize.INTEGER
  },
  oneCopyExtraFrequency: {
    type: Sequelize.INTEGER
  },
  twoCopyExtraFrequency: {
    type: Sequelize.INTEGER
  },
  threeCopyExtraFrequency: {
    type: Sequelize.INTEGER
  },
  zeroCopySideFrequency: {
    type: Sequelize.INTEGER
  },
  oneCopySideFrequency: {
    type: Sequelize.INTEGER
  },
  twoCopySideFrequency: {
    type: Sequelize.INTEGER
  },
  threeCopySideFrequency: {
    type: Sequelize.INTEGER
  },
  mostPopularExampleDeckId: {
    type: Sequelize.INTEGER
  },
  recentExampleDeckId: {
    type: Sequelize.INTEGER
  }
})