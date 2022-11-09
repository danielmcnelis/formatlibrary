import { Router } from 'express'
import { banlistsAll, banlistsDate, banlistsSimpleDate, banlistsCreate } from '../middleware'

const router = Router()

router.get('/api/banlists/all', banlistsAll)

router.get('/api/banlists/:date', banlistsDate)

router.get('/api/banlists/simple/:date', banlistsSimpleDate)

router.post('/api/banlists/create', banlistsCreate)

export default router
