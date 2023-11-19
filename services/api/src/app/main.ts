import * as express from 'express'
import * as compression from 'compression'
import * as morgan from 'morgan'
import * as chalk from 'chalk'
import * as http from 'http'
import * as https from 'https'
import { existsSync, readFileSync } from 'fs'
import {
  banlists,
  blogposts,
  cards,
  cubes,
  decks,
  deckTypes,
  drafts,
  events,
  formats,
  images,
  matchups,
  players,
  replays,
  sets,
  stats,
  statuses
} from './routes'
import { error } from '@fl/middleware'
import { config } from '@fl/config'

const app = express()

// rewrite
app.use('/api', (req, _res, next) => {
    const from = req.url
    const to = from.replace(/\/api\//g, '/')
    req.url = to
    next()
})
  
// logging
app.use(morgan('dev'))

// compression
app.use(compression())

// body parsing
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// routes
const routes = { banlists, blogposts, cards, cubes, decks, deckTypes, drafts, events, formats, images, matchups, players, replays, sets, stats, statuses }
Object.values(routes).forEach((route) => {
  route.stack.forEach((route) => {
    const path = route.route.path
    const methods = Object.entries(route.route.methods).reduce((reduced, [key, value]) => {
      if (value) {
        reduced.push(key.toUpperCase())
      }
      return reduced
    }, [])
    methods.forEach((method) => {
      console.log(`Route ${chalk.yellow(method)} ${chalk.green(path)}`)
    })
  })

  app.use(route)
})

// error
app.use(error)

const port = config.services.api.port
const useHttps = config.services.api.https === '1' || config.services.api.https === 'true'
const privateKey = useHttps ? readFileSync('./certs/privkey.pem', 'utf8') || '' : ''
console.log('API privateKey?.length', privateKey?.length)
const certificate = useHttps ? readFileSync('./certs/fullchain.pem', 'utf8') || '' : ''
const credentials = { key: privateKey, cert: certificate }

const server = useHttps ? https.createServer(credentials, app).listen(port, () =>
    console.log(chalk.cyan(`Listening on https://${config.services.api.host ? config.services.api.host : '0.0.0.0'}:${port}`))
) : http.createServer(app).listen(port, () =>
    console.log(chalk.cyan(`Listening on http://${config.services.api.host ? config.services.api.host : '0.0.0.0'}:${port}`))
)

server.on('error', console.error)