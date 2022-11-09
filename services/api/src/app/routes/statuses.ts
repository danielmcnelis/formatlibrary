import { Router } from 'express'
import { statusesQuery } from '../middleware'

const router = Router()

router.get('/api/statuses/query', statusesQuery)

export default router
