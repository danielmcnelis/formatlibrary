
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
import parse from 'html-react-parser';
import './FormatIntro.css'

export const FormatIntro = (props) => {
    const isAdmin = props.roles?.admin
    const isContentManager = props.roles?.contentManager
    const [format, setFormat] = useState({})
    const [deckCount, setDeckCount] = useState(0)
    const [eventCount, setEventCount] = useState(0)
    const [statsCount, setStatsCount] = useState(0)
    const [inEditMode, setInEditMode] = useState(false)
    const [description, setDescription] = useState('')
    const { id } = this.props.match.params()
    // const videoId = format?.videoId
    const videoEmbed = format?.videoEmbed
    
    // USE EFFECT
    useEffect(() => window.scrollTo(0, document.getElementById('body')?.offsetTop), [inEditMode])

    // SWITCH SPOTLIGHT
    const switchSpotlight = async () => {
        try {
            if (format.isSpotlight) {
                const {data} = await axios.post(`/api/formats/update?id=${format.id}`, { ...format, isSpotlight: false })
                setFormat(data) 
              } else {
                const {data} = await axios.post(`/api/formats/update?id=${format.id}`, { ...format, isSpotlight: true })
                setFormat(data) 
              }
        } catch (err) {
            console.log(err)
        }
    }
    
    // UPDATE FORMAT DESCRIPTION
    const updateFormatDescription = async () => {
        try {
            await axios.post(`/api/formats/update?id=${format.id}`, { description })
            setFormat({...format, description})
            setInEditMode(false)
        } catch (err) {
            console.log(err)
        }
    }
    

    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0))
  
    // USE EFFECT
    useEffect(() => window.scrollTo(0, document.getElementById('body')?.offsetTop), [inEditMode])

    // USE EFFECT SET CARD
    useEffect(() => {
      const fetchData = async () => {
        try {
          const {data} = await axios.get(`/api/formats/${id}`)
          setFormat(data.format)
          setDescription(data.format.description || '')
          setDeckCount(data.deckCount)
          setEventCount(data.eventCount)
          setStatsCount(data.statsCount)
        } catch (err) {
          console.log(err)
          setFormat(null)
        }
      }
  
      fetchData()
    }, [])

    if (!format) return <NotFound/>
    if (!format.id) return <div style={{height: '100vh'}}/>
  
    return (
        <>
            <Helmet>
                <title>{`Yu-Gi-Oh! ${format?.name} Format - Format Library`}</title>
                <meta name="og:title" content={`Yu-Gi-Oh! ${format?.name} Format - Format Library`}/>
                <meta name="description" content={format.blurb || (format.eventName + `\nDecks • Tournaments • Cardpool • Rulings • Banlist`)}/>
                <meta name="og:description" content={format.blurb || (format.eventName + `\nDecks • Tournaments • Cardpool • Rulings • Banlist`)}/>
                <meta name="image" content={`https://cdn.formatlibrary.com/images/artworks/${format.logo}.png`}/>
                <meta name="og:image" content={`https://cdn.formatlibrary.com/images/artworks/${format.logo}.png`}/>
            </Helmet>

            <div className="body">
            <div className="format-icon-flexbox">
            <div className="format-text">
                <h1>{format.name} Format</h1>
                {
                    isContentManager && format.isPopular === false ? (
                        <div className='horizontal-space-between-flexbox'>
                            <h2>{format.eventName}</h2>
                            <div className='horizontal-space-between-flexbox' >
                                <h2>Spotlight</h2>
                                <div 
                                    id={`spotlight-toggle-${format?.isSpotlight}`} 
                                    onClick={() => switchSpotlight()}
                                >
                                    <div id={`spotlight-toggle-inner-circle-${format?.isSpotlight}`}></div>
                                </div>
                            </div>
                        </div>
                    ) : <h2>{format.eventName}</h2>
                }
                {
                !inEditMode ? (
                    format.description ? (
                        <div className="desktop-only">
                            <p className="format-desc">{format.description}</p>
                        </div>
                    ) : <br/>
                ) : (
                    <div className="format-desc pwk-border-bottom">
                        <textarea
                            id="name"
                            className="large-input"
                            // onInput="this.size = this.value.length"
                            style={{height: '70vh'}}
                            defaultValue={format.description || ''}
                            type="text"
                            onChange={(e) => {
                                setDescription(e.target.value)
                            }}
                        />
                    </div>
                    )   
                }
                {
                deckCount ? (
                    <li>
                        <a href={`/deck-gallery/${urlize(format.name)}`}>Deck Gallery</a>
                    </li>
                ) : ''
                }
                {
                eventCount ? (
                    <li>
                        <a href={`/event-gallery/${urlize(format.name)}`}>Event Gallery</a>
                    </li>
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
            <div className="vertical-centered-flexbox" style={{margin: '24px 0px'}}>
            {
                format.previousFormatId ? <a className="format-neighbor-link align-left" href={`/formats/${urlize(format.previousFormatName)}`} >← {format.previousFormatName}</a> : ''
            }
            <img id="format-icon-large" src={`https://cdn.formatlibrary.com/images/artworks/${format.icon}.jpg`} alt={format.icon}/>
            {
                format.nextFormatId ? <a className="format-neighbor-link align-right" href ={`/formats/${urlize(format.nextFormatName)}`}>{format.nextFormatName} →</a> : ''
            }
            {
                !isAdmin ? '' : !inEditMode ? (
                    <div className="downloadButton" style={{width: '150px', margin: '20px 0px 0px'}} onClick={()=> setInEditMode(true)}>Edit Mode</div> 
                ) : (
                    <div className="downloadButton" style={{width: '150px', margin: '20px 0px 0px'}} onClick={()=> updateFormatDescription()}>Save Changes</div>
                )
            }
            </div>
        </div>
        {
            format.description ? (
                <div className="mobile-only">
                <p className="format-desc">{format.description}</p>
                </div>
            ) : ''
        }
        {
            videoEmbed ? parse(videoEmbed) : null
        }
        <PopularDecks id="popular-decks" formatName={format.name}/>
        <RecentEvents id="recent-events" formatName={format.name}/>
        <MiniBoard limit={10} format={format}/>
        <BanList id="banlist" format={format}/>
    </div>
    </>

    )
}
