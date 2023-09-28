import { Card, Cube, Player } from '@fl/models'
import { Op } from 'sequelize'

// CUBES ID
export const cubesId = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id)
      const shareLink = req.params.id
      const isAdmin = req.query.isAdmin
      
      const cube = await Cube.findOne({
          where: !isNaN(id) && isAdmin === 'true' ? {
              id: id
          } : !isNaN(id) ? {
              id: id,
              display: true,
          } : {
              shareLink: shareLink,
              linkExpiration: {[Op.gte]: new Date()}
          },
          attributes: [
              'id',
              'name',
              'ydk',
              'builder',
              'playerId',
              'publishDate',
              'downloads',
              'views',
              'rating'
          ],
          include: [
              { model: Player, attributes: ['id', 'name', 'discriminator', 'discordName', 'discordId', 'discordPfp'] }
          ]
      })
  
      if (!cube) return res.sendStatus(404)
  
      const main = []
      const mainKonamiCodes = cube.ydk
        .split('#main')[1]
        .split('#extra')[0]
        .split('\n')
        .filter((e) => e.length)
  
      for (let i = 0; i < mainKonamiCodes.length; i++) {
        let konamiCode = mainKonamiCodes[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        const card = await Card.findOne({
          where: {
            konamiCode: konamiCode
          },
          attributes: ['name', 'id', 'ypdId', 'sortPriority']
        })
  
        if (!card) continue
        main.push(card)
      }
  
      const sortFn = (a, b) => {
        if (a.sortPriority > b.sortPriority) {
          return 1
        } else if (b.sortPriority > a.sortPriority) {
          return -1
        } else if (a.name > b.name) {
          return 1
        } else if (b.name > a.name) {
          return -1
        } else {
          return 0
        }
      }
  
      main.sort(sortFn)
  
      cube.views++
      await cube.save()
  
      const data = {
        ...cube.dataValues,
        main
      }
  
      res.json(data)
    } catch (err) {
      next(err)
    }
  }

export const cubesReadYdk = async (req, res, next) => {
    try {
        const main = []
        const mainKonamiCodes = req.body.ydk.split('#main')[1].split('#extra')[0].split('\n').filter((e) => e.length)
        
        for (let i = 0; i < mainKonamiCodes.length; i++) {
            let konamiCode = mainKonamiCodes[i]
            while (konamiCode.length < 8) konamiCode = '0' + konamiCode
            const card = await Card.findOne({ 
                where: { 
                    konamiCode: konamiCode
                },
                attributes: ['name', 'id', 'konamiCode', 'ypdId', 'sortPriority'],
            })

            if (!card) continue
            main.push(card)
        }

        const data = {
            name: req.body.name,
            main
        }

        res.json(data)
    } catch (err) {
        console.log(err)
        next(err)
    }
}

// GET MY CUBES
export const getMyCubes = async (req, res, next) => {
    const playerId = req.user?.playerId

    try {
        const player = await Player.findOne({
            where: {
                id: playerId
            }
        })

        if (!player) return res.json([])

        const cubes = await Cube.findAll({ 
            where: {
                playerId: player.id
            },
            attributes: ['id', 'name', 'ydk'],
            order: [['name', 'ASC']]
        })

        return res.json(cubes)
    } catch (err) {
        next(err)
    }
}


export const cubesUpdateId = async (req, res, next) => {
    try {
        const cube = await Cube.findOne({ 
            where: {
                id: req.params.id
            }
        })

        await cube.update({ 
            name: req.body.name,
            ydk: req.body.ydk
        })

        res.sendStatus(200)
    } catch (err) {
        console.log(err)
        next(err)
    }
}

export const cubesCreate = async (req, res, next) => {
    console.log('cubesCreate()')
    console.log('req.body', req.body)
    
    try {
      const player = await Player.findOne({ where: { id: req.body.playerId } })
  
      const cube = await Cube.create({
        builder: player.name,
        playerId: player.id,
        ydk: req.body.ydk,
        publishDate: req.body.publishDate,
        display: req.body.display
      })
  
      res.json(cube)
    } catch (err) {
      next(err)
    }
  }
  