
import { Sequelize } from 'sequelize'
import { db } from './db'


export const Article = db.define('articles', {     
  title: {
    type: Sequelize.STRING
  },
  authorName: {
    type: Sequelize.STRING
  },
  authorId: {
    type: Sequelize.STRING
  },
  content: {
    type: Sequelize.TEXT
  },
  formatName: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
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
