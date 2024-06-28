import { JWK, KeyLike, calculateJwkThumbprint, exportJWK, generateKeyPair } from 'jose'
import { createPublicKey, KeyObject } from 'crypto'
import * as minimist from 'minimist'
import { config } from '@fl/config'

const JWS_VALUES = ['HS256', 'RS256', 'ES256']
const JWE_VALUES = ['RSA-OAEP', 'ECDH-ES']

;(async () => {
  const argv = minimist(process.argv.slice(2))

  if (argv.h) {
    console.log(`
		usage: jwks [--h] [--generate] [--rotate] [--algorithm] [--size] [--number] [--minimize]
		Options:
		--generate  Generate keys
		--rotate    Rotate keys
		--algorithm HS256 | RS256 | ES256
		--size      1024 | 2048 | 4096
		--number    4
		--minimize  true | false
		--h         Show available options	
	`)
    process.exit()
  }

  const generate = argv.generate && !argv.rotate ? true : !argv.generate && !argv.rotate ? true : false
  const rotate = argv.rotate && !argv.generate ? true : false
  const algorithm =
    argv.algorithm === 'HS256'
      ? 'HS256'
      : argv.algorithm === 'RS256'
      ? 'RS256'
      : argv.algorithm === 'ES256'
      ? 'ES256'
      : 'RS256'
  const size = argv.size === '1024' ? 1024 : argv.size === '2048' ? 2048 : argv.size === '4096' ? 4096 : 2048
  const number = argv.number ? parseInt(argv.number) : 4
  const minimize = argv.minimize === 'TRUE' || argv.minimize === 'true' ? true : false

  const generateKeys = async (number: number) => {
    return Promise.all(
      Array(number)
        .fill(0)
        .map(() =>
          generateKeyPair(algorithm, {
            extractable: true,
            modulusLength: size,
            crv: size.toString()
          }).then(({ privateKey }) => privateKey)
        )
    )
  }

  const exportJwks = async (keys: KeyLike[], privateKeys: boolean) => {
    const jwks: JWK[] = []
    for (const keylike of keys) {
      const jwk = await exportJWK(privateKeys ? keylike : createPublicKey(keylike as KeyObject))
      const kid = await calculateJwkThumbprint(jwk, 'sha256')
      const use = JWS_VALUES.includes(algorithm) ? 'sig' : JWE_VALUES.includes(algorithm) ? 'enc' : '--'
      jwks.push({ ...jwk, alg: algorithm, kid, use })
    }
    return jwks
  }

  if (generate) {
    const keys = await generateKeys(number)

    const jwks: JWK[] = await exportJwks(keys, true)

    console.log(`SITE_JWKS='${minimize ? JSON.stringify(jwks) : JSON.stringify(jwks, null, 2)}'`)
  }

  if (rotate) {
    if (!config.siteJWKS) {
      throw new Error('SITE_JWKS not set')
    }
    const jwks = JSON.parse(config.siteJWKS)
    const newkeys = await generateKeys(1)

    const [newJwk] = await exportJwks(newkeys, true)

    const rotated: JWK[] = [newJwk, ...jwks.slice(0, -1)]

    console.log(`SITE_JWKS='${minimize ? JSON.stringify(rotated) : JSON.stringify(rotated, null, 2)}'`)
  }
})()
