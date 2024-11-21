import { Sequelize } from 'sequelize'
import { db } from './db'

export const Server = db.define('servers', {
  id: {
    primaryKey: true,
    type: Sequelize.STRING
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  communityName: {
    type: Sequelize.STRING
  },
  access: {
    type: Sequelize.STRING,
    defaultValue: 'free'
  },
  format: {
    type: Sequelize.STRING
  },
  internalLadder: {
    type: Sequelize.BOOLEAN
  },
  size: {
    type: Sequelize.INTEGER
  },
  ownerId: {
    type: Sequelize.STRING
  },
  logo: {
    type: Sequelize.STRING
  },
  emoji: {
    type: Sequelize.STRING
  },
  challongeAPIKey: {
      type: Sequelize.STRING
  },
  challongeSubdomain: {
      type: Sequelize.STRING
  },
  challongePremium: {
      type: Sequelize.BOOLEAN
  },
  welcomeChannel: {
      type: Sequelize.STRING
  },
  botSpamChannel: {
      type: Sequelize.STRING
  },
  adminRole: {
      type: Sequelize.STRING
  },
  modRole: {
      type: Sequelize.STRING
  },
  judgeRole: {
      type: Sequelize.STRING
  },
  tourRole: {
      type: Sequelize.STRING
  },
  inviteLink: {
    type: Sequelize.STRING
  },
  discordIconId: {
    type: Sequelize.STRING
  },
  logoUrl: {
    type: Sequelize.STRING
  }
})

Server.findById = async (id) => await Server.findOne({ where: { id }})

Server.findOrCreateByIdOrName = async (id, name) => {
    const server = await Server.findOrCreate({ where: { id, name }})
    return server?.[0]
}