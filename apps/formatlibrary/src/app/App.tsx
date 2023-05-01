import { Router } from './Router'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { getCookie } from '@fl/utils'
import {Helmet} from 'react-helmet'

const playerId = getCookie('playerId')


const App = () => {
    const [isSubscriber, setIsSubscriber] = useState(false)
    const [checkedSubscription, setCheckedSubscription] = useState(false)
    console.log('isSubscriber', isSubscriber)
    console.log('checkedSubscription', checkedSubscription)

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
            <script>console.log('@_@')</script>
            {
                !isSubscriber ? (
                    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2048547741313745" crossOrigin="anonymous"></script>
                ) : ''
            }
        </Helmet>
        <div className="app">
        <Router />
            
        </div>
    </div>
  )
}

export default App
