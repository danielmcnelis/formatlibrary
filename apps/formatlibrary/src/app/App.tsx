import { Router } from './Router'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { getCookie } from '@fl/utils'
import { Helmet } from 'react-helmet'
import { useDetectAdBlock } from 'adblock-detect-react'
import { SocketProvider } from '@fl/context'
import io from 'socket.io-client'

const playerId = getCookie('playerId')
const socket = io('https://formatlibrary.com')

const App = () => {
    const [isSubscriber, setIsSubscriber] = useState(false)
    const [checkedSubscription, setCheckedSubscription] = useState(false)  
    const adBlockDetected = useDetectAdBlock()

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
                    adBlockDetected && !isSubscriber ? (
                        <div className="ad-block-detected">
                            <h2>Please disable your ad-blocker to view this website.</h2>
                            <p>Format Library depends on modest ad revenue to operate and produce content. If you do not wish to see ads, another option is to subscribe to the <a style={{color: 'blue'}} href="https://discord.com/invite/formatlibrary">Format Library Discord server</a> and log-in below:</p>
                            <a href="/auth/login/">
                                <h1 className="login">LOGIN</h1>
                            </a>
                        </div>) : (<SocketProvider value={socket}> <Router/> </SocketProvider>)
            }
        </div>
    </div>
  )
}

export default App
