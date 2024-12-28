import { Router } from 'express'
import { classicStatsLeaders, statsLeaders, statsPlayer } from '../middleware'

const router = Router()

router.get('/api/stats/classic-leaders/:limit/:format', classicStatsLeaders)

router.get('/api/stats/leaders/:limit/:format', statsLeaders)

router.get('/api/stats/:playerId', statsPlayer)

export default router
