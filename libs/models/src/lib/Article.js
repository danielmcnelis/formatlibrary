
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Article = db.define('articles', {     
  title: {
    type: Sequelize.STRING
  },
  author: {
    type: Sequelize.STRING
  },
  playerId: {
    type: Sequelize.STRING
  },
  content: {
    type: Sequelize.TEXT
  },
  format: {
    type: Sequelize.STRING
  },
  publishDate: {
    type: Sequelize.STRING
  },
  rating: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  views: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  }
})
