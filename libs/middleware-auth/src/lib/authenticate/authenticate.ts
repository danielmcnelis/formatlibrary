export const authenticate = (options) => {
  // const { audience, jwks, ... } = options

  return (req, res, next) => {
    // TODO: extract jwt and validate

    next()
  }
}
