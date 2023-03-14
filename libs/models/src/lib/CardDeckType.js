
import { Sequelize } from 'sequelize'
import { db } from './db'

export const CardDeckType = db.define('cardDeckTypes', {
  cardName: {
    type: Sequelize.STRING
  },
  cardId: {
    type: Sequelize.INTEGER
  },
  deckTypeName: {
    type: Sequelize.STRING
  },
  deckTypeId: {
    type: Sequelize.INTEGER
  }
})
