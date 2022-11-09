
import { Sequelize } from 'sequelize'
import { config } from './config'

export const db = config.database.url
  ? new Sequelize(config.database.url, {
      logging: false,
      ssl: true
    })
  : new Sequelize(config.database.database, config.database.user, config.database.password, {
      host: config.database.host,
      port: config.database.port,
      dialect: 'postgres',
      logging: false
    })
