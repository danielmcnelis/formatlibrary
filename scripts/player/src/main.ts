import { Player } from '@fl/models'
import { Op } from 'sequelize'

const email = process.argv[2] || 'dwm253@gmail.com'

;(async () => {
  try {
    await Player.findOne({
      where: {
        email: { [Op.iLike]: email },
        hidden: false
      },
      attributes: ['id', 'name', 'discordId', 'discriminator', 'firstName', 'lastName', 'duelingBook']
    })

    process.exit()
  } catch (e) {
    console.error('Error: ', e)
  }
})()
