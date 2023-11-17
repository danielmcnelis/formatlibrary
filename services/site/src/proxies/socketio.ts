import {config} from '@fl/config'

const secure = config.services.hub.https === '1' || config.services.hub.https === 'true'

export const socketio = {
  path: '/socket.io',
  target: `${secure ? 'https' : 'http'}://${config.services.hub.host}:${config.services.hub.port}`,
  secure
}
