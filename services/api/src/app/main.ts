import * as express from 'express'
import * as compression from 'compression'
import * as morgan from 'morgan'
import * as chalk from 'chalk'
import {
  banlists,
  blogposts,
  cards,
  decks,
  deckTypes,
  events,
  formats,
  images,
  players,
  sets,
  stats,
  statuses
} from './routes'
import { error } from '@fl/middleware'
import { config } from '@fl/config'

const app = express()

if (config.siteProxy === 'true') {
    // rewrite
    app.use('/api', (req, _res, next) => {
        const from = req.url
        const to = from.replace(/\/api\//g, '/')
        req.url = to
        next()
    })
}
  
// logging
app.use(morgan('dev'))

// compression
app.use(compression())

// body parsing
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// routes
const routes = { banlists, blogposts, cards, decks, deckTypes, events, formats, images, players, sets, stats, statuses }
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
const server = app.listen(port, () => {
  console.log(chalk.cyan(`Listening at http://localhost:${port}`))
})
server.on('error', console.error)
