
import { Ruling } from '@fl/models'


export const deleteRuling = async (req, res, next) => {
    try {
        const ruling = await Ruling.findOne({
            where: {
                id: req.query.id
            }
        })
        
        await ruling.destroy()
        res.json(200)
    } catch (err) {
        next(err)
    }
}