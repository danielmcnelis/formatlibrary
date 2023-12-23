import { Router } from 'express'
import { authenticate, getActivePairings, getActivePools, getRatedDecks } from '../middleware'

const router = Router()

router.get('/api/rated/pairings/active', getActivePairings)

router.get('/api/rated/pools/active', getActivePools)

router.get('/api/rated/my-decks', [authenticate, getRatedDecks])

export default router
