// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
import stripe from 'stripe'
// const stripe = Stripe
import {config} from '@fl/config'
const Stripe = new stripe(config.stripe.clientSecret)
// import {Elements} from '@stripe/react-stripe-js'
// import {loadStripe} from '@stripe/stripe-js'
// import { client } from 'libs/bot-functions/src/client'

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
// const stripePromise = loadStripe('pk_test_51LIfMzI2hSs9VrZuvedTsVTHy91Julkndoa3ngNSu57SEDslvLipAGD1FaZ2L6vQ4fp4RWwIejgKgcfKISQZFazW00DTWtDgVz');


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

export const receiveStripeWebhooks = async (req, res, next) => {
    try {
        const {data} = req.body
        console.log('data', data)
        // console.log('req.body.data.object', req.body.data.object)
        const subscriptionId = req.body.data.object.id
        // const stripe = require('stripe')('sk_test_51LIfMzI2hSs9VrZuFmtxDKAkWCkCgXPdtEQWnL8tciHFaOkoedx5E3vLP8tdhxwNLb5t6vzAfs0jc3AQc82nArUx00RtdCMVaU')
        const subscription = await Stripe.subscriptions.retrieve(subscriptionId)
        console.log('subscription', subscription)
    } catch (err) {
        next(err)
    }
}


