
import { Player } from "@fl/models"
import * as bcrypt from 'bcrypt'
import { config } from '@fl/config'

export const signup = (options) => {
  const { app, providers } = options
  const title = 'Signup'

  return async (req, res, next) => {
    const method = req.method
    const { firstName, lastName, email, newPassword, confirmPassword } = req.body

    if (method === 'GET') {
      res.render('auth/signup', {
        app,
        title,
        providers,
        firstName: '',
        lastName: '',
        email: '',
        newPassword: '',
        confirmPassword: ''
      })
    } else if (method === 'POST') {
        if (!firstName || !lastName || !email || !newPassword || !confirmPassword) return res.status(400)
        if (newPassword !== confirmPassword) return res.status(400).send('Passwords do not match.')
        const googleId = email.slice(-10).includes('@gmail.com') ? email.slice(0, -10) : null
        const existing = await Player.findByEmail(email)
        if (existing) return res.status(400).send('Email is already in use. Please log in.')
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(newPassword, salt)
        const id = await Player.generateId()

        const player = await Player.create({
            id: id,
            firstName: firstName,
            lastName: lastName,
            googleId: googleId,
            hash: hash,
            name: `${firstName} ${lastName}`,
            email: email
        })

        const access = await player.getToken()

        if (player && player.id) {
            res.cookie('access', access, {
        	    maxAge: 30 * 24 * 60 * 60 * 1000
            }).cookie('playerId', player.id, {
        	    maxAge: 30 * 24 * 60 * 60 * 1000
            }).cookie('googleId', player.googleId, {
        	    maxAge: 30 * 24 * 60 * 60 * 1000
            }).cookie('playerName', player.name, {
        	    maxAge: 30 * 24 * 60 * 60 * 1000
            }).redirect(config.siteUrl)
        } else {
            res.status(404).send('Error creating account.')   
        }
    }

    next()
  }
}
