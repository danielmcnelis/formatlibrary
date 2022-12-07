import { Player } from '@fl/models'
import { Op } from 'sequelize'
import { S3 } from 'aws-sdk'
import { config } from '@fl/config'
import * as bcrypt from 'bcrypt'

export const playersAdmin = async (req, res, next) => {
    try {
        const player = await Player.findOne({
          where: {
            id: req.params.id,
            admin: true
          }
        })

        if (player) {
            res.send(200)
        } else {
            res.send(404)
        }
      } catch (err) {
        next(err)
      }
}

export const playersQuery = async (req, res, next) => {
  try {
    const players = await Player.findAll({
      where: {
        name: { [Op.substring]: req.params.query }
      },
      attributes: ['id', 'name', 'discriminator', 'discordId', 'discordPfp', 'firstName', 'lastName'],
      order: [['name', 'ASC']]
    })

    res.json(players)
  } catch (err) {
    next(err)
  }
}

export const playersId = async (req, res, next) => {
  try {
    const player = await Player.findOne({
        where: req.query.discriminator ? ({
                name: { [Op.iLike]: req.params.id },
                discriminator: req.query.discriminator,
                hidden: false
        }) : ({
                id: { [Op.iLike]: req.params.id },
                hidden: false            
        }),
        attributes: ['id', 'email', 'name', 'discordId', 'discordPfp', 'discordName', 'discriminator', 'firstName', 'lastName', 'googleId', 'googlePfp', 'duelingBook', 'duelingBookPfp', 'country', 'timeZone', 'youtube', 'twitch', 'twitter']
    })

    const hasPassword = await Player.count({
        where: {
            id: player.id,
            hash: {[Op.not]: null}
        }
    })

    res.json({...player.dataValues, hasPassword: !!hasPassword})
  } catch (err) {
    next(err)
  }
}

export const playersAll = async (req, res, next) => {
  try {
    const players = await Player.findAll({
      attributes: ['id', 'name', 'discordId', 'discordPfp', 'discriminator', 'firstName', 'lastName', 'duelingBook'],
      order: [['name', 'ASC']]
    })

    res.json(players)
  } catch (err) {
    next(err)
  }
}

export const playersPassword = async (req, res, next) => {
    try {
        const player = await Player.findOne({ 
            where: {
                id: req.params.id
            },
            attributes: ['id', 'hash']
        })

        const newPassword = req.body.newPassword
        const oldPassword = req.body.oldPassword
        const salt = newPassword ? await bcrypt.genSalt(10) : null
        const hash = salt ? await bcrypt.hash(newPassword, salt) : null

        if (!player.hash || (player.hash && await bcrypt.compare(oldPassword, player.hash))) {
            player.hash = hash
            await player.save()
            res.sendStatus(200)
        } else {
            res.sendStatus(400)
        }
    } catch (err) {
        console.log(err)
    }
}

export const playersUpdateId = async (req, res, next) => {
    try {
        const player = await Player.findOne({ 
            where: {
                id: req.params.id
            },
            attributes: ['id', 'email', 'name', 'discordId', 'discordPfp', 'discordName', 'discriminator', 'firstName', 'lastName', 'googleId', 'googlePfp', 'duelingBook', 'duelingBookPfp', 'country', 'timeZone', 'youtube', 'twitch', 'twitter']
        })

        if (!req.body.name || !req.body.name.length) {
            res.sendStatus(400)
        } else if (req.body.youtube && req.body.youtube.length && !req.body.youtube.includes('youtube.com/channel/')) {
            res.sendStatus(400)
        } else {
            await player.update({ 
                name: req.body.name,
                duelingBook: req.body.duelingBook,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                country: req.body.country,
                timeZone: req.body.timeZone,
                youtube: req.body.youtube,
                twitch: req.body.twitch,
                twitter: req.body.twitter,
            })
    
            res.json(player)
        }
    } catch (err) {
        console.log(err)
    }
}

export const playersCreate = async (req, res, next) => {
    try {
        if (req.body.pfp) {
            const buffer = Buffer.from(req.body.pfp.replace(/^data:image\/\w+;base64,/, ''), 'base64')

            const s3 = new S3({
                region: config.s3.region,
                credentials: {
                    accessKeyId: config.s3.credentials.accessKeyId,
                    secretAccessKey: config.s3.credentials.secretAccessKey
                }
            })
        
            const { Location: uri} = await s3.upload({ 
                Bucket: 'formatlibrary', 
                Key: `images/brackets/${req.body.name}.png`, 
                Body: buffer,
                ContentType: 'image/png'
            }).promise()
        
            console.log('uri', uri)
        }

        const alreadyExists = await Player.count({
            where: {
                [Op.or]: [
                    {
                        firstName: {[Op.and]: [req.body.firstName, {[Op.not]: null}]},
                        lastName: {[Op.and]: [req.body.lastName, {[Op.not]: null}]}
                    },
                    {
                        discordName: {[Op.and]: [req.body.discordName, {[Op.not]: null}]},
                        discriminator: {[Op.and]: [req.body.discriminator, {[Op.not]: null}]}
                    }
                ]
            }
        })


        if (alreadyExists) throw new Error('This player already exists')
    
        const player = await Player.create({
            id: await Player.generateId(),
            name: req.body.name,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            discordName: req.body.discordName,
            discriminator: req.body.discriminator
        })

        res.json(player)
    } catch (err) {
      next(err)
    }
}