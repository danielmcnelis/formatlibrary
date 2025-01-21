// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
import stripe from 'stripe'
// const stripe = Stripe
import {config} from '@fl/config'
const s = new stripe(config.stripe.clientSecret)

export const paymentIntent = async (req, res, next) => {
    try {
        const intent = await s.paymentIntents.create({
            amount: 1099,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
        })
    
        res.json({client_secret: intent.client_secret})

    } catch (err) {
        next(err)
    }
}