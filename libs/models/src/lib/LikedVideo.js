
import { Sequelize } from 'sequelize'
import { db } from './db'

export const LikedVideo = db.define('likedVideos', {
  playerId: {
    type: Sequelize.STRING
  },
  videoId: {
    type: Sequelize.INTEGER
  }
})
