import { ForgedInventory } from '@fl/models'
// import { Op } from 'sequelize'
// import * as fs from 'fs'

export const countForgedCards = async (req, res, next) => {
    try {
        const booster = req.query.booster

        const filter = req.query.filter ? req.query.filter.split(',').reduce((reduced, val) => {
            let [field, operator, value] = val.split(':')
            if (value.startsWith('arr(') && value.endsWith(')')) value = (value.slice(4, -1)).split(';')
            reduced[field] = {operator, value}
            return reduced
        }, {}) : {}

        const count = await ForgedInventory.countResults(filter, booster)
        return res.json(count)
    } catch (err) {
        next(err)
    }
}

export const getForgedCards = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit || 10)
        if (limit > 100) return res.json({})
        const page = parseInt(req.query.page || 1)
        const booster = req.query.booster

        const filter = req.query.filter ? req.query.filter.split(',').reduce((reduced, val) => {
            let [field, operator, value] = val.split(':')
            if (value.startsWith('arr(') && value.endsWith(')')) value = (value.slice(4, -1)).split(';')
            reduced[field] = {operator, value}
            return reduced
        }, {}) : {}
        
        if (req.headers.name) filter.name = {operator: 'inc', value: req.headers.name}
        if (req.headers.description) filter.description = {operator: 'inc', value: req.headers.description}

        const sort = req.query.sort ? req.query.sort.split(',').reduce((reduced, val) => {
            const [field, value] = val.split(':')
            reduced.push([field, value])
            return reduced
        }, []) : []

        sort.push(['name', 'asc'])
        const cards = await ForgedInventory.find(filter, booster, limit, page, sort)
        return res.json(cards)
    } catch (err) {
        next(err)
    }
}