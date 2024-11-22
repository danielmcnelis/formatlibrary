import { Router } from './Router'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { getCookie } from '@fl/utils'
import { useDetectAdBlock } from 'adblock-detect-react'

const App = () => {
    const playerId = getCookie('playerId')
    const visited = getCookie('visited')
    const [roles, setRoles] = useState({
        admin: false, 
        contentManager: false, 
        subscriber: false
    })
    
    const [checkedSubscription, setCheckedSubscription] = useState(false)  
    const adBlockDetected = useDetectAdBlock()
    const [showReminder, setShowReminder] = useState(false) 

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
                    admin: player.admin,
                    contentManager: player.contentManager,
                    subscriber: player.subscriber
                })
                
                setCheckedSubscription(true)
            } catch (err) {
                setCheckedSubscription(true)
                console.log(err)
            }
        }

        if (playerId) checkRoles()
    }, [playerId])

    if (!checkedSubscription) return <div style={{height: '100vh'}}/>
    const disableAds = checkedSubscription && roles.subscriber

  return (
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
    )
}

export default App
