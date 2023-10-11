import { Card, Cube, CubeDraft, Player } from '@fl/models'
import { Op } from 'sequelize'
const Canvas = require('canvas')
import { S3 } from 'aws-sdk'
import { config } from '@fl/config'

// CUBES ID
export const cubesId = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id)
      const shareLink = req.params.id
      const view = req.query?.view
      
      const cube = await Cube.findOne({
          where: !isNaN(id) ? {
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
  
      const cardPool = []
      const konamiCodes = cube.ydk
        .split('#main')[1]
        .split('#extra')[0]
        .split('\n')
        .filter((e) => e.length)
  
      for (let i = 0; i < konamiCodes.length; i++) {
        let konamiCode = konamiCodes[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode
        const card = await Card.findOne({
          where: {
            konamiCode: konamiCode
          },
          attributes: { exclude: ['tcgLegal', 'ocgLegal', 'ocgDate', 'speedLegal', 'speedDate', 'createdAt', 'updatedAt'] },
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
      console.log('cube', cube)
      console.log('cardPool', cardPool)
  
      cube.views++
      await cube.save()
  
      const data = {
        ...cube.dataValues,
        cardPool
      }
  
      res.json(data)
    } catch (err) {
      next(err)
    }
  }

export const cubesReadYdk = async (req, res, next) => {
    try {
        const cardPool = []
        const konamiCodes = req.body.ydk.split('#main')[1].split('#extra')[0].split('\n').filter((e) => e.length)
        
        for (let i = 0; i < konamiCodes.length; i++) {
            let konamiCode = konamiCodes[i]
            while (konamiCode.length < 8) konamiCode = '0' + konamiCode
            const card = await Card.findOne({ 
                where: { 
                    konamiCode: konamiCode
                },
                attributes: ['name', 'id', 'konamiCode', 'ypdId', 'sortPriority'],
            })

            if (!card) continue
            cardPool.push(card)
        }

        const data = {
            name: req.body.name,
            cardPool
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
  
  export const cubesAll = async (req, res, next) => {
    try {    
        const cubes = await Cube.findAll({
          display: true,
        })
    
        res.json(cubes)
      } catch (err) {
        next(err)
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
        const mainArr = cube.ydk.split('#main')[1].split('\n').filter((e) => e.length) || []
        const main = []
        
        for (let i = 0; i < mainArr.length; i++) {
            let konamiCode = mainArr[i]
            while (konamiCode.length < 8) konamiCode = '0' + konamiCode
            const card = await Card.findOne({ where: { konamiCode: konamiCode }})
            if (!card) continue
            main.push(card)
        }
    
        // main.sort((a: never, b: never) => {
        //     if (a.sortPriority > b.sortPriority) {
        //         return 1
        //     } else if (b.sortPriority > a.sortPriority) {
        //         return -1
        //     } else if (a.name > b.name) {
        //         return 1
        //     } else if (b.name > a.name) {
        //         return -1
        //     } else {
        //         return false
        //     }
        // })
    
        const card_width = 72
        const card_height = 105
        const canvas = Canvas.createCanvas(card_width * main.length, card_height)
        const context = canvas.getContext('2d')
    
        for (let i = 0; i < main.length; i++) {
            const card = main[i]
            const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`) 
            context.drawImage(image, card_width * i, 0, card_width, card_height)
        }
    
        const buffer = canvas.toBuffer('image/png')
        const s3 = new S3({
            region: config.s3.region,
            credentials: {
                accessKeyId: config.s3.credentials.accessKeyId,
                secretAccessKey: config.s3.credentials.secretAccessKey
            }
        })
    
        const { Location: uri} = await s3.upload({ Bucket: 'formatlibrary', Key: `images/cubes/slideshows/${cube.id}.png`, Body: buffer, ContentType: `image/png` }).promise()
        console.log('uri', uri)
        res.json(uri)
    } catch (err) {
        next(err)
    }
  }


export const cubesLaunch = async (req, res, next) => {
    try {  
      const cube = await Cube.findOne({
        where: {
            id: req.body.cubeId
        }
      })

      const player = await Player.findOne({
        where: {
            id: req.body.hostId
        }
      })

      const shareLink = await CubeDraft.generateShareLink()

      const cubeDraft = await CubeDraft.create({
        cubeId: cube.id,
        cubeName: `${cube.name} by ${cube.builder}`,
        hostName: player.name,
        hostId: player.id,
        packSize: req.body.packSize,
        packsPerPlayer: req.body.packsPerPlayer,
        timer: req.body.timer,
        shareLink: shareLink
      })

      res.json(`https://formatlibrary.com/drafts/${cubeDraft.shareLink}`)
    } catch (err) {
      next(err)
    }
  }