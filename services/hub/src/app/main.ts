
import * as express from 'express'
import * as morgan from 'morgan'
import * as chalk from 'chalk'
import * as http from 'http'
import * as https from 'https'
import { readFileSync } from 'fs'
import { Server } from 'socket.io'
import { config } from '@fl/config'
import { joinDraft, leaveDraft, selectCard, startDraft } from './events'

const app = express()
  
// logging
app.use(morgan('dev'))

const port = config.services.hub.port
const useHttps = config.services.hub.https === '1' || config.services.hub.https === 'true'
const privateKey = useHttps ? readFileSync('./certs/privkey.pem', 'utf8') || '' : ''
console.log('HUB privateKey?.length', privateKey?.length)
const certificate = useHttps ? readFileSync('./certs/fullchain.pem', 'utf8') || '' : ''
const credentials = { key: privateKey, cert: certificate }

const server = useHttps ? https.createServer(credentials, app).listen(port, () =>
    console.log(chalk.cyan(`Listening on https://${config.services.hub.host ? config.services.hub.host : '0.0.0.0'}:${port}`))
) : http.createServer(app).listen(port, () =>
    console.log(chalk.cyan(`Listening on http://${config.services.hub.host ? config.services.hub.host : '0.0.0.0'}:${port}`))
)

server.on('error', console.error)

const io = new Server(server, {
    cors: {
        origin: `*`
    }
})

io.on('connection', (socket) => {
    console.log('an https user connected')
    socket.on('join draft', (data, setEntry) => joinDraft(data.playerId, data.draftId, socket, setEntry))
    socket.on('leave draft', (data, setEntry) => leaveDraft(data.playerId, data.draftId, socket, setEntry))
    socket.on('start draft', (data) => startDraft(data.draftId, socket))
    socket.on('select card', (data, handleSelection) => selectCard(data.cardId, data.playerId, data.draftId, data.round, data.pick, socket, handleSelection))
})

io.on('disconnection', (socket) => {
    console.log('an https user disconnected')
    socket.removeAllListeners()
})