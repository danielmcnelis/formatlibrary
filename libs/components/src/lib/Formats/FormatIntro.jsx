
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { BanList } from './BanList'
import { MiniBoard } from './MiniBoard'
import { NotFound } from '../General/NotFound'
import { PopularDecks } from './PopularDecks'
import { RecentEvents } from '../Events/RecentEvents'
import { useParams } from 'react-router-dom'
import { urlize } from '@fl/utils'
import { Helmet } from 'react-helmet'
import './FormatIntro.css'

export const FormatIntro = () => {
    const [format, setFormat] = useState({})
    const [deckCount, setDeckCount] = useState(0)
    const [eventCount, setEventCount] = useState(0)
    const [statsCount, setStatsCount] = useState(0)
    const { id } = useParams()
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0))
  
    // USE EFFECT SET CARD
    useEffect(() => {
      const fetchData = async () => {
        try {
          const {data} = await axios.get(`/api/formats/${id}`)
          setFormat(data.format)
          setDeckCount(data.deckCount)
          setEventCount(data.eventCount)
          setStatsCount(data.statsCount)
        } catch (err) {
          console.log(err)
          setFormat(null)
        }
      }
  
      fetchData()
    }, [id])
  
    if (!format) return <NotFound/>
    if (!format.id) return <div />
  
    return (
        <>
            <Helmet>
                <title>{`Yu-Gi-Oh! ${format?.name} Format - Format Library`}</title>
                <meta name="og:title" content={`Yu-Gi-Oh! ${format?.name} Format - Format Library`}/>
                <meta name="description" content={format.blurb || (format.event + `\nDecks • Tournaments • Cardpool • Rulings • Banlist`)}/>
                <meta name="og:description" content={format.blurb || (format.event + `\nDecks • Tournaments • Cardpool • Rulings • Banlist`)}/>
                <meta name="image" content={`https://cdn.formatlibrary.com/images/artworks/${format.logo}.png`}/>
                <meta name="og:image" content={`https://cdn.formatlibrary.com/images/artworks/${format.logo}.png`}/>
            </Helmet>
            <div className="body">
            <div className="format-icon-flexbox">
            <div className="format-text">
                <h1>{format.name} Format</h1>
                <h2>{format.event}</h2>
                {
                format.description ? (
                    <div className="desktop-only">
                    <p className="format-desc">{format.description}</p>
                    </div>
                ) : <br/>
                }
                {
                deckCount ? (
                    <>
                        <li>
                            <a href={`/deck-gallery/${urlize(format.name)}`}>Deck Gallery</a>
                        </li>
                        <li>
                            <a href={`/formats/${urlize(format.name)}#popular-decks`}>Popular Decks</a>
                        </li>
                    </>
                ) : ''
                }
                {
                eventCount ? (
                    <>
                        <li>
                            <a href={`/event-gallery/${urlize(format.name)}`}>Event Gallery</a>
                        </li>
                        <li>
                            <a href={`/formats/${urlize(format.name)}#recent-events`}>Recent Events</a>
                        </li>
                    </>
                ) : ''
                }
                {
                statsCount ? (
                    <li>
                    <a href={`/leaderboards/${urlize(format.name)}`}>Leaderboard</a>
                    </li>
                ) : ''
                }
                <li>
                <a href={`/cards?format=${urlize(format.name)}`}>Card Pool</a>
                </li>
                <li>
                <a href={`/formats/${urlize(format.name)}#banlist`}>Ban List</a>
                </li>
            </div>
            <img id="format-icon-large" src={`https://cdn.formatlibrary.com/images/artworks/${format.icon}.jpg`} alt={format.icon}/>
            </div>
            {
            format.description ? (
                <div className="mobile-only">
                <p className="format-desc">{format.description}</p>
                </div>
            ) : ''
            }
            <PopularDecks id="popular-decks" format={format}/>
            <RecentEvents id="recent-events" format={format}/>
            <MiniBoard limit={10} format={format}/>
            <div className="divider"/>
            <BanList id="banlist" format={format}/>
        </div>
        </>

    )
}
