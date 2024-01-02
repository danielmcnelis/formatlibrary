import {config} from '@fl/config'

const secure = config.services.api.https === '1' || config.services.api.https === 'true'

export const api = {
  path: '/api',
  target: `${secure ? 'https' : 'http'}://${config.services.api.host}:${config.services.api.port}`,
  secure
}
