
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
