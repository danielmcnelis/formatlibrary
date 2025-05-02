
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { EventThumbnail } from './EventThumbnail'
import { Helmet } from 'react-helmet'
import { fillWithMultiples } from '@fl/utils'
import './EventGallery.css'

export const EventGallery = (props) => {
    const [events, setEvents] = useState([])
    const [winners, setWinners] = useState([])
    const [format, setFormat] = useState({})
    const { id } = this.props.match.params()
    const indices = fillWithMultiples(events, 3)
    // const videoPlaylistId = format?.videoPlaylistId

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
    }, [])

    if (!events?.length || !format?.id) return <div style={{height: '100vh'}}/>

    return (
        <>
            <Helmet>
                <title>{`Yu-Gi-Oh! ${format?.name} Format Tournaments - Format Library`}</title>
                <meta name="og:title:" content={`Yu-Gi-Oh! ${format?.name} Format Tournaments - Format Library`}/>
                <meta name="description" content={`A complete list of recent and historic ${format?.name} Format Yu-Gi-Oh! tournaments, both online and in-person. Includes detailed tournament coverage.`}/>
                <meta name="og:description" content={`A complete list of recent and historic ${format?.name} Format Yu-Gi-Oh! tournaments, both online and in-person. Includes detailed tournament coverage.`}/>
            </Helmet>
            {
                // videoPlaylistId ? <div className="adthrive-content-specific-playlist" data-playlist-id={videoPlaylistId}></div> :
                <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            }
            <div className="body">
                <div id="recent-events" className="recent-events">
                    <div className="subcategory-title-flexbox">
                        <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                        <h1 className="leaderboard-title">{format.name} Event Gallery</h1>
                        <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                    </div>
                    {
                        indices.map((index) => (
                            <div className="recent-events-flexbox">
                            {
                                events.slice(index, index + 3).map((event, index2) => <EventThumbnail key={event.id} event={event} winner={winners[index  + index2]} format={format}/>)
                            }
                            </div>
                        ))
                    }
                </div>
            </div>
        </>
    )
}
