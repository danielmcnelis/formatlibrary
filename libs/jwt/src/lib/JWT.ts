
export class JWT {
    algorithm
    issuer
    audience
    jwks
  
    constructor(options = {}) {
      const { algorithm= 'RS256', issuer , audience, jwks } = options
      this.algorithm = algorithm
      this.issuer = issuer
      this.audience = audience
      this.jwks = jwks
    }
  
    sign(subject, payload, options = {}) {
      const { expires = '15m'} = options
      //...
      return token
    }
  
    verify(token) {
      //...
      return payload
    }
  
  }
  
//   const jwt = new JWT({
//      algorithm: 'RS256',
//     issuer: 'urn:formatlibrary:auth',
//     audience: 'urn:formatlibrary:api',
//     jwks: config.siteJWKS
//   })
//   const token = jwt.sign('123', { email: 'bob@example.com' })
//   const payload = jwt.verify(token)