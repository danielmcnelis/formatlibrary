import { Team } from '@fl/models'

export const createTeam = async (req, res, next) => {
  try {
    const { name, eventId, captainId, playerAId, playerBId, playerCId, placement } = req.headers

    const count = await Team.count({
      where: {
        name: name,
        eventId: eventId
      }
    })

    if (!count) {
        const team = await Team.create({
            name,
            eventId,
            captainId,
            playerAId,
            playerBId,
            playerCId,
            placement
        })

        res.json(team)
    } else {
        throw Error('Team already exists.')
    }
  } catch (err) {
    next(err)
  }
}
