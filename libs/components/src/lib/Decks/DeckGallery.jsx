
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { DeckThumbnail } from './DeckThumbnail'
import { Helmet } from 'react-helmet'
import './DeckGallery.css'

export const DeckGallery = () => {
    const [decks, setDecks] = useState([])
    const [format, setFormat] = useState({})
    const { id } = useParams()
    const videoPlaylistId = format?.videoPlaylistId

    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0))
    
    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            try {
                const {data} = await axios.get(`/api/decks/gallery/${id}`)
                setDecks(data.decks)
                setFormat(data.format)
            } catch (err) {
                console.log(err)
            }
        }

        fetchData()
    }, [])

    if (!decks.length) return <div style={{height: '100vh'}}/>

    return (
        <>
            <Helmet>
                <title>{`${format?.name} Format Yu-Gi-Oh! Deck Gallery - Format Library`}</title>
                <meta name="og:title" content={`${format?.name} Format Yu-Gi-Oh! Deck Gallery - Format Library`}/>
                <meta name="description" content={`A complete list of Yu-Gi-Oh! decks played in ${format?.name} Format. Includes example decklists and breakdowns of card choices, popularity, and performance.`}/>
                <meta name="og:description" content={`A complete list of Yu-Gi-Oh! decks played in ${format?.name} Format. Includes example decklists and breakdowns of card choices, popularity, and performance.`}/>
            </Helmet>
            {
                videoPlaylistId ? <div className="adthrive-content-specific-playlist" data-playlist-id={videoPlaylistId}></div> :
                <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            }
            <div className="body">
                <div id="popular-decks" className="popular-decks">
                    <div className="subcategory-title-flexbox">
                        <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                        <h1 className="leaderboard-title">{format.name} Deck Gallery</h1>
                        <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                    </div>
                    <div className="popular-decks-flexbox">
                    {
                        decks.map((deck) => <DeckThumbnail formatName={id} deck={deck} key={deck.id}/>)
                    }
                    </div>
                </div>
            </div>
        </>
    )
}
