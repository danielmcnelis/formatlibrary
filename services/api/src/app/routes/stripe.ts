import { Router } from 'express'
import { paymentIntent } from '../middleware'

const router = Router()

router.get('/api/stripe/payment', paymentIntent)

export default router
