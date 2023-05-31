
import { Sequelize } from 'sequelize'
import { db } from './db'

export const OPCard = db.define('cards', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  category: {
    type: Sequelize.STRING
  },
  color: {
    type: Sequelize.STRING
  },
  cost: {
    type: Sequelize.INTEGER
  },
  power: {
    type: Sequelize.INTEGER
  },
  life: {
    type: Sequelize.INTEGER
  },
  counter: {
    type: Sequelize.INTEGER
  },
  attribute: {
    type: Sequelize.STRING
  },
  type: {
    type: Sequelize.STRING
  },
  effect: {
    type: Sequelize.TEXT
  },
  easternLegal: {
    type: Sequelize.BOOLEAN
  },
  westernLegal: {
    type: Sequelize.BOOLEAN
  },
  easternDate: {
    type: Sequelize.STRING
  },
  westernDate: {
    type: Sequelize.STRING
  },
  cardCode: {
    type: Sequelize.STRING
  },
  blockCode: {
    type: Sequelize.STRING
  },
  rarity: {
    type: Sequelize.STRING
  },
  artwork: {
    type: Sequelize.STRING
  },
  artist: {
    type: Sequelize.STRING
  }
})