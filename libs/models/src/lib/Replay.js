
import { Op, Sequelize } from 'sequelize'
import { Format } from './Format'
import { Event } from './Event'
import { Player } from './Player'
import { db } from './db'

export const Replay = db.define('replays', {
    url: {
        type: Sequelize.STRING
    },
    formatName: {
        type: Sequelize.STRING
    },
    formatId: {
      type: Sequelize.INTEGER
    },
    winnerName: {
        type: Sequelize.STRING
    },
    winnerId: {
        type: Sequelize.STRING
    },
    loserName: {
        type: Sequelize.STRING
    },
    loserId: {
        type: Sequelize.STRING
    },
    winningDeckType: {
        type: Sequelize.STRING
    },
    winningDeckId: {
        type: Sequelize.INTEGER
    },
    losingDeckType: {
        type: Sequelize.STRING
    },
    losingDeckId: {
        type: Sequelize.INTEGER
    },
    matchId: {
        type: Sequelize.INTEGER
    },
    tournamentId: {
        type: Sequelize.STRING,
    },
    eventAbbreviation: {
        type: Sequelize.STRING,
    },
    eventId: {
        type: Sequelize.INTEGER,
    },
    roundName: {
        type: Sequelize.STRING
    },
    roundInt: {
        type: Sequelize.INTEGER
    },
    roundAbs: {
        type: Sequelize.INTEGER
    },
    suggestedOrder: {
        type: Sequelize.INTEGER
    },
    display: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    publishDate: {
        type: Sequelize.DATE
    }
})


Replay.countResults = async (filter = {}) => {
    filter = Object.entries(filter).reduce((reduced, [key, by]) => {
        let value = by.value
        if (typeof value === 'string') value.replaceAll('%20', ' ')
        let operator = by.operator
        if (['player'].includes(key)) { 
            key = Op.or
            value = {
                winnerName: {[Op.iLike]: `%${value}%`},
                loserName: {[Op.iLike]: `%${value}%`}
            }
        }

        if (['deckType'].includes(key)) { 
            key = Op.or
            value = {
                winningDeckType: {[Op.iLike]: `%${value}%`},
                losingDeckType: {[Op.iLike]: `%${value}%`}
            }
        }

        // if (['display'].includes(key)) { value = value.toLowerCase() === 'true' }
        
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

    const count = await Replay.count({ 
        where: filter
    })

    return count
}

Replay.find = async (filter = {}, limit = 12, page = 1, sort = []) => {
    filter = Object.entries(filter).reduce((reduced, [key, by]) => {
        let value = by.value
        if (typeof value === 'string') value.replaceAll('%20', ' ')
        let operator = by.operator
        if (['player'].includes(key)) { 
            key = Op.or
            value = {
                winnerName: {[Op.iLike]: `%${value}%`},
                loserName: {[Op.iLike]: `%${value}%`}
            }
        }

        if (['deckType'].includes(key)) { 
            key = Op.or
            value = {
                winningDeckType: {[Op.iLike]: `%${value}%`},
                losingDeckType: {[Op.iLike]: `%${value}%`}
            }
        }

        // if (['display'].includes(key)) { value = value.toLowerCase() === 'true' }
       
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

    const replays = await Replay.findAll({
        where: filter,
        offset: (page - 1) * limit,
        limit: limit,
        subQuery: false,
        // attributes: { exclude: ['tournamentId', 'type', 'series', 'createdAt', 'updatedAt'] },        
        include: [
            {model: {Player, as: 'winner', id: 'winnerId'}, attributes: ['id', 'name', 'discordId', 'discordPfp']},
            {model: Player, as: 'loser', attributes: ['id', 'name', 'discordId', 'discordPfp'] },
            {model: Format, attributes: ['name', 'icon']},
            {model: Event, attributes: ['community']}
        ],
        order: sort
    })

    return replays
}
