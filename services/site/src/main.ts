import * as express from 'express'
import * as compression from 'compression'
import { createProxyMiddleware as proxy } from 'http-proxy-middleware'
import * as http from 'http'
import * as https from 'https'
import * as path from 'path'
import { readFileSync } from 'fs'
import * as morgan from 'morgan'
import * as chalk from 'chalk'
import { api, auth } from './proxies'
import { Server } from 'socket.io'
import { error } from './middleware'
import { config } from '@fl/config'

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

const useHttps = config.services.site.https === '1' || config.services.site.https === 'true'

const privateKey = useHttps ? readFileSync('../../../certs/privkey.pem', 'utf8') || '' : ''
const certificate = useHttps ? readFileSync('../../../certs/fullchain.pem', 'utf8') || '' : ''
const credentials = { key: privateKey, cert: certificate }

export const server = useHttps ? https.createServer(credentials, app).listen(port, () =>
    console.log(chalk.cyan(`Listening on https://${config.services.site.host ? config.services.site.host : '0.0.0.0'}:${port}`))
) : http.createServer(app).listen(port, () =>
    console.log(chalk.cyan(`Listening on http://${config.services.site.host ? config.services.site.host : '0.0.0.0'}:${port}`))
)

const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

io.on('connection', (socket) => {
    socket.emit('hello', 'WORLD')
    console.log('an https usor connected')
})

io.on('disconnect', (socket) => {
    console.log('a user Disconnected')
    socket.removeAllListeners()
})

app.set('socketio', io)

export const useIo = () => app.get('socketio')

server.on('error', console.error)

