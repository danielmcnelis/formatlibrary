import { Router } from 'express'
import { authenticate, getReplaysAsRegularUser, getReplaysAsAdmin, getReplaysAsSubscriber, countReplays } from '../middleware'

const router = Router()

router.get('/api/replays/count', countReplays)

router.get('/api/replays/admin', [authenticate, getReplaysAsAdmin])

router.get('/api/replays/subscriber', [authenticate, getReplaysAsSubscriber])

router.get('/api/replays/', getReplaysAsRegularUser)

export default router
