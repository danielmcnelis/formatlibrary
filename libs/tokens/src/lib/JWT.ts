import { raw } from 'express'
import { SignJWT, jwtVerify, calculateJwkThumbprint, importJWK, exportJWK } from 'jose'

export class JWT {
    algorithm
    issuer
    audience
    jwks
    rawkeys
  
    constructor (options:any = {}) {
      const { algorithm = 'RS256', issuer , audience, jwks } = options
      this.algorithm = algorithm
      this.issuer = issuer
      this.audience = audience
      this.jwks =  jwks
    }

    //   const keys = await Promise.all(privateJwks.map((privateJwk) => importJWK(privateJwk, algorithm)))
  k
    async sign(subject, payload, options = {}) {
        if (!this.rawkeys) {
            this.rawkeys = await this.jwks.map(async (privateJwk) => await importJWK(privateJwk, this.algorithm))
        }
      const { expires = '15m'} = options
      //...
      return token
    }
  
    async verify(token) {
        if (!this.rawkeys) {
            this.rawkeys = await this.jwks.map(async (privateJwk) => await importJWK(privateJwk, this.algorithm))
        }
      //...
      return payload
    }
  

//   const jwt = new JWT({
//     algorithm: 'RS256',
//    issuer: 'urn:formatlibrary:auth',
//    audience: 'urn:formatlibrary:api',
//    jwks: config.siteJWKS
//  })
//  const token = jwt.sign('123', { email: 'bob@example.com' })
//  const payload = jwt.verify(token)

  }
  