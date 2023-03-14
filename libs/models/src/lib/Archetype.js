
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Cube = db.define('cubes', {
  name: {
    type: Sequelize.STRING
  },
  builder: {
    type: Sequelize.STRING
  },
})