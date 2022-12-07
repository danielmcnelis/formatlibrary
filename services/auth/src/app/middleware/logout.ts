
import { config } from "@fl/config"

export const logout = () => {
  return async (req, res, next) => {
    return res.clearCookie('access')
    .clearCookie('playerId')
    .clearCookie('discordId')
    .clearCookie('discordPfp')
    .clearCookie('googleId')
    .clearCookie('googlePfp')
    .clearCookie('playerName')
    .redirect(config.siteUrl)
  }
}
