export const signup = (options) => {
  const { app, providers } = options
  const title = 'Signup'

  return (req, res, next) => {
    const method = req.method

    if (method === 'GET') {
      res.render('auth/signup', {
        app,
        title,
        providers,
        firstName: '',
        lastName: '',
        email: '',
        newPassword: '',
        confirmPassword: ''
      })
    } else if (method === 'POST') {
      // TODO: handle signup form post (local user/password)
      res.status(404).send('Sorry, we cannot find that!')
    }

    next()
  }
}
