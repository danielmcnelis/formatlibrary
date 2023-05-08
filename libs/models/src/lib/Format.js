import { Sequelize } from 'sequelize'
import { db } from './db'

export const Format = db.define('formats', {
  name: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  date: {
    type: Sequelize.STRING
  },
  banlist: {
    type: Sequelize.STRING
  },
  event: {
    type: Sequelize.STRING
  },
  icon: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.TEXT
  },
  channel: {
    type: Sequelize.STRING
  },
  emoji: {
    type: Sequelize.STRING
  },
  role: {
    type: Sequelize.STRING
  },
  popular: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  spotlight: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  category: {
    type: Sequelize.STRING
  }
})
