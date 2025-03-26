import { Player } from '@fl/models'
import { Op } from 'sequelize'
import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import { config } from '@fl/config'
import axios from 'axios';
import * as bcrypt from 'bcrypt'

export const getPlayerRoles = async (req, res, next) => {
    try {
        const playerId = req.user?.playerId
        const player = await Player.findOne({
          where: {
            id: playerId
          },
          attributes: ['id', 'isAdmin', 'isContentManager', 'isSubscriber']
        })

        return res.json(player)
      } catch (err) {
        next(err)
      }
}

export const getPlayersByPartialName = async (req, res, next) => {
  try {
    const players = await Player.findAll({
      where: {
        name: { [Op.iLike]: '%' + req.params.query + '%'}
      },
      attributes: ['id', 'name', 'discordId', 'discordPfp', 'firstName', 'lastName'],
      order: [['name', 'ASC']]
    })

    return res.json(players)
  } catch (err) {
    next(err)
  }
}

export const getPlayerById = async (req, res, next) => {
  try {
    const player = await Player.findOne({
        where: {
            [Op.or]: [
                { id: { [Op.iLike]: req.params.id }},
                { name: { [Op.iLike]: req.params.id }},
                { discordName: { [Op.iLike]: req.params.id }}
            ],
            isHidden: false            
        },
        attributes: ['id', 'name', 'discordId', 'discordPfp', 'discordName', 'firstName', 'lastName', 'googlePfp', 'duelingBookName', 'duelingBookPfp', 'country', 'timeZone', 'youtube', 'twitch', 'twitter']
    })

    const hasPassword = await Player.count({
        where: {
            id: player.id,
            hash: {[Op.not]: null}
        }
    })

    return res.json({...player.dataValues, hasPassword: !!hasPassword})
  } catch (err) {
    next(err)
  }
}

export const getPlayers = async (req, res, next) => {
  try {
    const players = await Player.findAll({
      attributes: ['id', 'name', 'discordId', 'discordPfp', 'firstName', 'lastName', 'duelingBookName'],
      order: [['name', 'ASC']]
    })

    return res.json(players)
  } catch (err) {
    next(err)
  }
}

// GET PLAYER AVATAR BY ID
export const getPlayerAvatarById = async (req, res, next) => {
    const playerId = req.params.id
    const player = await Player.findOne({
        where: {
            id: playerId
        },
        attributes: ['id', 'name', 'discordId', 'googlePfp', 'discordPfp']
    })

    try {
        await axios.head(`https://cdn.formatlibrary.com/images/pfps/${playerId}.png`)
        return res.redirect(`https://cdn.formatlibrary.com/images/pfps/${playerId}.png`)    
    } catch (err) {
        console.log('PlayerId PFP Not Found.')
    }

    try {
        await axios.head(`https://cdn.discordapp.com/avatars/${player.discordId}/${player.discordPfp}.webp`)
        return res.redirect(`https://cdn.discordapp.com/avatars/${player.discordId}/${player.discordPfp}.webp`)
    } catch (err) {
        console.log('DiscordPfp PFP Not Found.')
    }

    try {
        await axios.head(`https://cdn.formatlibrary.com/images/pfps/${player.discordId}.png`)
        return res.redirect(`https://cdn.formatlibrary.com/images/pfps/${player.discordId}.png`)
    } catch (err) {
        console.log('DiscordId PFP Not Found.')
    }

    try {
        await axios.head(`https://cdn.formatlibrary.com/images/pfps/${player.name}.png`)
        return res.redirect(`https://cdn.formatlibrary.com/images/pfps/${player.name}.png`)
    } catch (err) {
        console.log('PlayerName PFP Not Found.')
        return res.redirect(`https://cdn.discordapp.com/embed/avatars/3.png`)
    }
}

export const updatePassword = async (req, res, next) => {
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

        if (!player.hash || (player.hash && (await bcrypt.compare(oldPassword, player.hash)))) {
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

export const updatePlayer = async (req, res, next) => {
    try {
        const player = await Player.findOne({ 
            where: {
                id: req.params.id
            },
            attributes: ['id', 'email', 'name', 'discordId', 'discordPfp', 'discordName', 'firstName', 'lastName', 'googleId', 'googlePfp', 'duelingBookName', 'duelingBookPfp', 'country', 'timeZone', 'youtube', 'twitch', 'twitter']
        })

        if (!req.body.name || !req.body.name.length) {
            res.sendStatus(400)
        } else if (req.body.youtube && req.body.youtube.length && !req.body.youtube.includes('youtube.com/channel/')) {
            res.sendStatus(400)
        } else {
            await player.update({ 
                name: req.body.name,
                duelingBookName: req.body.duelingBookName,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                country: req.body.country,
                timeZone: req.body.timeZone,
                youtube: req.body.youtube,
                twitch: req.body.twitch,
                twitter: req.body.twitter,
            })
    
            return res.json(player)
        }
    } catch (err) {
        console.log(err)
    }
}


export const adminPlayerUpdate = async (req, res, next) => {
    try {
        const player = await Player.findOne({ 
            where: {
                id: req.params.id
            },
            attributes: ['id', 'name', 'firstName', 'lastName', 'country']
        })

        if (!req.body.name || !req.body.name.length) {
            res.sendStatus(400)
        } else if (req.body.youtube && req.body.youtube.length && !req.body.youtube.includes('youtube.com/channel/')) {
            res.sendStatus(400)
        } else {
            await player.update({ 
                name: req.body.name,
                duelingBookName: req.body.duelingBookName,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                country: req.body.country,
                timeZone: req.body.timeZone,
                youtube: req.body.youtube,
                twitch: req.body.twitch,
                twitter: req.body.twitter,
            })
    
            return res.json(player)
        }
    } catch (err) {
        console.log(err)
    }
}


export const createPlayer = async (req, res, next) => {
    try {
        if (req.body.pfp) {
            const buffer = Buffer.from(req.body.pfp.replace(/^data:image\/\w+;base64,/, ''), 'base64')

            const s3 = new S3({
                region: config.s3.region,
                credentials: {
                    accessKeyId: config.s3.credentials.accessKeyId,
                    secretAccessKey: config.s3.credentials.secretAccessKey
                },
            })
        
            const { Location: uri} = await new Upload({
                client: s3,

                params: { 
                    Bucket: 'formatlibrary', 
                    Key: `images/pfps/${req.body.name}.png`, 
                    Body: buffer,
                    ContentType: 'image/png'
                },
            }).done()
        
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
                        discordName: {[Op.and]: [req.body.discordName, {[Op.not]: null}]}
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
            country: req.body.country,
            discordName: req.body.discordName
        })

        return res.json(player)
    } catch (err) {
      next(err)
    }
}