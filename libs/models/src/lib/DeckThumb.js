
import { Sequelize } from 'sequelize'
import { db } from './db'

export const DeckThumb = db.define('deckThumbs', {
  name: {
    type: Sequelize.STRING
  },
  formatName: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
  },
  primary: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  leftCard: {
    type: Sequelize.STRING
  },
  leftCardArtworkId: {
    type: Sequelize.STRING
  },
  centerCard: {
    type: Sequelize.STRING
  },
  centerCardArtworkId: {
    type: Sequelize.STRING
  },
  rightCard: {
    type: Sequelize.STRING
  },
  rightCardArtworkId: {
    type: Sequelize.STRING
  },
  deckTypeId: {
    type: Sequelize.INTEGER
  }
})
