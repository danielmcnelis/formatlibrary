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
        console.log('receiveStripeWebhooks req', req)
        console.log('req.body.data.object.', req.body.data.object)
        const invoiceId = req.body.data.object.invoice?.toString()
        console.log('invoiceId', invoiceId)
        const invoice = await Stripe.invoices.retrieve(invoiceId)
        console.log('invoice', invoice)
        const subscriptionId = invoice.subscription?.toString()
        console.log('subscriptionId', subscriptionId)
        const stripeSubscription = await Stripe.subscriptions.retrieve(subscriptionId)
        console.log('stripeSubscription', stripeSubscription)
        let subscription = await Subscription.findOne({
            where: {
                id: stripeSubscription.id
            }
        })

        const product = await Stripe.products.retrieve(stripeSubscription?.items.data[0].plan.product.toString())
        console.log('product', product)
        console.log('invoice.customer_name', invoice.customer_name)
        console.log('invoice.customer_email', invoice.customer_email)

        const tier = product?.name?.toString().replace('Format Library ', '')
        console.log('tier', tier)

        if (subscription) {
            await subscription.update({
                tier: tier,
                status: stripeSubscription.status,
                currentPeriodStart: stripeSubscription.current_period_start * 1000,
                currentPeriodEnd: stripeSubscription.current_period_end * 1000,
                endedAt: stripeSubscription.ended_at * 1000
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

            if (player.email !== invoice.customer_email) {
                await player.update({ alternateEmail: invoice.customer_email })
            }

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
                currentPeriodStart: stripeSubscription.current_period_start * 1000,
                currentPeriodEnd: stripeSubscription.current_period_end * 1000,
                endedAt: stripeSubscription.ended_at * 1000
            })
        }
    } catch (err) {
        next(err)
    }
}

export const getSubscriptions = async (req, res, next) => {
    try {
        const {data: stripeSubscriptions} = await Stripe.subscriptions.list()

        for (let i = 0; i < stripeSubscriptions.length; i++) {
            const stripeSubscription = stripeSubscriptions[i]
            const customer = await Stripe.customers.retrieve(stripeSubscription.customer.toString())
            const tier = stripeSubscription.items.data[0].price.unit_amount === 899 ? 'Premium' : 'Supporter'

            let subscription =  await Subscription.findOne({
                where: {
                    id: stripeSubscription.id
                },
                include: Player
            })

            let player = subscription?.player
            if (!player) {
                player = customer['email'] ? await Player.findOne({
                    where: {
                        [Op.or]: {
                            email: customer['email'],
                            alternateEmail: customer['email'],
                        }
                    }
                }) : {}
            }

            if (player.email !== customer['email']) {
                await player.update({ alternateEmail: customer['email'] })
            }

            if (subscription) {
                await subscription.update({
                    playerName: player?.name,
                    playerId: player?.id,
                    customerEmail: customer['email'],
                    customerName: customer['name'],
                    customerId: customer.id,
                    tier: tier,
                    status: stripeSubscription.status,
                    currentPeriodStart: stripeSubscription.current_period_start * 1000,
                    currentPeriodEnd: stripeSubscription.current_period_end * 1000,
                    endedAt: stripeSubscription.ended_at * 1000
                })
            } else {
                subscription = await Subscription.create({
                    id: subscription.id,
                    playerName: player?.name,
                    playerId: player?.id,
                    customerEmail: customer['email'],
                    customerName: customer['name'],
                    customerId: customer.id,
                    tier: tier,
                    status: subscription.status,
                    currentPeriodStart: subscription.current_period_start * 1000,
                    currentPeriodEnd: subscription.current_period_end * 1000,
                    endedAt: subscription.ended_at * 1000
                })
            }
        }

        res.json(stripeSubscriptions)
    } catch (err) {
        next(err)
    }
}


