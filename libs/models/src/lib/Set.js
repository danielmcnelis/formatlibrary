import { Sequelize } from 'sequelize'
import { db } from './db'

export const Set = db.define('sets', {
  setName: {
    type: Sequelize.STRING
  },
  setCode: {
    type: Sequelize.STRING
  },
  tcgDate: {
    type: Sequelize.STRING
  },
  booster: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  core: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  mini: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  draftable: {
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
  },
  game: {
    type: Sequelize.STRING,
    defaultValue: 'YGO'
  },
  legalDate: {
    type: Sequelize.STRING
  }
})
