
import { Sequelize } from 'sequelize'
import { db } from './db'

export const LikedArticle = db.define('likedArticles', {
  playerId: {
    type: Sequelize.STRING
  },
  articleId: {
    type: Sequelize.INTEGER
  }
})
