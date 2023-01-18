import { Sequelize } from 'sequelize'
import { db } from './db'

export const Stats = db.define('stats', {
  format: {
    type: Sequelize.STRING
  },
  elo: {
    type: Sequelize.FLOAT,
    defaultValue: 500.0
  },
  backupElo: {
    type: Sequelize.FLOAT
  },
  bestElo: {
    type: Sequelize.FLOAT,
    defaultValue: 500.0
  },
  wins: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  losses: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  games: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  streak: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  bestStreak: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  vanquished: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  internal: {
    type: Sequelize.BOOLEAN
  },
  inactive: {
      type: Sequelize.BOOLEAN,  
      defaultValue: false
  },
  playerId: {
      type: Sequelize.STRING
  }
})
