import { SignJWT, jwtVerify, calculateJwkThumbprint, importJWK, exportJWK } from 'jose'
import * as minimist from 'minimist'
import { config } from './config'
;(async () => {
  const argv = minimist(process.argv.slice(2))

  if (argv.h) {
    console.log(`
	usage: jwt [--h] [--sign] [--subject] [--payload] [--verify] [--jwt] [--expires] [--verbose]
	Options:
	--sign         Sign payload
	--subject      Subject of jwt
	--payload      Payload to sign
	--verify       Verify jwt
	--jwt          JWT tp verify
	--expires      Expires in
	--verbose      Show keys
	--h         Show available options	
	`)
    process.exit()
  }

  const sign = argv.sign && !argv.verify ? true : !argv.sign && !argv.verify ? true : false
  const subject = argv.subject || 'Jz9uAKouzDfjEQ5bap1Tgu'
  const payload = argv.payload ? JSON.parse(argv.payload) : JSON.parse('{"email": "someone@example.com"}')
  const verify = argv.verify && !argv.sign ? true : false
  const jwt =
    argv.jwt ||
    'eyJhbGciOiJSUzI1NiIsImtpZCI6IjdLS3QxcDBBem9lWnVxV0REdWdfWWxFdFl5Y3Z6SUlqQ2FSd3VVY3c1d0kifQ.eyJlbWFpbCI6InNvbWVvbmVAZXhhbXBsZS5jb20iLCJzdWIiOiJKejl1QUtvdXpEZmpFUTViYXAxVGd1IiwiYXVkIjoidXJuOmZvcm1hdGxpYnJhcnk6YXBpIiwiaXNzIjoidXJuOmZvcm1hdGxpYnJhcnk6YXV0aCIsImlhdCI6MTY2NzQxODA2OSwiZXhwIjoxNjY3NDE4OTY5fQ.pilTV2ZkYDaU2sBeuZRFtt5_z3A35-P-lUTaKcWGDBS18FL-ExWIBPqh82p-kDmTzXn7k-Yf2QS8b6du7wRMWX5kP0gx8MqBlFNcNX0Sl9AbP6h5Mr3E3dzO9yjfhWlnrocwmMCuPVnCoPgxFgphmV7OPJJlt-Xrj6BOCP-kMnkJFsd38XNboJb117y-yfPukWIIfcRh9GGs9ii08DoZttjE6PLwbngzQF-43uEXaobGgklReFmRi1Lah9I45ISBKb7wE5o-Vx7I7lns2xtM_1xvdDZhdum52m1WGmPLfZzXxFZBJq0PJ0j9K-6oV-OcsAjfcjIilWRCIbMQT2fCbw'
  const expires = argv.expires || '15m'
  const verbose = argv.verbose || false

  // const algorithm = 'RS256'
  const issuer = 'urn:formatlibrary:auth'
  const audience = 'urn:formatlibrary:api'

  const privateJwks = config.siteJWKS || []
  verbose && console.log('jwks (private): ', privateJwks)
  const algorithm = privateJwks[0].alg || 'RS256'

  const keys = await Promise.all(privateJwks.map((privateJwk) => importJWK(privateJwk, algorithm)))
  verbose && console.log('keys (raw): ', keys)

  const publicKeys = await Promise.all(keys.map((key) => exportJWK(key)))
  verbose && console.log('jwks (public): ', publicKeys)

  if (sign) {
    console.log('payload: ', payload)
    const privateJwk = privateJwks[0]
    verbose && console.log('jwk (private): ', privateJwk)
    const kid = await calculateJwkThumbprint(privateJwk, 'sha256')
    verbose && console.log('kid: ', kid)
    const key = keys[0]
    verbose && console.log('key (raw): ', key)

    let signed
    try {
      signed = await new SignJWT(payload)
        .setProtectedHeader({ alg: algorithm, kid })
        .setSubject(subject)
        .setAudience(audience)
        .setIssuer(issuer)
        .setIssuedAt()
        .setExpirationTime(expires)
        .sign(key)
    } catch (error) {
      console.error(error)
      throw new Error('Failed to sign JWT!')
    }
    console.log('signed: ', signed)
  }

  if (verify) {
    console.log('jwt: ', jwt)
    const publicKey = publicKeys[0]
    verbose && console.log('jwk (public): ', publicKey)

    const key = await importJWK(publicKey, algorithm)
    verbose && console.log('publicKey (raw): ', key)

    let claims
    try {
      claims = await jwtVerify(jwt, key, {
        issuer,
        audience
      })
    } catch (error) {
      console.error(error)
      throw new Error('Failed to verify JWT!')
    }
    console.log('claims: ', claims && claims.payload)
  }
})()
