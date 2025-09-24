import { Router } from 'express'
import { getPoints } from '../middleware'

const router = Router()

router.get('/api/points', getPoints)

export default router
