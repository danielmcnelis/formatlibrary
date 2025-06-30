import { Router } from 'express'
import { authenticate, getReplayCommunities, getReplaysAsRegularUser, getReplaysAsAdmin, getReplaysAsSubscriber, countReplays } from '../middleware'

const router = Router()

router.get('/api/replays/communities', getReplayCommunities)

router.get('/api/replays/count', countReplays)

router.get('/api/replays/admin', [authenticate, getReplaysAsAdmin])

router.get('/api/replays/subscriber', [authenticate, getReplaysAsSubscriber])

router.get('/api/replays/', [authenticate, getReplaysAsRegularUser])

export default router
