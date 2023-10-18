import { Router } from 'express'
import { getBoosters, generatePacks, generateBox, getSet  } from '../middleware'

const router = Router()

router.get('/api/sets/boosters', getBoosters)

router.get('/api/sets/open-packs/:set_code', generatePacks)

router.get('/api/sets/open-box/:set_code', generateBox)

router.get('/api/sets/:id', getSet)

export default router
