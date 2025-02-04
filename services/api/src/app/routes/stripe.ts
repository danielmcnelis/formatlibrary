import { Router } from 'express'
import { getSubscriptions, paymentIntent, receiveStripeWebhooks } from '../middleware'

const router = Router()

router.post('/api/stripe/webhooks', receiveStripeWebhooks)

router.put('/api/stripe/subscriptions', getSubscriptions)

router.get('/api/stripe/payment', paymentIntent)

export default router
