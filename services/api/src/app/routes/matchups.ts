import { Router } from 'express'
import { getMatchupH2H } from '../middleware'

const router = Router()

router.get('/api/matchups/:id', getMatchupH2H)

export default router
