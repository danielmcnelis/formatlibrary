import { Sequelize } from 'sequelize'
import { db } from './db'

export const Artwork = db.define('artworks', {
  cardName: {
    type: Sequelize.STRING
  },
  ypdId: {
    type: Sequelize.STRING,
    unique: true
  },
  cardId: {
    type: Sequelize.INTEGER
  },
  isOriginal: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
})
