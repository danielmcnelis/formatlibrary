import * as dotenv from 'dotenv'

if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

export const config = {
  siteIKS: JSON.parse(process.env.SITE_IKS),
  database: {
    url: process.env.DATABASE_URL, // secretUrl
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD, // pgPassword
    database: 'formatlibrary'
  }
}
