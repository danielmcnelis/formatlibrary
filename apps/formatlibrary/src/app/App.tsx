import { Router } from './Router'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { getCookie } from '@fl/utils'
import { useDetectAdBlock } from 'adblock-detect-react'
import { Subscriptions } from '@fl/components'
// import { client } from 'libs/bot-functions/src/client'

const App = () => {
    // console.log('navigator.userAgent', navigator.userAgent)
    const adBlockDetected = useDetectAdBlock()
    // console.log('adBlockDetected', adBlockDetected)
    const playerId = getCookie('playerId')
    const visited = getCookie('visited')
    // console.log('playerId', playerId)
    // console.log('visited', visited)
    const [roles, setRoles] = useState({
        admin: false, 
        contentManager: false, 
        subscriber: false
    })
    
    const [checkedSubscription, setCheckedSubscription] = useState(false)  
    // console.log('checkedSubscription', checkedSubscription)
    // const [showReminder, setShowReminder] = useState(false) 
    // console.log('showReminder', showReminder)
    // const oneDayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000))
    // console.log('oneDayAgo', oneDayAgo)
    // console.log(`adBlockDetected && (Number(visited) < oneDayAgo.getTime()`, adBlockDetected && (Number(visited) < oneDayAgo.getTime()))

    // USE EFFECT
    // useEffect(() => {
    //     if ((adBlockDetected && (Number(visited) > oneDayAgo.getTime())) || !visited) {
    //         setShowReminder(true)
            
    //         const track = async () => {
    //             try {
    //                 await axios.get(`/api/cookies/track`)
    //             } catch (err) {
    //                 console.log(err)
    //             }
    //         }
    
    //         track()
    //     }
    // }, [adBlockDetected, visited])

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

    const disableAds = playerId && (!checkedSubscription || (checkedSubscription && roles.subscriber))
    // console.log('disableAds', disableAds)
      
  return (
        <div className="app">
        {
            playerId && !checkedSubscription ? (<Router disableAds={disableAds}/>) :
                !roles.subscriber && adBlockDetected /* && showReminder */ ? (
                    <div>
                        <div className="ad-block-detected">
                            <br/>
                            <p>Format Library depends on modest ad revenue to operate. Please pause your ad-blocker to view our content. <span role="img" aria-label="smiley">😊</span></p>
                            <br/>
                            <p>You can also subscribe and log-in below for ad-free content and other perks!</p>
                        </div>
                        <Subscriptions/>
                        <div className="horizontal-centered-flexbox">
                            <a className="show-cursor reminder-button" href="/auth/login/">
                                <h1 className="login">LOGIN</h1>
                            </a>
                            <a className="show-cursor reminder-button" href="/subscribe/" /* onClick={() => window.location.reload()} */>
                                <h1 className="login">SUBSCRIBE</h1>
                            </a>
                        </div>
                    </div>
             ) : (
                    <Router disableAds={disableAds} roles={roles}/>
             )
        }
        </div>
    )
}

export default App
