
import { Ruling } from '@fl/models'


export const updateRuling = async (req, res, next) => {
    try {
        const ruling = await Ruling.findOne({
            where: {
                id: req.query.id
            }
        })
        
        await ruling.update({ content: req.body.content })
        res.sendStatus(200)
    } catch (err) {
        next(err)
    }
}

export const deleteRuling = async (req, res, next) => {
    try {
        const ruling = await Ruling.findOne({
            where: {
                id: req.query.id
            }
        })
        
        await ruling.destroy()
        res.sendStatus(200)
    } catch (err) {
        next(err)
    }
}