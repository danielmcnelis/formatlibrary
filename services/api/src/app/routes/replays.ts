import { Router } from 'express'
import { authenticate, getReplays, countReplays } from '../middleware'

const router = Router()

router.get('/api/replays/count', [authenticate, countReplays])

router.get('/api/replays/', [authenticate, getReplays])

export default router
