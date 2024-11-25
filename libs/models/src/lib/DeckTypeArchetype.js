
import { Sequelize } from 'sequelize'
import { db } from './db'

export const DeckTypeArchetype = db.define('deckTypeArchetypes', {
  deckTypeName: {
    type: Sequelize.STRING
  },
  deckTypeId: {
    type: Sequelize.INTEGER
  },
  archetypeName: {
    type: Sequelize.STRING
  },
  archetypeId: {
    type: Sequelize.INTEGER
  },
  isPrimary: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
})
