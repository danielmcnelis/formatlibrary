import { Player } from '@fl/models'
import { Op } from 'sequelize'

// console.log('args: ', process.argv)
const email = process.argv[2] || 'dwm253@gmail.com'

;(async () => {
  try {
    const player = await Player.findOne({
      where: {
        email: { [Op.iLike]: email },
        hidden: false
      },
      attributes: ['id', 'name', 'discordId', 'discriminator', 'firstName', 'lastName', 'duelingBook']
    })

    console.log('player: ', player)
    process.exit()
  } catch (e) {
    console.error('Error: ', e)
  }
})()
