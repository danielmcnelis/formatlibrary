import { Issuer, generators } from 'openid-client'

export const oidcAuthorize = (options) => {
  const { clientId, clientSecret, redirectUrl, discoveryUrl, returnTo } = options

  return async (req, res, next) => {
    const issuer = await Issuer.discover(discoveryUrl)
    const client = new issuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
      token_endpoint_auth_method: 'client_secret_post',
      redirect_uris: [redirectUrl],
      response_types: ['code']
    })

    const state = generators.state()
    const nonce = generators.nonce()
    const codeVerifier = generators.codeVerifier()
    const codeChallenge = generators.codeChallenge(codeVerifier)

    const authorizationUrl = client.authorizationUrl({
      scope: 'openid profile email address',
      response_mode: 'query',
      nonce,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'login'
    })

    console.log('middleware.oidcAuthorize: authorizationUrl: ', authorizationUrl)

    req.session = {
      state,
      nonce,
      codeVerifier,
      codeChallenge,
      returnTo
    }

    res.redirect(authorizationUrl)
    next()
  }
}
