
import { Op, Sequelize } from 'sequelize'
import { db } from './db'
import * as bcrypt from 'bcrypt'
import { customAlphabet } from 'nanoid'
import {JWT} from '@fl/tokens'
import { config } from '@fl/config'
import { Deck } from './Deck'

export const Player = db.define('players', {
  id: {
      type: Sequelize.STRING,
      primaryKey: true,
      unique: true
  },
  name: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING
  },
  alternateEmail: {
    type: Sequelize.STRING
  },
  pfp: {
    type: Sequelize.STRING
  },
  discordName: {
    type: Sequelize.STRING
  },
  globalName: {
    type: Sequelize.STRING
  },
  discordId: {
    type: Sequelize.STRING
  },
  discordPfp: {
    type: Sequelize.STRING
  },
  googleId: {
    type: Sequelize.STRING
  },
  googlePfp: {
    type: Sequelize.TEXT
  },
  duelingBookName: {
    type: Sequelize.STRING
  },
  duelingBookPfp: {
    type: Sequelize.STRING
  },
  firstName: {
    type: Sequelize.STRING
  },
  lastName: {
    type: Sequelize.STRING
  },
  country: {
    type: Sequelize.STRING
  },
  timeZone: {
    type: Sequelize.STRING
  },
  hash: {
    type: Sequelize.STRING
  },
  isAdmin: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  isContentManager: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  isCreator: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  triviaWins: {
    type: Sequelize.INTEGER
  },
  isSubscriber: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  subscriberTier: {
    type: Sequelize.STRING
  },
  isHidden: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  isBannedFromRated: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  youtube: {
      type: Sequelize.STRING
  },
  twitch: {
      type: Sequelize.STRING
  },
  twitter: {
      type: Sequelize.STRING
  },
  isForgedSubscriber: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  forgedSubscriberTier: {
    type: Sequelize.STRING
  }
})

Player.findById = (id) => Player.findOne({ where: { id: id }})
  
Player.generateId = async () => {
    const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    const id = customAlphabet(base58, 22)()
    return id
  }
  
  Player.findByDiscordId = (id) => Player.findOne({ where: { discordId: id }})
  
  Player.findByEmail = (email) => {
      if (email.includes('@gmail.com')) {
          const googleId = email.replace('@gmail.com', '')
          return Player.findOne({ where: { [Op.or]: [{ email: email}, {googleId: googleId }] } })
      } else {
          return Player.findOne({ where: { email: email }})
      }
  }
  
  Player.discordLogin = async (user) => {
      const existingDiscordPlayer = await Player.findOne({ 
          where: { 
              discordId: user.id
          }
      })
      
      const existingEmailPlayer = await Player.findOne({ 
          where: { 
              discordId: null,
              email: user.email
          }
      })
  
      if (existingDiscordPlayer && !existingEmailPlayer) {
        console.log('existingDiscordPlayer && !existingEmailPlayer -> update existingDiscordPlayer')
          const googleId = user.email?.includes('@gmail.com') ? user.email?.slice(0, -10) : null
          await existingDiscordPlayer.update({
              name: existingDiscordPlayer.name || user.username,
              discordName: user.username,
              discordPfp: user.avatar,
              email: existingDiscordPlayer.email || user.email,
              googleId: existingDiscordPlayer.googleId || googleId
          })

          return existingDiscordPlayer
      } else if (existingDiscordPlayer && existingEmailPlayer) {
        console.log(`existingDiscordPlayer && existingEmailPlayer -> merge accounts (delete existingEmailPlayer ${existingEmailPlayer.name} - ${existingEmailPlayer.id})`)
          await Player.replaceDecks(existingEmailPlayer, existingDiscordPlayer)
          await existingEmailPlayer.destroy()

          const googleId = user.email?.includes('@gmail.com') ? user.email?.slice(0, -10) : null
          await existingDiscordPlayer.update({
              name: existingDiscordPlayer.name || user.username,
              discordName: user.username,
              discordPfp: user.avatar,
              email: existingDiscordPlayer.email || user.email,
              googleId: existingDiscordPlayer.googleId || googleId
          })

          return existingDiscordPlayer
      } else if (!existingDiscordPlayer && existingEmailPlayer) {
        console.log(`!existingDiscordPlayer && existingEmailPlayer -> merge accounts (create newPlayer from discord login and delete existingEmailPlayer ${existingEmailPlayer.name} - ${existingEmailPlayer.id})`)
          const googleId = user.email?.includes('@gmail.com') ? user.email?.slice(0, -10) : null

          const newPlayer = await Player.create({
              id: await Player.generateId(),
              discordId: user.id,
              name: user.username,
              discordName: user.username,
              discordPfp: user.avatar
          })

          await Player.replaceDecks(existingEmailPlayer, newPlayer)
          await existingEmailPlayer.destroy()
            
          await newPlayer.update({
              email: user.email || null,
              googleId: googleId || null
          })

          return newPlayer
      } else {
        console.log('create new player from discord login')

        try {
            const newPlayer = await Player.create({
                id: await Player.generateId(),
                discordId: user.id,
                name: user.username,
                discordName: user.username,
                discordPfp: user.avatar,
                email: user.email
            })

            return newPlayer
        } catch (err) {
            console.log(err)
        }
    }
}
  
  Player.googleLogin = async (payload) => {
      const existingPlayer = await Player.findOne({ 
          where: {
              googleId: payload.email.slice(0, -10)
          }
      }) || await Player.findOne({ 
          where: { 
              email: payload.email
          }
      })
  
      if (existingPlayer) {
          await existingPlayer.update({
              name: existingPlayer.name || payload.name,
              googleId: payload.email.slice(0, -10),
              googlePfp: payload.picture.slice(36),
              firstName: existingPlayer.firstName || payload.given_name,
              lastName: existingPlayer.lastName || payload.family_name,
              email: existingPlayer.email || payload.email
          })

          return existingPlayer
      } else {
          const newPlayer = await Player.create({
              id: await Player.generateId(),
              name: payload.name,
              googleId: payload.email.slice(0, -10),
              googlePfp: payload.picture.slice(36),
              firstName: payload.given_name,
              lastName: payload.family_name,
              email: payload.email
          })

          return newPlayer
      }
  }

  Player.localLogin = async (payload) => {
    const { email, password } = payload
    const player = await Player.findOne({ where: { email } })

    if (player && password && player.hash && await bcrypt.compare(password, player.hash)) {
        return player
    } else {
        throw new Error('Player not found.')
    }
  }

  Player.replaceDecks = async (oldAccount, newAccount) => {
    const decks = await Deck.findAll({ where: { builderId: oldAccount.id }})
    for (let i = 0; i < decks.length; i++) {
        const deck = decks[i]
        await deck.update({ builderId: newAccount.id, builderName: newAccount.name })
    }
  }

  Player.prototype.getToken = function () {
    const jwt = new JWT({
        algorithm: 'RS256',
        issuer: config.siteIssuer,
        audience: config.siteAudience,
        jwks: JSON.parse(config.siteJWKS),
        expires: config.accessExpires
    })

    return jwt.sign(this.id, { email: this.email })
  }
