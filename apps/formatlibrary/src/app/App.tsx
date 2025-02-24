import { Router } from './Router'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { getCookie } from '@fl/utils'
import { useDetectAdBlock } from 'adblock-detect-react'
import { Subscriptions } from '@fl/components'
// import { client } from 'libs/bot-functions/src/client'

const App = () => {
    const adBlockDetected = useDetectAdBlock()
    const playerId = getCookie('playerId')
    const visited = getCookie('visited')
    const [roles, setRoles] = useState({
        admin: false, 
        contentManager: false, 
        subscriber: false
    })
    
    const oneDayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000))
    const [checkedSubscription, setCheckedSubscription] = useState(false)  
    const [showReminder, setShowReminder] = useState(false) 

    // USE EFFECT
    useEffect(() => {
        if (adBlockDetected && (Number(visited) < oneDayAgo.getTime())) {
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
    }, [adBlockDetected, visited, oneDayAgo])

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
      
  return (
        <div className="app">
        {
            playerId && !checkedSubscription ? (<Router disableAds={disableAds}/>) :
                adBlockDetected && showReminder ? (
                    <div>
                        <div className="ad-block-detected">
                            <p>Format Library depends on modest ad revenue to operate and produce content. <span role="img" aria-label="artist">🧑‍🎨</span> We kindly ask you to whitelist us on your ad-blocker. <span role="img" aria-label="smiley">😊</span></p>
                            <p>You can also subscribe for ad-free content and other perks below.</p>
                        </div>
                        <Subscriptions/>
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
    )
}

export default App
