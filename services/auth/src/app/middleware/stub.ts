import { Player } from '@fl/models'

export const stub = async (req, res, next) => {
  try {
    const id = await Player.genid()
    res.json({ id })
  } catch (err) {
    next(err)
  }
}
