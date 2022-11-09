export const logout = (options) => {
  const { returnTo } = options

  return (req, res, next) => {
    // TODO: delete token cookies here
    res.redirect(returnTo || 'https://formatlibrary.com')

    next()
  }
}
