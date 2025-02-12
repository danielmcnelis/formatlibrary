
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { DeckThumbnail } from '../Decks/DeckThumbnail'
import './PopularDecks.css'

export const PopularDecks = (props) => {
    const {formatName} = props
    const [popularDecks, setPopularDecks] = useState([])
    const navigate = useNavigate()
    const goToDeckGallery = () => navigate(`/deck-gallery/${formatName.toLowerCase()}`)
  
    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            try {
                const {data} = await axios.get(`/api/decks/popular/${formatName}`)
                setPopularDecks(data)
            } catch (err) {
                console.log(err)
            }
        }

        fetchData()
    }, [formatName])

    if (!popularDecks.length) return <div/>

    return (
        <div>
            <div className="divider"/>
            <div id="popular-decks" className="popular-decks">
                <h2 onClick={() => goToDeckGallery()} id="popular-decks" className="subheading">Deck Gallery:</h2>
                <div className="popular-decks-flexbox">
                {
                    popularDecks.map((deckType) => <DeckThumbnail formatName={formatName} deckType={deckType} key={deckType.id}/>)
                }
                </div>
                <h2 className="show-cursor deckThumbnail" onClick={() => goToDeckGallery()}>Click here for the complete Deck Gallery.</h2>
            </div>
        </div>
    )
}
