
import { Sequelize } from 'sequelize'
import { db } from './db'

export const Draft = db.define('drafts', {
    type: {
        type: Sequelize.STRING,
        defaultValue: 'cube'
    },
    cubeName: {
        type: Sequelize.STRING
    },
    cubeId: {
        type: Sequelize.INTEGER
    },
    setName: {
        type: Sequelize.STRING
    },
    setId: {
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
    timer: {
        type: Sequelize.INTEGER,
        defaultValue: 60
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

Draft.generateShareLink = async () => {
    const base52 = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    return import('nanoid').then(({ customAlphabet }) => customAlphabet(base52, 8)())
}