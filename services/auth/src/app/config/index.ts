const config = {
  siteUrl: process.env.SITE_URL,
  siteProxy: process.env.SITE_PROXY,
  siteJWKS: JSON.parse(process.env.SITE_JWKS),
  siteIKS: JSON.parse(process.env.SITE_IKS),
  sessionSecret: process.env.SESSION_SECRET,
  server: {
    https: process.env.SERVER_HTTPS,
    host: process.env.SERVER_HOST,
    port: process.env.SERVER_PORT
  },
  service: {
    port: process.env.AUTH_PORT || 4339
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
    'Format Library': process.env.CHALLONGE_FORMAT_LIBRARY_API_KEY,
    'GoatFormat.com': process.env.CHALLONGE_GOAT_FORMAT_API_KEY,
    'EdisonFormat.com': process.env.CHALLONGE_EDISON_FORMAT_API_KEY,
    'Crows Nest': process.env.CHALLONGE_CROWS_NEST_API_KEY
  }
}

export default config
