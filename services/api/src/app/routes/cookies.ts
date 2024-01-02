import { Router } from 'express'
import { trackVisit } from '../middleware'

const router = Router()

router.get('/api/cookies/track', trackVisit)

export default router
