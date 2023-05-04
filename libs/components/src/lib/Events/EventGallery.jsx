
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { EventThumbnail } from './EventThumbnail'
import './EventGallery.css'

export const EventGallery = () => {
    const [events, setEvents] = useState([])
    const [winners, setWinners] = useState([])
    const [format, setFormat] = useState({})
    const { id } = useParams()
    console.log('events', events)
    console.log('winners', winners)
    console.log('format', format)
    
    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0))
    
    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            try {
                const {data} = await axios.get(`/api/events/gallery/${id}`)
                setEvents(data.events)
                setWinners(data.winners)
                setFormat(data.format)
            } catch (err) {
                console.log(err)
            }
        }

        fetchData()
    }, [id])

    if (!events?.length || !format?.id) return <div/>

    return (
        <div className="body">
            <div id="recent-events" className="recent-events">
                <div className="subcategory-title-flexbox">
                    <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                    <h1 className="leaderboard-title">{format.name} Recent Events</h1>
                    <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                </div>
                <div className="recent-events-flexbox">
                {
                    events.map((event, index) => <EventThumbnail key={event.id} event={event} winner={winners[index]} format={format}/>)
                }
                </div>
            </div>
        </div>
    )
}
