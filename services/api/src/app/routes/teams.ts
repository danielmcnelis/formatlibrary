import { Router } from 'express'
import { createTeam } from '../middleware'

const router = Router()

router.post('/api/teams/create', createTeam)

export default router
