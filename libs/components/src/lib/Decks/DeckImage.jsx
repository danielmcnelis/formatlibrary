
import { Link } from 'react-router-dom'
import { ordinalize } from '@fl/utils'
import './DeckImage.css'

export const DeckImage = (props) => {
    const {deck, width, margin, padding, coverage} = props
    if (!deck) return <div/>
    const fullName = deck.player && deck.player.name ? deck.player.name : deck.builder || ''
    const displayName = fullName.length <= 17 ? fullName : fullName.slice(0, 17).split(' ').slice(0, -1).join(' ')
    const placement = ordinalize(deck.placement)
    const title = coverage ? `${deck.type} - ${displayName} - ${placement}` :
      `${deck.type ? deck.type + ' - ' : ''}${displayName}${deck.eventName ? ' - ' + deck.eventName : ''}`
  
    return (
      <div className="DeckImage-box">
          <Link to={`/decks/${deck.id}`}
              target="_blank" 
              rel="noopener noreferrer"
          >
              <div id="main" className="DeckImages">
              <h4 style={{width}}>{title}</h4>
              <div id="main" style={{width, margin, padding}} className="deck-flexbox">
                  <img src={`https://cdn.formatlibrary.com/images/decks/thumbnails/${deck.id}.png`} alt="deck"></img>
              </div>
              </div>
          </Link>
      </div>
    )
}