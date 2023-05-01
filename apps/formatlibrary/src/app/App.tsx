import { Router } from './Router'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { getCookie } from '@fl/utils'
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
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2048547741313745" crossOrigin="anonymous"></script>
        <div className="app">
        <Router />
            {/* {
                playerId && !checkedSubscription ? '' : (
                    <div>
                        {
                            !isSubscriber ? (
                                <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2048547741313745" crossOrigin="anonymous"></script>
                            ) : ''
                        }
                        <Router />
                    </div>
                )
            } */}
        </div>
    </div>
  )
}

export default App
