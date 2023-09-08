import { Router } from 'express'
import { getReplays, countReplays } from '../middleware'

const router = Router()

router.get('/api/replays/count', countReplays)

router.get('/api/replays/', getReplays)

export default router
