
import { Sequelize } from 'sequelize'
import { db } from './db'

export const OPDeck = db.define('opDecks', {
  name: {
    type: Sequelize.STRING
  },
  leader: {
    type: Sequelize.STRING
  },
  color: {
    type: Sequelize.STRING
  },
  builder: {
    type: Sequelize.STRING
  },
  playerId: {
    type: Sequelize.STRING
  },
  formatName: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
  },
  origin: {
    type: Sequelize.STRING
  },
  opdk: {
    type: Sequelize.TEXT
  },
  eventName: {
    type: Sequelize.STRING
  },
  publishDate: {
    type: Sequelize.DATE
  },
  eventId: {
    type: Sequelize.INTEGER
  },
  community: {
    type: Sequelize.STRING
  },
  placement: {
    type: Sequelize.INTEGER
  },
  display: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  url: {
    type: Sequelize.STRING
  }
})