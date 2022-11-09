import { Set } from '@fl/models'

export const setsBoosters = async (req, res, next) => {
  try {
    const sets = await Set.findAll({
      where: {
        booster: true
      },
      attributes: ['id', 'setName', 'setCode', 'tcgDate'],
      order: [['tcgDate', 'ASC']]
    })

    res.json(sets)
  } catch (err) {
    next(err)
  }
}
