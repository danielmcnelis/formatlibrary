
import { Sequelize } from 'sequelize'
import { db } from './db'

export const BlogPost = db.define('blogposts', {
  title: {
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
  eventDate: {
    type: Sequelize.DATE
  },
  eventId: {
    type: Sequelize.INTEGER
  }
})
