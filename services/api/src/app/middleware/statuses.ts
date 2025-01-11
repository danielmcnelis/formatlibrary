import { Status } from '@fl/models'

export const statusesQuery = async (req, res, next) => {
  try {
    const { name, banlist } = req.headers
    const category = req.headers?.category || 'TCG'
    console.log(name, banlist, category)
    const status = await Status.findOne({
      where: {
        cardName: name,
        banlist: banlist,
        category: category
      }
    })

    res.json(status)
  } catch (err) {
    next(err)
  }
}
