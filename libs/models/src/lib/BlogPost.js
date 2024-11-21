
import { Sequelize } from 'sequelize'
import { db } from './db'

export const BlogPost = db.define('blogposts', {
  eventName: {
    type: Sequelize.STRING
  },
  eventAbbreviation: {
    type: Sequelize.STRING
  },
  eventDate: {
    type: Sequelize.DATE
  },
  eventId: {
    type: Sequelize.INTEGER
  },
  winnerName: {
    type: Sequelize.STRING
  },
  winnerPfp: {
    type: Sequelize.STRING
  },
  winnerId: {
    type: Sequelize.STRING
  },
  teamName: {
    type: Sequelize.STRING
  },
  winningTeamId: {
    type: Sequelize.INTEGER
  },
  formatName: {
    type: Sequelize.STRING
  },
  formatIcon: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.STRING
  },
  winningDeckType: {
    type: Sequelize.STRING
  },
  winningDeckTypeIsPopular: {
    type: Sequelize.BOOLEAN
  },
  winningDeckId: {
    type: Sequelize.INTEGER
  },
  communityName: {
    type: Sequelize.STRING
  },
  serverInviteLink: {
    type: Sequelize.STRING
  },
  serverId: {
    type: Sequelize.INTEGER
  }
})
