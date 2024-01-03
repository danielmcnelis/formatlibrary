import { Router } from './Router'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { getCookie } from '@fl/utils'
import { Helmet } from 'react-helmet'
import { useDetectAdBlock } from 'adblock-detect-react'
import { SocketProvider } from '@fl/context'
import {config} from '@fl/config'
import io from 'socket.io-client'
const socket = io(config.siteUrl)

const App = () => {
    const playerId = getCookie('playerId')
    console.log('playerId', playerId)
    const visited = getCookie('visited')
    console.log('visited', visited)
    const [isSubscriber, setIsSubscriber] = useState(false)
    console.log('isSubscriber', isSubscriber)
    const [isTracking, setIsTracking] = useState(false)  
    console.log('isTracking', isTracking)
    const [checkedTracking, setCheckedTracking] = useState(false)  
    console.log('checkedTracking', checkedTracking)
    const [checkedSubscription, setCheckedSubscription] = useState(false)  
    console.log('checkedSubscription', checkedSubscription)
    const adBlockDetected = useDetectAdBlock()
    console.log('adBlockDetected', adBlockDetected)
    const [showReminder, setShowReminder] = useState(false) 
    console.log('showReminder', showReminder)

    // USE EFFECT
    useEffect(() => {
        if (adBlockDetected && !visited) {
            setShowReminder(true)
            
            const checkIfTracking = async () => {
                try {
                    const { status } = await axios.get(`/api/cookies/track`)
                    if (status === 200) setIsTracking(true)
                } catch (err) {
                    console.log(err)
                }

                setCheckedTracking(true)
            }
    
            checkIfTracking()
        }
    }, [adBlockDetected, visited])

    // USE EFFECT
    useEffect(() => {
        if (playerId) {
            const checkIfSubscriber = async () => {
                try {
                    const { status } = await axios.get(`/api/players/subscriber/${playerId}`)
                    if (status === 200) setIsSubscriber(true)
                } catch (err) {
                    console.log(err)
                }
    
                setCheckedSubscription(true)
            }
    
            checkIfSubscriber()
        }
    }, [])

  return (
    <div>
        <Helmet>
            {
                playerId && !checkedSubscription ? '' : 
                    !isSubscriber ? (
                        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2048547741313745" crossOrigin="anonymous"></script>
                    ) : ''
            }
        </Helmet>
        <div className="app">
            {
                playerId && !checkedSubscription ? (<SocketProvider value={socket}> <Router/> </SocketProvider>) :
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
                    ) : (<SocketProvider value={socket}> <Router/> </SocketProvider>)
            }
        </div>
    </div>
  )
}

export default App
