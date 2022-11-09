import { Issuer } from 'openid-client'
import { decodeJwt } from 'jose'
import { Player } from '@fl/models'

export const oidcResponse = (options) => {
  const { clientId, clientSecret, redirectUrl, discoveryUrl } = options

  return async (req, res, next) => {
    const { state, code } = req.query
    const {
      state: sessionState,
      nonce: sessionNonce,
      codeVerifier: sessionCodeVerifier,
      codeChallenge: sessionCodeChallenge,
      returnTo
    } = req.session

    req.session = null

    const issuer = await Issuer.discover(discoveryUrl)
    const client = new issuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: [redirectUrl],
      response_types: ['id_token']
    })

    const params = client && client.callbackParams(req)

    const tokenSet =
      client &&
      (await client.callback(redirectUrl, params, {
        nonce: sessionNonce,
        state: sessionState,
        code_verifier: sessionCodeVerifier
      }))

    const { id_token: idToken } = tokenSet
    const payload = decodeJwt(idToken)
    
    const {id, googleId, googlePfp, name} = await Player.googleLogin(payload)
    
    res.cookie('playerId', id, {
        maxAge: 24 * 60 * 60 * 1000
    }).cookie('googleId', googleId, {
        maxAge: 24 * 60 * 60 * 1000
    }).cookie('googlePfp', googlePfp, {
        maxAge: 24 * 60 * 60 * 1000
    }).cookie('playerName', name, {
        maxAge: 24 * 60 * 60 * 1000
    }).clearCookie('discordPfp')
    .redirect(returnTo || 'https://formatlibrary.com')
  }
}
