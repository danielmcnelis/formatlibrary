
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { EventThumbnail } from './EventThumbnail'

export const RecentEvents = (props) => {
    const [recentEvents, setRecentEvents] = useState([])
    const [winners, setWinners] = useState([])
    const navigate = useNavigate()
    const goToEventGallery = () => navigate(`/event-gallery/${props.format.name}`)
  
    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            try {
                const {data} = await axios.get(`/api/events/recent/${props.format.name}`)
                setRecentEvents(data.events)
                setWinners(data.winners)
            } catch (err) {
                console.log(err)
                
            }
        }

        fetchData()
    }, [props])

    if (!recentEvents.length) return <div/>

    return (
        <div>
            <div className="divider"/>
            <div id="recent-events" className="recent-events">
                <h2 onClick={() => goToEventGallery()} className="subheading">Recent Events:</h2>
                <div className="recent-events-flexbox">
                {
                    recentEvents.map((event, index) => <EventThumbnail key={event.id} event={event} winner={winners[index]}/>)
                }
                </div>
            </div>
        </div>
    )
}
