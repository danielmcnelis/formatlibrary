import { Router } from 'express'
import { getMatchupH2H, getMatchupMatrix } from '../middleware'

const router = Router()

router.get('/api/matchups/h2h/:id', getMatchupH2H)

router.get('/api/matchups/:id', getMatchupMatrix)

export default router
