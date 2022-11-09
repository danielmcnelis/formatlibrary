const config = {
  siteUrl: process.env.SITE_URL,
  siteJWKS: JSON.parse(process.env.SITE_JWKS),
  siteIKS: JSON.parse(process.env.SITE_IKS),
  sessionSecret: process.env.SESSION_SECRET,
  server: {
    https: process.env.SERVER_HTTPS,
    host: process.env.SERVER_HOST,
    port: process.env.SERVER_PORT
  },
  service: {
    https: process.env.SITE_HTTPS,
    host: process.env.SITE_HOST,
    port: process.env.SITE_PORT || 4330,
    proxy: process.env.SITE_PROXY
  },
  services: {
    api: {
      https: process.env.API_HTTPS,
      host: process.env.API_HOST,
      port: process.env.API_PORT
    },
    auth: {
      https: process.env.AUTH_HTTPS,
      host: process.env.AUTH_HOST,
      port: process.env.AUTH_PORT
    }
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUrl: process.env.GOOGLE_REDIRECT_URL,
    discoveryUrl: 'https://accounts.google.com/'
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    redirectUrl: process.env.DISCORD_REDIRECT_URL,
    scope: 'identify email',
    authorizeUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userInfoUrl: 'https://discord.com/api/users/@me'
  },
  challonge: {
    'Format Library': process.env.CHALLONGE_FORMAT_LIBRARY_API_KEY, // formatLibraryChallongeAPIKey or challongeAPIKeys.'Format Library'
    'GoatFormat.com': process.env.CHALLONGE_GOAT_FORMAT_API_KEY, // goatformatChallongeAPIKey or challongeAPIKeys.'GoatFormat.com'
    'EdisonFormat.com': process.env.CHALLONGE_EDISON_FORMAT_API_KEY, // challongeAPIKeys.'EdisonFormat.com'
    'Crows Nest': process.env.CHALLONGE_CROWS_NEST_API_KEY // challongeAPIKeys.'Crows Nest'
  }
}

export default config
