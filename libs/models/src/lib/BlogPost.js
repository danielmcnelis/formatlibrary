
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
  formatId: {
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
  },
  winningDeckId: {
    type: Sequelize.INTEGER
  },
  teamId: {
    type: Sequelize.INTEGER
  },
  playerId: {
    type: Sequelize.STRING
  },
  serverId: {
    type: Sequelize.INTEGER
  }
})
