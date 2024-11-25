
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Video = db.define('videos', {     
  title: {
    type: Sequelize.STRING
  },
  authorName: {
    type: Sequelize.STRING
  },
  authorId: {
    type: Sequelize.STRING
  },
  url: {
    type: Sequelize.STRING
  },
  formatName: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
  },
  publishDate: {
    type: Sequelize.STRING
  }
})
