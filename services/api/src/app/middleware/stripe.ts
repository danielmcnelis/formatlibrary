// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
import stripe from 'stripe'
// const stripe = Stripe
import {config} from '@fl/config'
import { Player, Subscription } from '@fl/models'
import { Op } from 'sequelize'
const Stripe = new stripe(config.stripe.clientSecret)
// import {Elements} from '@stripe/react-stripe-js'
// import {loadStripe} from '@stripe/stripe-js'
// import { client } from 'libs/bot-functions/src/client'

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
// const stripePromise = loadStripe('pk_test_51LIfMzI2hSs9VrZuvedTsVTHy91Julkndoa3ngNSu57SEDslvLipAGD1FaZ2L6vQ4fp4RWwIejgKgcfKISQZFazW00DTWtDgVz');


export const paymentIntent = async (req, res, next) => {
    try {
        const intent = await Stripe.paymentIntents.create({
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
        const invoiceId = req.body.data.object.invoice.toString()
        const invoice = await Stripe.invoices.retrieve(invoiceId)
        const subscriptionId = invoice.subscription.toString()
        const stripeSubscription = await Stripe.subscriptions.retrieve(subscriptionId)
        console.log('stripeSubscription', stripeSubscription)
        let subscription = await Subscription.findOne({
            where: {
                id: stripeSubscription.id
            }
        })

        const product = await Stripe.products.retrieve(stripeSubscription?.items.data[0].plan.product.toString())
        console.log('product', product)

        const tier = product?.name?.toString().replace('Format Library ', '')

        if (subscription) {
            await subscription.update({
                tier: tier,
                status: stripeSubscription.status,
                currentPeriodStart: stripeSubscription.current_period_start,
                currentPeriodEnd: stripeSubscription.current_period_end,
                endedAt: stripeSubscription.ended_at
            })
        } else {
            const player = invoice.customer_email ? await Player.findOne({
                where: {
                    [Op.or]: {
                        email: invoice.customer_email,
                        alternateEmail: invoice.customer_email
                    }
                }
            }) : null

            if (stripeSubscription.status === 'active') {
                await player.update({
                    subscriber: true,
                    subscriberTier: tier,
                })
            }

            subscription = await Subscription.create({
                id: stripeSubscription.id,
                playerName: player?.name,
                playerId: player?.id,
                customerName: invoice.customer_name,
                customerEmail: invoice.customer_email,
                customerId: stripeSubscription.customer,
                tier: tier,
                status: stripeSubscription.status,
                currentPeriodStart: stripeSubscription.current_period_start,
                currentPeriodEnd: stripeSubscription.current_period_end,
                endedAt: stripeSubscription.ended_at
            })
        }
    } catch (err) {
        next(err)
    }
}


