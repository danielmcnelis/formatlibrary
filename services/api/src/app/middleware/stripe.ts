// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
import stripe from 'stripe'
// const stripe = Stripe
import {config} from '@fl/config'
import { Player, Subscription } from '@fl/models'
import { Op } from 'sequelize'
const Stripe = new stripe(config.stripe.clientSecret)
// import {manageSubscriptions} from '@fl/bot-functions'
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
        if (req.body.data.object.object === 'subscription') {
            const subscriptionId = req.body.data.object.id.toString()
            const stripeSubscription = req.body.data.object
            const product = await Stripe.products.retrieve(stripeSubscription?.plan.product.toString())
            const customer = await Stripe.customers.retrieve(stripeSubscription?.customer)
            const tier = product?.name?.toString().replace('Format Library ', '')

            let subscription = await Subscription.findOne({
                where: {
                    id: subscriptionId
                }
            })

            if (subscription) {
                const player = await Player.findOne({
                    where: {
                        [Op.or]: {
                            email: customer['email'],
                            alternateEmail: customer['email']
                        }
                    }
                })

                await subscription.update({
                    playerName: player?.name,
                    playerId: player?.id,
                    customerName: customer['name'],
                    customerEmail: customer['email'],
                    customerId: stripeSubscription.customer,
                    tier: tier,
                    status: stripeSubscription.status,
                    currentPeriodStart: stripeSubscription.current_period_start * 1000,
                    currentPeriodEnd: stripeSubscription.current_period_end * 1000,
                    endedAt: stripeSubscription.ended_at * 1000
                })
            } else {
                const player = await Player.findOne({
                    where: {
                        [Op.or]: {
                            email: customer['email'],
                            alternateEmail: customer['email']
                        }
                    }
                })

                if (stripeSubscription.status === 'active' && player) {
                    await player.update({
                        subscriber: true,
                        subscriberTier: tier,
                    })
                }

                subscription = await Subscription.create({
                    id: stripeSubscription.id,
                    playerName: player?.name,
                    playerId: player?.id,
                    customerName: customer['name'],
                    customerEmail: customer['email'],
                    customerId: stripeSubscription.customer,
                    tier: tier,
                    status: stripeSubscription.status,
                    currentPeriodStart: stripeSubscription.current_period_start * 1000,
                    currentPeriodEnd: stripeSubscription.current_period_end * 1000,
                    endedAt: stripeSubscription.ended_at * 1000
                })
            }
        }

        res.status(200)
    } catch (err) {
        next(err)
    }
}

export const getSubscriptions = async (req, res, next) => {
    try {
        const {data: stripeSubscriptions} = await Stripe.subscriptions.list()

        console.log('stripeSubscriptions', stripeSubscriptions)

        for (let i = 0; i < stripeSubscriptions.length; i++) {
            const stripeSubscription = stripeSubscriptions[i]
            const customer = await Stripe.customers.retrieve(stripeSubscription.customer.toString())
            console.log('customer', customer)
            const tier = stripeSubscription.items.data[0].price.unit_amount === 899 ? 'Premium' : 'Supporter'

            let subscription = await Subscription.findOne({
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
                            email: {[Op.iLike]: customer['email']},
                            alternateEmail: {[Op.iLike]: customer['email']},
                        }
                    }
                }) : {}
            }

            if (player && player.email !== customer['email']) {
                await player.update({ alternateEmail: customer['email'] })
            }

            if (subscription) {
                await subscription.update({
                    playerName: player?.name,
                    playerId: player?.id,
                    customerEmail: customer['email'],
                    customerName: customer['name'],
                    customerId: customer?.id,
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
                    customerId: customer?.id,
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


