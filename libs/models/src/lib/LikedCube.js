
import { Sequelize } from 'sequelize'
import { db } from './db'

export const LikedCube = db.define('likedCubes', {
  playerId: {
    type: Sequelize.STRING
  },
  cubeId: {
    type: Sequelize.INTEGER
  }
})
