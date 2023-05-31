
import { Sequelize } from 'sequelize'
import { db } from './db'

export const DeckType = db.define('deckTypes', {
  name: {
    type: Sequelize.STRING
  },
  category: {
    type: Sequelize.STRING
  },
  game: {
    type: Sequelize.STRING,
    defaultValue: 'YGO'
  }
})
