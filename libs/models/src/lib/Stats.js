import { Sequelize } from 'sequelize'
import { db } from './db'

export const Stats = db.define('stats', {
  formatId: {
    type: Sequelize.INTEGER
  },
  formatName: {
    type: Sequelize.STRING
  },
  elo: {
    type: Sequelize.FLOAT,
    defaultValue: 500.0
  },
  seasonalElo: {
    type: Sequelize.FLOAT,
    defaultValue: 500.0
  },
  classicElo: {
    type: Sequelize.FLOAT,
    defaultValue: 500.0
  },
  backupElo: {
    type: Sequelize.FLOAT,
    defaultValue: 500.0
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
  currentStreak: {
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
  isInternal: {
    type: Sequelize.BOOLEAN
  },
  isActive: {
      type: Sequelize.BOOLEAN,  
      defaultValue: true
  },
  playerId: {
      type: Sequelize.STRING
  },
  playerName: {
      type: Sequelize.STRING
  }
})
