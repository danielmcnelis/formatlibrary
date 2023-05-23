
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Alius = db.define('aliuses', {     
    formerName: {
        type: Sequelize.STRING
    },
    currentName: {
        type: Sequelize.STRING
    },
    playerId: {
      type: Sequelize.STRING
    }
})
