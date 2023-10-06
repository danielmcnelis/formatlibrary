
import { Sequelize } from 'sequelize'
import { db } from './db'

export const CubeDraft = db.define('cubeDrafts', {
    cubeName: {
        type: Sequelize.INTEGER
    },
    cubeId: {
        type: Sequelize.INTEGER
    },
    hostName: {
        type: Sequelize.STRING
    },
    hostId: {
        type: Sequelize.STRING
    },
    playerCount: {
        type: Sequelize.INTEGER
    },
    state: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
    },
    round: {
        type: Sequelize.INTEGER,
        defaultValue: 1
    },
    pick: {
        type: Sequelize.INTEGER,
        defaultValue: 1
    },
    packsPerPlayer: {
        type: Sequelize.INTEGER
    },
    packSize: {
        type: Sequelize.INTEGER
    },
    shareLink: {
        type: Sequelize.STRING
    }
})

CubeDraft.generateShareLink = async () => {
    const base52 = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    return import('nanoid').then(({ customAlphabet }) => customAlphabet(base52, 8)())
}