import { Router } from 'express'
import { getClassicLeaderboard, getGeneralLeaderboard, getSeasonalLeaderboard, getStatsByPlayerId } from '../middleware'

const router = Router()

router.get('/api/stats/classic-leaders/:limit/:format', getClassicLeaderboard)

router.get('/api/stats/general-leaders/:limit/:format', getGeneralLeaderboard)

router.get('/api/stats/seasonal-leaders/:limit/:format', getSeasonalLeaderboard)

router.get('/api/stats/:playerId', getStatsByPlayerId)

export default router
