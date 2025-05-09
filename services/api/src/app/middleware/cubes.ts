import { Card, Cube, Draft, Player } from '@fl/models'
const Canvas = require('canvas')
import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import { config } from '@fl/config'

// CUBES ID
export const getCubeById = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id)
      const view = req.query?.view
      
      const cube = await Cube.findOne({
          where: {
              id: id
          },
          attributes: [
              'id',
              'name',
              'ydk',
              'builderName',
              'builderId',
              'downloads',
              'views',
              'rating'
          ],
          include: [
              { model: Player, as: 'builder', attributes: ['id', 'name', 'discordId', 'discordPfp'] }
          ]
      })
  
      if (!cube) return res.sendStatus(404)
  
      const cardPool = []
      const konamiCodes = cube.ydk
        .split('#main')[1]
        .split('#extra')[0]
        .split(/[\s]+/)
        .filter((e) => e.length)
  
      for (let i = 0; i < konamiCodes.length; i++) {
        let konamiCode = konamiCodes[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        const card = await Card.findOne({
          where: {
            konamiCode: konamiCode
          },
          attributes: { exclude: ['isTcgLegal', 'isOcgLegal', 'ocgDate', 'isSpeedLegal', 'speedDate', 'createdAt', 'updatedAt'] },
        })
  
        if (!card) {
            console.log(`bad cube konamiCode:`, konamiCode)
            continue
        }
        cardPool.push(card)
      }
  
      const sortFn = view === 'browser' ? (a, b) => {
        if (a.name > b.name) {
          return 1
        } else if (b.name > a.name) {
          return -1
        } else {
          return 0
        }
      } : (a, b) => {
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
  
      cardPool.sort(sortFn)
      cube.views++
      await cube.save()
  
      const data = {
        ...cube.dataValues,
        cardPool
      }
  
      return res.json(data)
    } catch (err) {
      next(err)
    }
  }

export const readCubeYdk = async (req, res, next) => {
    try {
        const cardPool = []
        const konamiCodes = req.body.ydk.split('#main')[1].split('#extra')[0].split(/[\s]+/).filter((e) => e.length)
        
        for (let i = 0; i < konamiCodes.length; i++) {
            let konamiCode = konamiCodes[i]
            while (konamiCode.length < 8) konamiCode = '0' + konamiCode
            const card = await Card.findOne({ 
                where: { 
                    konamiCode: konamiCode
                },
                attributes: ['name', 'cleanName', 'id', 'konamiCode', 'artworkId', 'sortPriority'],
            })

            if (!card) continue
            cardPool.push(card)
        }

        const data = {
            name: req.body.name,
            cardPool
        }

        return res.json(data)
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
                builderId: player.id
            },
            attributes: ['id', 'name', 'ydk'],
            order: [['name', 'ASC']]
        })

        return res.json(cubes)
    } catch (err) {
        next(err)
    }
}


export const updateCube = async (req, res, next) => {
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

export const createCube = async (req, res, next) => {
    try {
      const player = await Player.findOne({ where: { id: req.body.builderId } })
  
      const cube = await Cube.create({
        name: req.body.name,
        builder: player.name,
        builderId: player.id,
        ydk: req.body.ydk,
        display: req.body.display
      })
  
      return res.json(cube)
    } catch (err) {
      next(err)
    }
  }

export const getAllCubes = async (req, res, next) => {
  try {    
      const cubes = await Cube.findAll({
          where: {
              display: true
          }
      })
  
      return res.json(cubes)
    } catch (err) {
      next(err)
    }
}

export const publishCube = async (req, res, next) => {
  try {
      const cube = await Cube.findOne({ 
          where: {
              id: req.params.id
          }
      })

      await cube.update({ display: true })
      res.sendStatus(200)
  } catch (err) {
      console.log(err)
  }
}

export const unpublishCube = async (req, res, next) => {
    try {
        const cube = await Cube.findOne({ 
            where: {
                id: req.params.id
            }
        })

        await cube.update({ display: false })
        res.sendStatus(200)
    } catch (err) {
        console.log(err)
    }
}


export const drawCube = async (req, res, next) => {  
  try {
      const cube = await Cube.findOne({
          where: {
              id: req.params.id
          },
          attributes: [
              'id',
              'ydk'
          ]
      })
  
      if (!cube) return res.sendStatus(404)
      const mainArr = cube.ydk.split('#main')[1].split(/[\s]+/).filter((e) => e.length) || []
      const main = []
      
      for (let i = 0; i < mainArr.length; i++) {
          let konamiCode = mainArr[i]
          while (konamiCode.length < 8) konamiCode = '0' + konamiCode
          const card = await Card.findOne({ where: { konamiCode: konamiCode }})
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
  
      const card_width = 72
      const card_height = 105
      const canvas = Canvas.createCanvas(card_width * main.length, card_height)
      const context = canvas.getContext('2d')
  
      for (let i = 0; i < main.length; i++) {
          const card = main[i]
          const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`) 
          context.drawImage(image, card_width * i, 0, card_width, card_height)
      }
  
      const buffer = canvas.toBuffer('image/png')
      const s3 = new S3({
          region: config.s3.region,
          credentials: {
              accessKeyId: config.s3.credentials.accessKeyId,
              secretAccessKey: config.s3.credentials.secretAccessKey
          },
      })
  
      const { Location: uri} = await new Upload({
          client: s3,
          params: { Bucket: 'formatlibrary', Key: `images/cubes/slideshows/${cube.id}.png`, Body: buffer, ContentType: `image/png` },
      }).done()
      console.log('uri', uri)
      return res.json(uri)
  } catch (err) {
      next(err)
  }
}

