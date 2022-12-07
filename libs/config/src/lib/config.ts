export const config = { 
    siteUrl: process.env.SITE_URL,
    siteProxy: process.env.SITE_PROXY,
    siteJWKS: JSON.parse(process.env.SITE_JWKS),
    siteIKS: JSON.parse(process.env.SITE_IKS),
    siteAudience: 'urn:formatlibrary:api',
    siteIssuer: 'urn:formatlibrary:auth',
    accessExpires: '30d',
    sessionSecret: process.env.SESSION_SECRET,
    // server: {
    //   https: process.env.SERVER_HTTPS,
    //   host: process.env.SERVER_HOST,
    //   port: process.env.SERVER_PORT
    // },
    services: {
        api: {
            https: process.env.API_HTTPS,
            host: process.env.API_HOST,
            port: process.env.API_PORT || 4331
        },
        auth: {
            https: process.env.AUTH_HTTPS,
            host: process.env.AUTH_HOST,
            port: process.env.AUTH_PORT || 4332
        },
        site: {
            https: process.env.SITE_HTTPS,
            host: process.env.SITE_HOST,
            port: process.env.SITE_PORT || 4330,
            proxy: process.env.SITE_PROXY
        }
    },
    database: {
        url: process.env.DATABASE_URL,
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: 'formatlibrary'
    },
    s3: {
        region: 'us-east-2',
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
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
  