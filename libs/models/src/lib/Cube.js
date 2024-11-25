
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Cube = db.define('cubes', {
  name: {
    type: Sequelize.STRING
  },
  builderName: {
    type: Sequelize.STRING
  },
  builderId: {
    type: Sequelize.STRING
  },
  ydk: {
    type: Sequelize.TEXT
  },
  display: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  size: {
    type: Sequelize.INTEGER
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
  linkExpiresAt: {
    type: Sequelize.DATE
  }
})