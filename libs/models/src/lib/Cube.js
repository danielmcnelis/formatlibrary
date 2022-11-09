
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Cube = db.define('cubes', {
  name: {
    type: Sequelize.STRING
  },
  builder: {
    type: Sequelize.STRING
  },
  playerId: {
    type: Sequelize.STRING
  },
  ydk: {
    type: Sequelize.TEXT
  },
  publishDate: {
    type: Sequelize.DATE
  },
  display: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  rating: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  downloads: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  views: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  shareLink: {
    type: Sequelize.STRING
  },
  linkExpiration: {
    type: Sequelize.DATE
  }
})