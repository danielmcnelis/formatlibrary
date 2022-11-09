import { Router } from 'express'
import { setsBoosters } from '../middleware'

const router = Router()

router.get('/api/sets/boosters', setsBoosters)

export default router
