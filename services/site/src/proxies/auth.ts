import {config} from '@fl/config'

const secure = config.services.auth.https === '1' || config.services.auth.https === 'true'

export const auth = {
  path: '/auth',
  target: `${secure ? 'https' : 'http'}://${config.services.auth.host}:${config.services.auth.port}`,
  secure
}
