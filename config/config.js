module.exports = {
  development: {
    dialect: 'postgres',
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: 'formatlibrary'
  },
  production: {
    dialect: 'postgres',
    use_env_variable: 'DATABASE_URL'
  }
}
