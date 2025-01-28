import { Router } from './Router'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { getCookie } from '@fl/utils'
import { useDetectAdBlock } from 'adblock-detect-react'
import {Elements} from '@stripe/react-stripe-js'
import {loadStripe} from '@stripe/stripe-js'
import { client } from 'libs/bot-functions/src/client'

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('pk_test_51LIfMzI2hSs9VrZuvedTsVTHy91Julkndoa3ngNSu57SEDslvLipAGD1FaZ2L6vQ4fp4RWwIejgKgcfKISQZFazW00DTWtDgVz');

const App = () => {
    const playerId = getCookie('playerId')
    const visited = getCookie('visited')
    const [roles, setRoles] = useState({
        admin: false, 
        contentManager: false, 
        subscriber: false
    })
    const [clientSecret, setClientSecret] = useState()
    console.log('clientSecret', clientSecret)
    
    const [checkedSubscription, setCheckedSubscription] = useState(false)  
    const adBlockDetected = useDetectAdBlock()
    const [showReminder, setShowReminder] = useState(false) 

    // USE EFFECT
    useEffect(() => {
        const fetchClientSecret = async () => {
            const { data } = await axios.get(`/api/stripe/payment`)
            return setClientSecret(data.client_secret)
        }

        fetchClientSecret()
    }, [])

    // USE EFFECT
    useEffect(() => {
        if (adBlockDetected && !visited) {
            setShowReminder(true)
            
            const track = async () => {
                try {
                    await axios.get(`/api/cookies/track`)
                } catch (err) {
                    console.log(err)
                }
            }
    
            track()
        }
    }, [adBlockDetected, visited])

    // USE EFFECT
    useEffect(() => {
        const checkRoles = async () => {
            try {
                const accessToken = getCookie('access')
                const { data: player } = await axios.get(`/api/players/roles`, {
                    headers: {
                        ...(accessToken && {authorization: `Bearer ${accessToken}`})
                    }
                })

                setRoles({
                    admin: player.isAdmin,
                    contentManager: player.isContentManager,
                    subscriber: player.isSubscriber
                })
                
                setCheckedSubscription(true)
            } catch (err) {
                setCheckedSubscription(true)
                console.log(err)
            }
        }

        if (playerId) checkRoles()
    }, [playerId])

    // if (!checkedSubscription) return <div style={{height: '100vh'}}/>
    // const disableAds = checkedSubscription && roles.subscriber
    const disableAds = playerId && (!checkedSubscription || (checkedSubscription && roles.subscriber))

    const options = { clientSecret }
    if (!clientSecret) return <div/>
      
  return (
    <Elements stripe={stripePromise} options={options}>
        <div className="app">
            {
                playerId && !checkedSubscription ? (<Router disableAds={disableAds}/>) :
                    adBlockDetected && showReminder ? (
                        <div className="ad-block-detected">
                            <h2>Reminder: Please allow cookies and disable your ad-blocker.</h2>
                            <p>Format Library depends on modest ad revenue to operate and produce content. <span role="img" aria-label="artist">🧑‍🎨</span></p>
                            <p>We kindly ask you to whitelist us on your ad-blocker. <span role="img" aria-label="smiley">😊</span></p>
                            <br/>
                            <p>You can also subscribe to the <a style={{color: 'blue'}} href="https://discord.com/invite/formatlibrary">Format Library Discord server</a> Supporter Tier for $3.99/month and log-in to the website below.</p>
                            <div>
                                <ul className="perks">
                                    <h3>Supporter perks include:</h3>
                                    <li>Ad-free browsing</li>
                                    <li>Matchup data</li>
                                    <li>Complete tournament coverage</li>
                                    <li>Special Discord badges</li>
                                </ul>
                            </div>
                            <br/>
                            <div className="horizontal-centered-flexbox">
                                <a className="show-cursor reminder-button" href="/auth/login/">
                                    <h1 className="login">LOGIN</h1>
                                </a>
                                <div className="show-cursor reminder-button" onClick={() => window.location.reload()}>
                                    <h1 className="login">CONTINUE</h1>
                                </div>
                            </div>
                        </div>
                    ) : (<Router disableAds={disableAds} roles={roles}/>)
            }
        </div>
    </Elements>
    )
}

export default App
