
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Video = db.define('videos', {     
  title: {
    type: Sequelize.STRING
  },
  author: {
    type: Sequelize.STRING
  },
  playerId: {
    type: Sequelize.STRING
  },
  url: {
    type: Sequelize.STRING
  },
  format: {
    type: Sequelize.STRING
  },
  publishDate: {
    type: Sequelize.STRING
  }
})
