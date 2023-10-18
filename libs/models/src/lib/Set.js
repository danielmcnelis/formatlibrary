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
    type: Sequelize.BOOLEAN
  },
  size: {
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
