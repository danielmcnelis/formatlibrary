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
    }, [])

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
                            <a href="/auth/login/">
                                <h1 className="login">LOGIN</h1>
                            </a>
                            <div onClick={() => window.location.reload()}>
                                <h1 className="login">CONTINUE</h1>
                            </div>
                        </div>
                    ) : (<SocketProvider value={socket}> <Router/> </SocketProvider>)
            }
        </div>
    </div>
  )
}

export default App
