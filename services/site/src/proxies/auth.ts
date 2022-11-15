import {config} from '@fl/config'

const secure = config.services.api.https === '1' || config.services.api.https === 'true'

export const auth = {
  path: '/auth',
  target: `${secure ? 'https' : 'http'}://${config.services.auth.host}:${config.services.auth.port}/auth`,
  secure
}
