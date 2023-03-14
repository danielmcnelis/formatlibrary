
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Archetype = db.define('archetypes', {
  name: {
    type: Sequelize.STRING
  }
})