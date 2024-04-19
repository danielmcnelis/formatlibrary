import { Router } from 'express'
import { createMockBracket, tournamentsChallonge } from '../middleware'

const router = Router()

router.get('/api/tournaments/challonge/:name', tournamentsChallonge)

router.post('/api/tournaments/mock-bracket', createMockBracket)

export default router
