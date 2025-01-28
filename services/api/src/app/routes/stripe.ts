import { Router } from 'express'
import { receiveStripeWebhooks, paymentIntent } from '../middleware'

const router = Router()

router.post('/api/stripe/webhook', receiveStripeWebhooks)

router.get('/api/stripe/payment', paymentIntent)

export default router
