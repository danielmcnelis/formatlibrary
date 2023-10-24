
import { Link } from 'react-router-dom'
import { capitalize, urlize } from '@fl/utils'
import './DeckThumbnail.css'

export const DeckThumbnail = (props) => {
    const {deck} = props
    if (!deck) return <div/>
  
    return (
      <Link className='link' to={urlize(`/decktypes/${deck.name}${props.format ? `?format=${props.format}` : ''}`)}>
        <div className="deckThumbnail">
          <h3>{capitalize(deck.name, true)}</h3>
          <div className="deckThumbnail-flexbox">
              <img 
                className="deckThumbnail-image" 
                src={`https://cdn.formatlibrary.com/images/artworks/${deck.leftCardYpdId}.jpg`} 
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src="https://cdn.formatlibrary.com/images/artworks/question.jpg"
                }}
                alt={deck.leftCard}
              />
              <img 
                className="deckThumbnail-image" 
                src={`https://cdn.formatlibrary.com/images/artworks/${deck.centerCardYpdId}.jpg`}
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src="https://cdn.formatlibrary.com/images/artworks/question.jpg"
                }}
                alt={deck.centerCard}
              />
              <img 
                className="deckThumbnail-image" 
                src={`https://cdn.formatlibrary.com/images/artworks/${deck.rightCardYpdId}.jpg`}
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src="https://cdn.formatlibrary.com/images/artworks/question.jpg"
                }}
                alt={deck.rightCard}
              />
          </div>
        </div>
      </Link>
    )
}
