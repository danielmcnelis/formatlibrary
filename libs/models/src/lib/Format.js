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
  eventName: {
    type: Sequelize.STRING
  },
  latestSetCode: {
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
  videoId: {
    type: Sequelize.STRING
  },
  videoEmbed: {
    type: Sequelize.TEXT
  },
  videoPlaylistId: {
    type: Sequelize.STRING
  },
  channelId: {
    type: Sequelize.STRING
  },
  emoji: {
    type: Sequelize.STRING
  },
  roleId: {
    type: Sequelize.STRING
  },
  isPopular: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  isSpotlight: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  category: {
    type: Sequelize.STRING
  },
  isHighlander: {
    type: Sequelize.BOOLEAN
  },
  sortPriority: {
    type: Sequelize.INTEGER
  },
  seasonResetDate: {
    type: Sequelize.DATE
  },
  useSeasonalElo: {
    type: Sequelize.BOOLEAN
  },
  hostedOnFl: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  previousFormatId: {
    type: Sequelize.INTEGER
  },
  previousFormatName: {
    type: Sequelize.STRING
  },
  nextFormatId: {
    type: Sequelize.INTEGER
  },
  nextFormatName: {
    type: Sequelize.STRING
  }
})

Format.findById = async (id) => await Format.findOne({ where: { id }})

Format.findByServerOrChannelId = async (server, channelId) => await Format.findOne({
    where: {
        [Op.or]: {
            name: {[Op.iLike]: server?.formatName },
            channelId: channelId
        }
    }
})

Format.findByServerOrInputOrChannelId = async (server, formatName, channelId) => await Format.findOne({
    where: {
        [Op.or]: {
            name: { [Op.iLike]: server.formatName || formatName },
            channelId: channelId
        }
    }
})