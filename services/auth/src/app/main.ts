import * as express from 'express'
import * as expressLayouts from 'express-ejs-layouts'
import * as compression from 'compression'
import * as session from 'cookie-session'
import * as morgan from 'morgan'
import * as chalk from 'chalk'
import * as path from 'path'
import { resolve } from 'path'
import { auth } from './routes'
import { error } from '@fl/middleware'
import config from './config'

const app = express()

// if (config.siteProxy === 'true') {
    // rewrite
    console.log('rewrite', config.siteProxy)
    app.use('/auth', (req, _res, next) => {
        const from = req.url
        console.log('from', from)
        const to = from.replace(/\/auth\//g, '/')
        console.log('to', to)
        req.url = to
        console.log('req.url', req.url)
        next()
    })

//     console.log(chalk.cyan(`Rewrite /auth/* to /`))
// }

// body parsing
app.use(express.urlencoded())
// app.use(express.json())

// logging
app.use(morgan('dev'))

// compression
app.use(compression())

// session
const keys = config.siteIKS.map((key) => key.sig)
app.use(
  session({
    name: 'session',
    keys,

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000
  })
)

// templates
app.set('view engine', 'ejs')
app.set('views', resolve(__dirname, './assets/views'))
app.set('layout', './layout.ejs')
app.use(expressLayouts)

// routes
const routes = { auth }
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

const port = config.service.port
const server = app.listen(port, () => {
  console.log(chalk.cyan(`Listening at http://localhost:${port}`))
})
server.on('error', console.error)
