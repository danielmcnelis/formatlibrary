import { Status } from '@fl/models'

export const statusesQuery = async (req, res, next) => {
  try {
    const { name, banlist } = req.headers
    const category = req.headers?.category || 'TCG'
    const status = await Status.findOne({
      where: {
        name: name,
        banlist: banlist,
        category: category
      }
    })

    res.json(status)
  } catch (err) {
    next(err)
  }
}
