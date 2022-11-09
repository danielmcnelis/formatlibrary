import { Status } from '@fl/models'

export const statusesQuery = async (req, res, next) => {
  try {
    const status = await Status.findOne({
      where: {
        name: req.headers.name,
        banlist: req.headers.banlist
      }
    })

    res.json(status)
  } catch (err) {
    next(err)
  }
}
