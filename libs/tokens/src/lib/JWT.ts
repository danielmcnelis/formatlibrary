
import { SignJWT, jwtVerify, calculateJwkThumbprint, importJWK, exportJWK } from 'jose'

export class JWT {
    algorithm
    issuer
    audience
    jwks
    rawkeys
    expires
  
    constructor (options:any = {}) {
      const { algorithm = 'RS256', issuer , audience, jwks, expires } = options
      this.algorithm = algorithm
      this.issuer = issuer
      this.audience = audience
      this.jwks = jwks
      this.expires = expires
    }
  
    async convertKeys() {
        if (!this.rawkeys) {
            this.rawkeys = await Promise.all(this.jwks.map(async (privateJwk) => await importJWK(privateJwk, this.algorithm)))
        }
    }

    async sign(subject, payload) {
        await this.convertKeys()
        const privateJwk = this.jwks[0]
        const kid = await calculateJwkThumbprint(privateJwk, 'sha256')
        const key = this.rawkeys[0]
      
        let signed
        try {
            signed = await new SignJWT(payload)
                .setProtectedHeader({ alg: this.algorithm, kid })
                .setSubject(subject)
                .setAudience(this.audience)
                .setIssuer(this.issuer)
                .setIssuedAt()
                .setExpirationTime(this.expires)
                .sign(key)
        } catch (error) {
            console.error(error)
            throw new Error('Failed to sign JWT!')
        }

        return signed
    }
  
    async verify(token) {
        const [protectedHeader] = token.split('.')
		const { alg, kid } = JSON.parse(Buffer.from(protectedHeader, 'base64').toString())

        if (alg !== this.algorithm) {
            throw new Error('Wrong algorithm!')
        }

        await this.convertKeys()
        const privateKey = this.jwks.find((key) => key.kid === kid)
        if (!privateKey) {
            throw new Error('Invalid Key!')
        }

        const key = await importJWK(privateKey, this.algorithm)

        let claims
        try {
            claims = await jwtVerify(token, key, {
                issuer: this.issuer,
                audience: this.audience
            })
        } catch (error) {
            throw new Error('Failed to verify JWT!')
        }

        return claims
    }
  }
  