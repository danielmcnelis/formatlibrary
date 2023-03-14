
import { Sequelize } from 'sequelize'
import { db } from './db'

export const LikedDeck = db.define('likedDecks', {
  playerId: {
    type: Sequelize.STRING
  },
  deckId: {
    type: Sequelize.INTEGER
  }
})
