
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { DeckThumbnail } from './DeckThumbnail'
import { fillWithMultiples } from '@fl/utils'
import { Helmet } from 'react-helmet'
import './DeckGallery.css'


export const DeckGallery = (props) => {
    const [deckTypes, setDeckTypes] = useState([])
    const [format, setFormat] = useState({})
    const { id } = this.props.match.params()
    const indices = fillWithMultiples(deckTypes, 3)
    // const videoEmbed = format?.videoEmbed

    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0))
    
    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            try {
                const {data} = await axios.get(`/api/decks/gallery/${id}`)
                setDeckTypes(data.deckTypes)
                setFormat(data.format)
            } catch (err) {
                console.log(err)
            }
        }

        fetchData()
    }, [])

    if (!deckTypes.length) return <div style={{height: '100vh'}}/>

    return (
        <>
            <Helmet>
                <title>{`${format?.name} Format Yu-Gi-Oh! Deck Gallery - Format Library`}</title>
                <meta name="og:title" content={`${format?.name} Format Yu-Gi-Oh! Deck Gallery - Format Library`}/>
                <meta name="description" content={`A complete list of Yu-Gi-Oh! decks played in ${format?.name} Format. Includes example decklists and breakdowns of card choices, popularity, and performance.`}/>
                <meta name="og:description" content={`A complete list of Yu-Gi-Oh! decks played in ${format?.name} Format. Includes example decklists and breakdowns of card choices, popularity, and performance.`}/>
            </Helmet>
            <div className="body">
                {
                    // videoEmbed ? videoEmbed :
                    <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
                }
                <div id="popular-decks" className="popular-decks">
                    <div className="subcategory-title-flexbox">
                        <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                        <h1 className="leaderboard-title">{format.name} Deck Gallery</h1>
                        <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                    </div>
                    {
                        indices.map((index) => (
                            <div className="popular-decks-flexbox">
                            {
                                deckTypes.slice(index, index + 3).map((deckType) => <DeckThumbnail formatName={id} deckType={deckType} key={deckType.id}/>)
                            }
                            </div>
                        ))
                    }
                </div>
            </div>
        </>
    )
}
