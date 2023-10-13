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
  cardsPerPack: {
    type: Sequelize.INTEGER
  },
  commonsPerPack: {
    type: Sequelize.STRING
  },
  raresPerPack: {
    type: Sequelize.STRING
  },
  supersPerPack: {
    type: Sequelize.STRING
  },
  ultrasPerPack: {
    type: Sequelize.STRING
  },
  secretsPerPack: {
    type: Sequelize.STRING
  },
  packsPerBox: {
    type: Sequelize.INTEGER
  },
  commonsPerBox: {
    type: Sequelize.INTEGER
  },
  raresPerBox: {
    type: Sequelize.INTEGER
  },
  supersPerBox: {
    type: Sequelize.INTEGER
  },
  ultrasPerBox: {
    type: Sequelize.INTEGER
  },
  secretsPerBox: {
    type: Sequelize.INTEGER
  }
})
