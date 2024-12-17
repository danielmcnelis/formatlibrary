
import { Replay } from '@fl/models'
// import { getCookie } from '@fl/utils'

export const countReplays = async (req, res, next) => {
    try {
        const isAdmin = req.query.admin
        const isSubscriber = req.query.subscriber
        const display = isAdmin === 'true' ? {} :
            isSubscriber === 'true' ? { publishDate: {operator: 'not', value: null } } :
            { display: {operator: 'eq', value: true}, publishDate: {operator: 'not', value: null }}

        const filter = req.query.filter ? req.query.filter.split(',').reduce((reduced, val) => {
            let [field, operator, value] = val.split(':')
            if (value.startsWith('arr(') && value.endsWith(')')) value = (value.slice(4, -1)).split(';')
            reduced[field] = {operator, value}
            return reduced
        }, display) : display

        const count = await Replay.countResults(filter)
        res.json(count)
    } catch (err) {
        next(err)
    }
}

// FIND REPLAYS
const findReplays = async (req, display) => {
    const limit = parseInt(req.query.limit || 10)
    if (limit > 100) return {}
    const page = parseInt(req.query.page || 1)

    const filter = req.query.filter ? req.query.filter.split(',').reduce((reduced, val) => {
        let [field, operator, value] = val.split(':')
        if (value.startsWith('arr(') && value.endsWith(')')) value = (value.slice(4, -1)).split(';')
        reduced[field] = {operator, value}
        return reduced
    }, display) : display

    const sort = req.query.sort?.split(',').reduce((reduced, val) => {
        const [field, value] = val.split(':')
        reduced.push([field, value])
        return reduced
    }, [])

    const replays = await Replay.find(filter, limit, page, sort)
    return replays
}

export const getReplaysAsAdmin = async (req, res, next) => {
    try {
        const display = {}
        const replays = await findReplays(req, display)
        res.json(replays)
    } catch (err) {
        next(err)
    }
}

export const getReplaysAsSubscriber = async (req, res, next) => {
    try {
        const display = { publishDate: {operator: 'not', value: null } }
        const replays = await findReplays(req, display)
        res.json(replays)
    } catch (err) {
        next(err)
    }
}

export const getReplaysAsRegularUser = async (req, res, next) => {
    try {
        const display = { display: {operator: 'eq', value: true}, publishDate: {operator: 'not', value: null } }
        const replays = await findReplays(req, display)
        res.json(replays)
    } catch (err) {
        next(err)
    }
}
