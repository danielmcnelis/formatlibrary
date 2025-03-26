import { Status } from '@fl/models'

export const getStatuses = async (req, res, next) => {
  try {
    const { name, banlist } = req.headers
    const category = req.headers?.category || 'TCG'
    const status = await Status.findOne({
      where: {
        cardName: name,
        banlist: banlist,
        category: category
      }
    })

    return res.json(status)
  } catch (err) {
    next(err)
  }
}
