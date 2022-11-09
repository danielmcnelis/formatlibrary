
export const logout = () => {
  return async (req, res, next) => {
        res.clearCookie('playerId')
        .clearCookie('discordId')
        .clearCookie('discordPfp')
        .clearCookie('googleId')
        .clearCookie('googlePfp')
        .clearCookie('playerName')
        .redirect(`https://formatlibrary.com`)
    }
}
