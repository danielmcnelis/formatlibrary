import { AuthorizationCode } from 'simple-oauth2'
import { generators } from 'openid-client'

export const oauth2Authorize = (options) => {
  const { clientId, clientSecret, redirectUrl, scope, authorizeUrl, tokenUrl, returnTo } = options

  const authorize_url = new URL(authorizeUrl)
  const authorizeHost = authorize_url.origin
  const authorizePath = authorize_url.pathname
  
  const token_url = new URL(tokenUrl)
  const tokenHost = token_url.origin
  const tokenPath = token_url.pathname

  return async (req, res, next) => {
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

    const state = generators.state()

    const authorizationUrl = client.authorizeURL({
      redirect_uri: redirectUrl,
      scope,
      state
    })

    req.session = {
      state,
      returnTo
    }

    res.redirect(authorizationUrl)
    next()
  }
}
