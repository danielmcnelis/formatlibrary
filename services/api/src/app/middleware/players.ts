import { Deck, DeckThumb, DeckType, Player, Stats } from '@fl/models'
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

export const countPlayers = async (req, res, next) => {
    const name = req.query.name
    const count = await Player.count({
      where: {
        [Op.or]: [
            {name: {[Op.iLike]: '%' + name + '%'}},
            {discordName: {[Op.iLike]: '%' + name + '%'}},
            {duelingBookName: {[Op.iLike]: '%' + name + '%'}}
        ],
        hasPlayed: true
      }
    })

    return res.json(count)
}

export const getPlayers = async (req, res, next) => {
  try {
    const name = req.query.name
    const limit = req.query.limit || 10

    const sort = req.query.sort?.split(',').reduce((reduced, val) => {
        const [field, value] = val.split(':')
        reduced.push([field, value])
        return reduced
    }, [])

    const players = await Player.findAll({
      where: {
        [Op.or]: [
            {name: {[Op.iLike]: '%' + name + '%'}},
            {discordName: {[Op.iLike]: '%' + name + '%'}},
            {duelingBookName: {[Op.iLike]: '%' + name + '%'}}
        ],
        hasPlayed: true
      },
      attributes: ['id', 'name', 'tops'],
      order: sort,
      limit
    })

    const detailedPlayers = []

    for (let i = 0 ; i < players.length; i++) {
        const player = players[i]
        const stats = await Stats.findAll({
            where: {
                playerId: player.id,
                games: {[Op.gte]: 3}
            },
            order: [['elo', 'DESC']],
            limit: 3
        })

        const decks = await Deck.findAll({
            where: {
                builderId: player.id,
                display: true,
                origin: 'event',
            },
            order: [['placement', 'ASC'], ['createdAt', 'DESC']],
            limit: 3
        })

        const tops = await Deck.count({
            where: {
                builderId: player.id,
                display: true,
                origin: 'event',
            }
        })

        const deckTypes = await getFavoriteDecks(player.id)
        detailedPlayers.push({ ...player.dataValues, tops, stats, decks, deckTypes })
    }

    return res.json(detailedPlayers)
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
        console.log('')
        // console.log('PlayerId PFP Not Found.')
    }

    try {
        await axios.head(`https://cdn.discordapp.com/avatars/${player.discordId}/${player.discordPfp}.webp`)
        return res.redirect(`https://cdn.discordapp.com/avatars/${player.discordId}/${player.discordPfp}.webp`)
    } catch (err) {
        console.log('')
        // console.log('DiscordPfp PFP Not Found.')
    }

    try {
        await axios.head(`https://cdn.formatlibrary.com/images/pfps/${player.discordId}.png`)
        return res.redirect(`https://cdn.formatlibrary.com/images/pfps/${player.discordId}.png`)
    } catch (err) {
        console.log('')
        // console.log('DiscordId PFP Not Found.')
    }

    try {
        await axios.head(`https://cdn.formatlibrary.com/images/pfps/${player.name}.png`)
        return res.redirect(`https://cdn.formatlibrary.com/images/pfps/${player.name}.png`)
    } catch (err) {
        console.log('')
        // console.log('PlayerName PFP Not Found.')
        return res.redirect(`https://cdn.discordapp.com/embed/avatars/1.png`)
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

const getFavoriteDecks = async (builderId) => {
  try {
    const decks = await Deck.findAll({
        where: {
            builderId,
            origin: 'event',
            deckTypeName: { [Op.not]: 'Other' },
            deckTypeId: { [Op.not]: null }
        },
        attributes: ['id', 'deckTypeName', 'formatName']
    })

    if (!decks.length) return false

    const freqs = decks.reduce(
    (acc, curr) => (
        acc[`${curr.formatName}_${curr.deckTypeName}`]
        ? acc[`${curr.formatName}_${curr.deckTypeName}`]++
        : (acc[`${curr.formatName}_${curr.deckTypeName}`] = 1),
        acc
    ),
    {}
    )
    const arr = Object.entries(freqs)
    .sort((a: never, b: never) => b[1] - a[1])
    .map((e) => e[0])
    const data = []
    const types = []

    for (let i = 0; i < arr.length; i++) {
        try {
            const elem = arr[i]
            const name = elem.slice(elem.indexOf('_') + 1)
            const format = elem.slice(0, elem.indexOf('_'))
            const deckType = await DeckType.findOne({
            where: {
                name: { [Op.iLike]: name }
            },
            attributes: ['id', 'name', 'cleanName']
            })

            if (!deckType || types.includes(deckType.id)) continue

            const deckThumb =
            (await DeckThumb.findOne({
                where: {
                deckTypeId: deckType.id,
                formatName: format
                },
                attributes: ['id', 'deckTypeName', 'leftCardArtworkId', 'centerCardArtworkId', 'rightCardArtworkId']
            })) ||
            (await DeckThumb.findOne({
                where: {
                deckTypeId: deckType.id,
                isPrimary: true
                },
                attributes: ['id', 'deckTypeName', 'leftCardArtworkId', 'centerCardArtworkId', 'rightCardArtworkId']
            }))

            types.push(deckType.id)
            if (!deckThumb) continue
            data.push({ ...deckType.dataValues, ...deckThumb.dataValues })
        } catch (err) {
            console.log(err)
        }
    }

            return data.slice(0, 6)
    } catch (err) {
        console.log(err)
    }
}