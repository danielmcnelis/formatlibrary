import { Op, Sequelize } from 'sequelize'
import { Format } from './Format'
import { Player } from './Player'
import { Team } from './Team'
import { db } from './db'

export const Event = db.define('events', {
  name: {
    type: Sequelize.STRING
  },
  abbreviation: {
    type: Sequelize.STRING
  },
  formatName: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
  },
  referenceUrl: {
    type: Sequelize.STRING
  },
  display: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  primaryTournamentId: {
    type: Sequelize.STRING
  },
  topCutTournamentId: {
    type: Sequelize.STRING
  },
  winnerName: {
    type: Sequelize.STRING
  },
  winnerId: {
    type: Sequelize.STRING
  },
  winningDeckTypeName: {
    type: Sequelize.INTEGER
  },
  winningDeckId: {
    type: Sequelize.INTEGER
  },
  winningTeamName: {
    type: Sequelize.STRING
  },
  winningTeamId: {
    type: Sequelize.INTEGER
  },
  size: {
    type: Sequelize.INTEGER
  },
  type: {
    type: Sequelize.STRING
  },
  isTeamEvent: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  communityName: {
    type: Sequelize.STRING
  },
  serverId: {
    type: Sequelize.STRING
  },
  seriesId: {
    type: Sequelize.INTEGER
  },
  startedAt: {
    type: Sequelize.DATE
  },
  endDate: {
    type: Sequelize.DATE
  },
  isRepresentative: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
})

Event.countResults = async (filter = {}) => {
    filter = Object.entries(filter).reduce((reduced, [key, by]) => {
        let value = by.value
        if (typeof value === 'string') value.replaceAll('%20', ' ')
        let operator = by.operator
        if (['display'].includes(key)) { value = value.toLowerCase() === 'true' }
        // if (['size', 'primaryTournamentId', 'formatId'].includes(key)) { value = parseInt(value) }

        if (['name'].includes(key)) { 
            key = Op.or
            value = {
                abbreviation: {[Op.iLike]: `%${value}%`},
                name: {[Op.iLike]: `%${value}%`}
            }
        } else if (['winner'].includes(key)) { 
            key = 'winnerName'
        } else if (['community'].includes(key)) { 
            key = 'communityName'
        } else if (['format'].includes(key)) {
            key = 'formatName'
        }

        if (operator === 'eq') {
            operator = Op.eq
        } else if (operator === 'not') {
            operator = Op.not
        } else if (operator === 'like') {
            operator = Op.iLike
        } else if (operator === 'gt') {
            operator = Op.gt
        } else if (operator === 'gte') {
            operator = Op.gte
        } else if (operator === 'lt') {
            operator = Op.lt
        } else if (operator === 'lte') {
            operator = Op.lte
        } else if (operator === 'or') {
            operator = Op.or
        } else if (operator === 'and') {
            operator = Op.and
        } else if (operator === 'inc') {
            operator = Op.iLike
            value = '%' + value + '%'
        } else if (operator === 'btw') {
            operator = Op.and
            value = {[Op.gte]: parseInt(value[0]), [Op.lte]: parseInt(value[1])}
        }

        reduced[key] = {[operator]: value}
        return reduced
    }, {})

    const query = filter.name
    delete filter.name
    if (query) filter = {[Op.or]: [{name: query}, {abbreviation: query}], ...filter}

    const count = await Event.count({ 
        where: filter
    })

    return count
}

Event.find = async (filter = {}, limit = 12, page = 1, sort = []) => {
    filter = Object.entries(filter).reduce((reduced, [key, by]) => {
        let value = by.value
        if (typeof value === 'string') value.replaceAll('%20', ' ')
        let operator = by.operator
        if (['display'].includes(key)) { value = value.toLowerCase() === 'true' }
       
        if (['name'].includes(key)) { 
            key = Op.or
            value = {
                abbreviation: {[Op.iLike]: `%${value}%`},
                name: {[Op.iLike]: `%${value}%`}
            }
        } else if (['winner'].includes(key)) { 
            key = 'winnerName'
        } else if (['community'].includes(key)) { 
            key = 'communityName'
        } else if (['format'].includes(key)) {
            key = 'formatName'
        }

        if (operator === 'eq') {
            operator = Op.eq
        } else if (operator === 'not') {
            operator = Op.not
        } else if (operator === 'like') {
            operator = Op.iLike
        } else if (operator === 'gt') {
            operator = Op.gt
        } else if (operator === 'gte') {
            operator = Op.gte
        } else if (operator === 'lt') {
            operator = Op.lt
        } else if (operator === 'lte') {
            operator = Op.lte
        } else if (operator === 'or') {
            operator = Op.or
        } else if (operator === 'and') {
            operator = Op.and
        } else if (operator === 'inc') {
            operator = Op.iLike
            value = '%' + value + '%'
        } else if (operator === 'btw') {
            operator = Op.and
            value = {[Op.gte]: parseInt(value[0]), [Op.lte]: parseInt(value[1])}
        }

        reduced[key] = {[operator]: value}
        return reduced
    }, {})

    const query = filter.name
    delete filter.name
    if (query) filter = {[Op.or]: [{name: query}, {abbreviation: query}], ...filter}

    const events = await Event.findAll({
        where: filter,
        offset: (page - 1) * limit,
        limit: limit,
        subQuery: false,
        attributes: { exclude: ['type', 'createdAt', 'updatedAt'] },        
        include: [
            {model: Player, as: 'winner', attributes: ['id', 'name', 'discordId', 'discordPfp', 'pfp']}, 
            {model: Team, as: 'winningTeam', attributes: ['id', 'name', 'captainId', 'playerAId', 'playerBId', 'playerCId']},
            {model: Format, attributes: ['name', 'icon']}
        ],
        order: sort
    })

    return events
}
