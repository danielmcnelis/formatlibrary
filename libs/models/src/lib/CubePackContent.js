
import { Sequelize } from 'sequelize'
import { db } from './db'

export const CubePackContent = db.define('cubePackContents', {
    cardName: {
        type: Sequelize.STRING
    },
    cardId: {
        type: Sequelize.STRING,
    },
    packNumber: {
        type: Sequelize.INTEGER
    },
    cubeDraftId: {
        type: Sequelize.STRING,
    }
})