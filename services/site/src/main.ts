import * as express from 'express'
import * as compression from 'compression'
import { createProxyMiddleware as proxy } from 'http-proxy-middleware'
import * as http from 'http'
import * as https from 'https'
import * as path from 'path'
import { existsSync, readFileSync } from 'fs'
import * as morgan from 'morgan'
import * as chalk from 'chalk'
import { api, auth } from './proxies'
import { Server } from 'socket.io'

import { error } from './middleware'
import { config } from '@fl/config'

let httpServer
let httpsServer

const app = express()

// logging
app.use(morgan('dev'))

// compression
app.use(compression())

// proxies
if (config.services.site.proxy) {
  const proxies = { api, auth }
  Object.entries(proxies).forEach(([, prxy]) => {
    app.use(proxy(prxy.path, { target: prxy.target, secure: prxy.secure }))
    console.log(chalk.cyan(`Proxy ${prxy.path} to ${prxy.target}`))
  })
}

// assets
app.use(express.static(path.join(__dirname, '/assets')))

// index.html
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/assets/index.html'))
})

// error
app.use(error)

const port = config.services.site.port

if (config.services.site.https === '1' || config.services.site.https === 'true') {
  // load key/cert
  const privateKey = existsSync('../../../certs/privkey.pem') ? readFileSync('../../../certs/privkey.pem', 'utf8') : ''
  const certificate = existsSync('../../../certs/fullchain.pem') ? readFileSync('../../../certs/fullchain.pem', 'utf8') : ''
  const credentials = { key: privateKey, cert: certificate }

  // Wrap(proxy) http server with https server
  httpsServer = https.createServer(credentials, app)

  const server = httpsServer.listen(port, () =>
    console.log(chalk.cyan(`Listening on https://${config.services.site.host ? config.services.site.host : '0.0.0.0'}:${port}`))
  )

  const io = new Server(server)
  io.on('connection', (socket) => {
    console.log('a user connected')
  })

  server.on('error', console.error)
} else {
  // Wrap(proxy) express with http server
  httpServer = http.createServer(app)
  const server = httpServer.listen(port, () =>
    console.log(chalk.cyan(`Listening on http://${config.services.site.host ? config.services.site.host : '0.0.0.0'}:${port}`))
  )

  const io = new Server(server)
    io.on('connection', (socket) => {
      console.log('a user connected')
    })
    
  server.on('error', console.error)
}
