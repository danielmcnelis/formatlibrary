import { customAlphabet } from 'nanoid'
import * as minimist from 'minimist'
import { config } from '@fl/config'
const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const kid = (): string => customAlphabet(base58, 22)()
const key = (size: number): string => customAlphabet(base58, size)()

;(async () => {
  const argv = minimist(process.argv.slice(2))

  if (argv.h) {
    console.log(`
		usage: iks [--h] [--generate] [--rotate] [--size] [--number] [--minimize]
		Options:
		--generate  Generate keys
		--rotate    Rotate keys
		--size      128 | 256 | 512
		--number    4
		--minimize  true | false
		--h         Show available options	
		`)
    process.exit()
  }

  const generate = argv.generate && !argv.rotate ? true : !argv.generate && !argv.rotate ? true : false
  const rotate = argv.rotate && !argv.generate ? true : false
  const size = argv.size === '128' ? 128 : argv.size === '256' ? 256 : argv.size === '512' ? 512 : 256
  const number = argv.number ? parseInt(argv.number) : 4
  const minimize = argv.minimize === 'TRUE' || argv.minimize === 'true' ? true : false

  const generateKeys = async (number: number) => {
    return Promise.resolve(
      Array(number)
        .fill(0)
        .map(() => ({ kid: kid(), sig: key(size), enc: key(size) }))
    )
  }

  if (generate) {
    const iks = await generateKeys(number)

    console.log(`SITE_IKS='${minimize ? JSON.stringify(iks) : JSON.stringify(iks, null, 2)}'`)
  }

  if (rotate) {
    if (!config.siteIKS) {
      throw new Error('SITE_IKS not set')
    }
    const iks = JSON.parse(config.siteIKS)
    const newkeys = await generateKeys(1)

    const [newIk] = newkeys

    const rotated: any[] = [newIk, ...iks.slice(0, -1)]

    console.log(`SITE_IKS='${minimize ? JSON.stringify(rotated) : JSON.stringify(rotated, null, 2)}'`)
  }
})()
