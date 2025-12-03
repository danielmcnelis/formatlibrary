
import { Player } from "@fl/models"
import { config } from "@fl/config"

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
        let player, access
        try {
            player = await Player.localLogin({
                email: email,
                password: password
            }) 

            access = await player.getToken()
        } catch (err) {
            console.error(err)
            res.render('auth/login', {
                app,
                title,
                providers,
                signup: false,
                errors: {
                    accountError: true,
                    accountNotFoundError: true
                }
            })

            return
        }

        const {id, name, discordId, discordPfp, googleId, googlePfp} = player

        res.cookie('access', access, {
            maxAge: 100 * 24 * 60 * 60 * 1000
        }).cookie('playerId', id, {
            maxAge: 100 * 24 * 60 * 60 * 1000
        }).cookie('discordId', discordId, {
            maxAge: 100 * 24 * 60 * 60 * 1000
        }).cookie('discordPfp', discordPfp, {
            maxAge: 100 * 24 * 60 * 60 * 1000
        }).cookie('googleId', googleId, {
            maxAge: 100 * 24 * 60 * 60 * 1000
        }).cookie('googlePfp', googlePfp, {
            maxAge: 100 * 24 * 60 * 60 * 1000
        }).cookie('playerName', name, {
            maxAge: 100 * 24 * 60 * 60 * 1000
        }).redirect(config.siteUrl)
    }

    next()
  }
}
