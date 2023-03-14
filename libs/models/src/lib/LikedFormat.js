
import { Sequelize } from 'sequelize'
import { db } from './db'

export const LikedFormat = db.define('likedFormats', {
  playerId: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
  }
})
