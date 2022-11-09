
import { Player } from "@fl/models"

export const login = (options) => {
  const { app, providers } = options
  const title = 'Login'

  return async (req, res, next) => {
    const { email, password } = req.body
    const method = req.method

    if (method === 'GET') {
      res.render('auth/login', {
        app,
        title,
        providers,
        signup: false
      })
    } else if (method === 'POST') {
        const {id, name, discordId, discordPfp, googleId, googlePfp} = await Player.verifyLogin({
            email: email,
            password: password
        })

        if (id) {
            res.cookie('playerId', id, {
        	    maxAge: 24 * 60 * 60 * 1000
            }).cookie('discordId', discordId, {
        	    maxAge: 24 * 60 * 60 * 1000
            }).cookie('discordPfp', discordPfp, {
        	    maxAge: 24 * 60 * 60 * 1000
            }).cookie('googleId', googleId, {
        	    maxAge: 24 * 60 * 60 * 1000
            }).cookie('googlePfp', googlePfp, {
        	    maxAge: 24 * 60 * 60 * 1000
            }).cookie('playerName', name, {
        	    maxAge: 24 * 60 * 60 * 1000
            }).redirect(`https://formatlibrary.com`)
        } else {
            res.status(404).send('Invalid username and/or password.')
        }
    }

    next()
  }
}
