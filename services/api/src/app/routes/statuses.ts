import { Router } from 'express'
import { getStatuses } from '../middleware'

const router = Router()

router.get('/api/statuses/', getStatuses)

export default router
