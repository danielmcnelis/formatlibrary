
import { Link } from 'react-router-dom'
import { capitalize, urlize } from '@fl/utils'
import './DeckThumbnail.css'

export const DeckThumbnail = (props) => {
    const {deckType, formatName} = props
    if (!deckType) return <div/>
    const deckTypeLink = formatName ? urlize(`/decktypes/${deckType.name}?format=${formatName}`) : 
        urlize(`/decktypes/${deckType.name}`)
  
    return (
        <div 
            className='link' 
            onClick={() => {window.location.href=`${deckTypeLink}`}} 
        >
            <div className="deckThumbnail">
                <h3>{capitalize(deckType.name, true)}</h3>
                <div className="deckThumbnail-flexbox">
                    <img 
                        className="deckThumbnail-image" 
                        src={`https://cdn.formatlibrary.com/images/artworks/${deckType.leftCardArtworkId}.jpg`} 
                        onError={(e) => {
                        e.target.onerror = null
                        e.target.src="https://cdn.formatlibrary.com/images/artworks/question.jpg"
                        }}
                        alt={deckType.leftCard}
                    />
                    <img 
                        className="deckThumbnail-image" 
                        src={`https://cdn.formatlibrary.com/images/artworks/${deckType.centerCardArtworkId}.jpg`}
                        onError={(e) => {
                        e.target.onerror = null
                        e.target.src="https://cdn.formatlibrary.com/images/artworks/question.jpg"
                        }}
                        alt={deckType.centerCard}
                    />
                    <img 
                        className="deckThumbnail-image" 
                        src={`https://cdn.formatlibrary.com/images/artworks/${deckType.rightCardArtworkId}.jpg`}
                        onError={(e) => {
                        e.target.onerror = null
                        e.target.src="https://cdn.formatlibrary.com/images/artworks/question.jpg"
                        }}
                        alt={deckType.rightCard}
                    />
                </div>
            </div>
        </div>
    )
}
