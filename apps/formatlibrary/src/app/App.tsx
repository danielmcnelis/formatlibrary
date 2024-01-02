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
    const visited = getCookie('visited')
    const [isSubscriber, setIsSubscriber] = useState(false)
    const [isTracking, setIsTracking] = useState(false)  
    const [checkedTracking, setCheckedTracking] = useState(false)  
    const [checkedSubscription, setCheckedSubscription] = useState(false)  
    const adBlockDetected = useDetectAdBlock()
    const [showReminder, setShowReminder] = useState(false) 

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
                    adBlockDetected && checkedSubscription && !isSubscriber && showReminder ? (
                        <div className="ad-block-detected">
                            <h2>Reminder: Please allow cookies and disable your ad-blocker to view this website.</h2>
                            <p>Format Library depends on modest ad revenue to operate and produce content. If you do not wish to see ads, you can also subscribe to the <a style={{color: 'blue'}} href="https://discord.com/invite/formatlibrary">Format Library Discord server</a> for $3.99/month and log-in below:</p>
                            <div className="horizontal-centered-flexbox">
                                <a href="/auth/login/">
                                    <h1 className="login">LOGIN</h1>
                                </a>
                                <div className="show-cursor" onClick={() => window.location.reload()}>
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
