import { Router } from 'express'
import { authenticate, getPlayerRoles, playersQuery, playersPassword, playersCreate, playersId, playersAll, playersUpdateId } from '../middleware'

const router = Router()

router.get('/api/players/query/:query', playersQuery)

router.put('/api/players/update/:id', playersUpdateId)

router.put('/api/players/password/:id', playersPassword)

router.get('/api/players/roles', [authenticate, getPlayerRoles])

router.get('/api/players/:id', playersId)

router.get('/api/players/', playersAll)

router.post('/api/players/create', playersCreate)

export default router
