import { Sequelize } from 'sequelize'
import { db } from './db'

export const Set = db.define('sets', {
  name: {
    type: Sequelize.STRING
  },
  setCode: {
    type: Sequelize.STRING
  },
  releaseDate: {
    type: Sequelize.STRING
  },
  legalDate: {
    type: Sequelize.STRING
  },
  isBooster: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  isCore: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  isMini: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  isDraftable: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  size: {
    type: Sequelize.INTEGER
  },
  packSize: {
    type: Sequelize.INTEGER
  },
  originals: {
    type: Sequelize.INTEGER
  },
  tcgPlayerGroupId: {
    type: Sequelize.INTEGER
  }
})
