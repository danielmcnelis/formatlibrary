
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { DeckThumbnail } from '../Decks/DeckThumbnail'
import './PopularDecks.css'

export const PopularDecks = (props) => {
    const [popularDecks, setPopularDecks] = useState([])
    const navigate = useNavigate()
    const goToDeckGallery = () => navigate(`/deck-gallery/${props.format.name}`)
  
    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            try {
                const {data} = await axios.get(`/api/decks/popular/${props.format.name}`)
                setPopularDecks(data)
            } catch (err) {
                console.log(err)
            }
        }

        fetchData()
    }, [props.format])

    if (!popularDecks.length) return <div/>

    return (
        <div>
            <div className="divider"/>
            <div id="popular-decks" className="popular-decks">
                <h2 onClick={() => goToDeckGallery()} id="popular-decks" className="subheading">Popular Decks:</h2>
                <div className="popular-decks-flexbox">
                {
                    popularDecks.map((deck) => <DeckThumbnail format={props.format?.name} deck={deck} key={deck.id}/>)
                }
                </div>
            </div>
        </div>
    )
}
