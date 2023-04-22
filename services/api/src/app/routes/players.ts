import { Router } from 'express'
import { playersAdmin, playersContentManager, playersQuery, playersPassword, playersCreate, playersId, playersAll, playersUpdateId } from '../middleware'

const router = Router()

router.get('/api/players/query/:query', playersQuery)

router.put('/api/players/update/:id', playersUpdateId)

router.put('/api/players/password/:id', playersPassword)

router.get('/api/players/content-manager/:id', playersContentManager)

router.get('/api/players/admin/:id', playersAdmin)

router.get('/api/players/:id', playersId)

router.get('/api/players/', playersAll)

router.post('/api/players/create', playersCreate)

export default router
