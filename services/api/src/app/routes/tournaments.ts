import { Router } from 'express'
import { tournamentsChallonge } from '../middleware'

const router = Router()

router.get('/api/tournaments/challonge/:name', tournamentsChallonge)

export default router
