import { Router } from 'express'
// import { authenticate, getPrices, getPricesAsSubscriber } from '../middleware'
import { getPrices } from '../middleware'

const router = Router()

// router.get('/api/prices/subscriber/:id', [authenticate, getPricesAsSubscriber])

router.get('/api/prices/:id', getPrices)

export default router
