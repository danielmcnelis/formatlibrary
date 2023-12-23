import {config} from '@fl/config'

const secure = config.services.bot.https === '1' || config.services.bot.https === 'true'

export const bot = {
  path: '/bot',
  target: `${secure ? 'https' : 'http'}://${config.services.bot.host}:${config.services.bot.port}/bot`,
  secure
}
