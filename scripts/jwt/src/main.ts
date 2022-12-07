// import { SignJWT, jwtVerify, calculateJwkThumbprint, importJWK, exportJWK } from 'jose'
import * as minimist from 'minimist'
import { config } from '@fl/config'
import { JWT } from '@fl/tokens'

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
  const subject = argv.subject || '123'
  const payload = argv.payload ? JSON.parse(argv.payload) : JSON.parse('{"email": "bob@example.com"}')
  const verify = argv.verify && !argv.sign ? true : false
  const token =
    argv.jwt ||
        'eyJhbGciOiJSUzI1NiIsImtpZCI6IjdLS3QxcDBBem9lWnVxV0REdWdfWWxFdFl5Y3Z6SUlqQ2FSd3VVY3c1d0kifQ.eyJlbWFpbCI6ImJvYkBleGFtcGxlLmNvbSIsInN1YiI6IjEyMyIsImF1ZCI6InVybjpmb3JtYXRsaWJyYXJ5OmFwaSIsImlzcyI6InVybjpmb3JtYXRsaWJyYXJ5OmF1dGgiLCJpYXQiOjE2Njk4NTk1NTcsImV4cCI6MTY2OTg2MDQ1N30.Zfsq7uH8gljVfUWTItvaRzt4GRt9Us95L4fjTvCxFBYDm48WcLv8V-S-g-ObpEUTGkdv2BwrdK8_x2kSDs2BLtjNyPTBGELhvzkPaT-dv0L1XOuiOwYBf42cfRe39mzTqnmeg3pLEXVUSioDpyWQk2HO4tFdEHCqWomiT8SFd9KEglITZu4RT72Fig7GcsZsmzR6mMAWGZX3I_5eTAjlbvUqy5yZM_Bnqnr4-WQZdkZP9SCZSIxoY3RW-1Bj8Nzkg9-MGTo6NI-ZVBqRoGe4BayUwtYuD4hGQ3CZmCE57_hW0rpxJmEg6mH_9V6ZgFwEjxVxSc1PNEz4IHPqt7LiBQ'
    const expires = argv.expires || '15m'
  const verbose = argv.verbose || false

  const issuer = 'urn:formatlibrary:auth'
  const audience = 'urn:formatlibrary:api'

  const privateJwks = config.siteJWKS || []
  verbose && console.log('jwks (private): ', privateJwks)
  const algorithm = privateJwks[0].alg || 'RS256'

  if (sign) {
      const jwt = new JWT({
        algorithm,
        issuer,
        audience,
        jwks: config.siteJWKS,
        expires
     })

    let token
    try {
        token = await jwt.sign(subject, payload)
    } catch (err) {
        console.error(err)
        throw new Error('Failed to sign JWT!')
    }

    console.log('token: ', token)
  }

  if (verify) {
    const jwt = new JWT({
        algorithm,
        issuer,
        audience,
        jwks: config.siteJWKS,
        expires
    })

    let claims
    try {
        claims = await jwt.verify(token)
    } catch (err) {
        console.error(err)
        throw new Error('Failed to verify JWT!')
    }

    console.log('claims: ', claims)
  }
})()
