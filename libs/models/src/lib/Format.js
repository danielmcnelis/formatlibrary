import { Sequelize, Op } from 'sequelize'
import { db } from './db'

export const Format = db.define('formats', {
  name: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  cleanName: {
    type: Sequelize.STRING
  },
  abbreviation: {
    type: Sequelize.STRING
  },
  date: {
    type: Sequelize.STRING
  },
  banlist: {
    type: Sequelize.STRING
  },
  event: {
    type: Sequelize.STRING
  },
  icon: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.TEXT
  },
  blurb: {
    type: Sequelize.TEXT
  },
  videoEmbed: {
    type: Sequelize.TEXT
  },
  videoPlaylistId: {
    type: Sequelize.STRING
  },
  channel: {
    type: Sequelize.STRING
  },
  emoji: {
    type: Sequelize.STRING
  },
  role: {
    type: Sequelize.STRING
  },
  popular: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  spotlight: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  category: {
    type: Sequelize.STRING
  },
  isHighlander: {
    type: Sequelize.BOOLEAN
  },
  resetDate: {
    type: Sequelize.DATE
  }
})

Format.findById = async (id) => await Format.findOne({ where: { id }})

Format.findByServerOrChannelId = async (server, channelId) => await Format.findOne({
    where: {
        [Op.or]: {
            name: {[Op.iLike]: server?.format },
            channel: channelId
        }
    }
})

Format.findByServerOrInputOrChannelId = async (server, formatName, channelId) => await Format.findOne({
    where: {
        [Op.or]: {
            name: { [Op.iLike]: server.format || formatName },
            channel: channelId
        }
    }
})