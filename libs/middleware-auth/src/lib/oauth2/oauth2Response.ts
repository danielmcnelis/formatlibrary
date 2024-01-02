import { AuthorizationCode } from 'simple-oauth2'
import axios from 'axios'
import { Player } from '@fl/models'

export const oauth2Response = (options) => {
  const { clientId, clientSecret, redirectUrl, scope, authorizeUrl, tokenUrl, userinfoUrl } = options
  const authorize_url = new URL(authorizeUrl)
  const authorizeHost = authorize_url.origin
  const authorizePath = authorize_url.pathname
  const token_url = new URL(tokenUrl)
  const tokenHost = token_url.origin
  const tokenPath = token_url.pathname

  return async (req, res, next) => {
    const { state, code } = req.query

    const { state: sessionState, returnTo } = req.session

    req.session = null

    const tokenParams = {
      code,
      redirect_uri: redirectUrl,
      scope
    }

    const client = new AuthorizationCode({
      client: {
        id: clientId,
        secret: clientSecret
      },
      auth: {
        authorizeHost,
        authorizePath,
        tokenHost,
        tokenPath
      }
    })

    let tokenResponse
    try {
      tokenResponse = await client.getToken(tokenParams)
    } catch (error) {
      console.error('middleware.oauth2Response: error: ', error.message)
    }

    const accessToken = tokenResponse.token.access_token

    let userinfo
    try {
      userinfo = await axios.get(userinfoUrl, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      })
    } catch (error) {
      console.error('middleware.oauth2Response: error: ', error.message)
    }

    
    const player = await Player.discordLogin(userinfo.data)
    const access = await player.getToken()
    const {id, discordId, discordPfp, name} = player
    
    res.cookie('access', access, {
        maxAge: 100 * 24 * 60 * 60 * 1000
    }).cookie('playerId', id, {
        maxAge: 100 * 24 * 60 * 60 * 1000
    }).cookie('discordId', discordId, {
        maxAge: 100 * 24 * 60 * 60 * 1000
    }).cookie('discordPfp', discordPfp, {
        maxAge: 100 * 24 * 60 * 60 * 1000
    }).cookie('playerName', name, {
        maxAge: 100 * 24 * 60 * 60 * 1000
    }).clearCookie('googlePfp')
    .redirect(returnTo || 'https://formatlibrary.com')
  }
}
