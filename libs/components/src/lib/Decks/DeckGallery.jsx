
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { DeckThumbnail } from './DeckThumbnail'

export const DeckGallery = () => {
    const [decks, setDecks] = useState([])
    const [format, setFormat] = useState({})
    const { id } = useParams()
    
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

    if (!decks.length) return <div/>

    return (
        <div className="body">
            <div id="popular-decks" className="popular-decks">
                <div className="subcategory-title-flexbox">
                    <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`}/>
                    <h1 className="leaderboard-title">{format.name} Deck Gallery</h1>
                    <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`}/>
                </div>
                <div className="popular-decks-flexbox">
                {
                    decks.map((deck) => <DeckThumbnail format={id} deck={deck} key={deck.id}/>)
                }
                </div>
            </div>
        </div>
    )
}
