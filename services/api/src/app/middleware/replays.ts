
import { Replay } from '@fl/models'

export const countReplays = async (req, res, next) => {
    try {
        const filter = req.query.filter ? req.query.filter.split(',').reduce((reduced, val) => {
            let [field, operator, value] = val.split(':')
            if (value.startsWith('arr(') && value.endsWith(')')) value = (value.slice(4, -1)).split(';')
            reduced[field] = {operator, value}
            return reduced
        }, { display: {operator: 'eq', value: 'true'} }) : { display: {operator: 'eq', value: 'true'} }

        const count = await Replay.countResults(filter)
        res.json(count)
    } catch (err) {
        next(err)
    }
}

export const getReplays = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit || 10)
        const page = parseInt(req.query.page || 1)

        const filter = req.query.filter ? req.query.filter.split(',').reduce((reduced, val) => {
            let [field, operator, value] = val.split(':')
            if (value.startsWith('arr(') && value.endsWith(')')) value = (value.slice(4, -1)).split(';')
            reduced[field] = {operator, value}
            return reduced
        }, { display: {operator: 'eq', value: 'true'} }) : { display: {operator: 'eq', value: 'true'} }

        const sort = req.query.sort ? req.query.sort.split(',').reduce((reduced, val) => {
            reduced.push(val.split(':'))
            return reduced
        }, []) : [['publishDate', 'desc'], ['suggestedOrder', 'desc']]

        const replays = await Replay.find(filter, limit, page, sort)
        res.json(replays)
    } catch (err) {
        next(err)
    }
}
