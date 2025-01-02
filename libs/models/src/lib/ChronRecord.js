
import { Sequelize } from 'sequelize'
import { db } from './db'

export const ChronRecord = db.define('chronRecords', {
  function: {
    type: Sequelize.STRING
  },
  status: {
    type: Sequelize.STRING
  },
  runTime: {
    type: Sequelize.FLOAT
  }
})
