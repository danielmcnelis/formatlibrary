import { Router } from 'express'
import { createMockBracket, getTournamentByChallongeName } from '../middleware'

const router = Router()

router.get('/api/tournaments/challonge/:name', getTournamentByChallongeName)

router.post('/api/tournaments/mock-bracket', createMockBracket)

export default router
