
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

export const config = {
  database: {
    url: process.env.DATABASE_URL, // secretUrl
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD, // pgPassword
    database: 'formatlibrary'
  }
}
