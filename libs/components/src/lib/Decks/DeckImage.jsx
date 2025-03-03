
import { Link } from 'react-router-dom'
import { ordinalize } from '@fl/utils'
import './DeckImage.css'



export const DeckImage = (props) => {
    const {deck, width, margin, padding, coverage, formatIcon} = props
    if (!deck) return <div/>
    const fullName = deck.builderName || ''
    const displayName = fullName.length <= 17 ? fullName : fullName.slice(0, 17).split(' ')[0] || ''
    const placement = ordinalize(deck.placement)
    const title = coverage ? `${deck.deckTypeName} - ${displayName} - ${placement}` :
      `${deck.deckTypeName ? deck.deckTypeName + ' - ' : ''}${displayName}${deck.eventAbbreviation ? ' - ' + deck.eventAbbreviation : ''}`
  
    

    return (
      <div className="DeckImage-box">
          <Link to={`/decks/${deck.id}`}
              target="_blank" 
              rel="noopener noreferrer"
          >
              <div id="main" className="DeckImages">
                {   
                    formatIcon ? (
                        <div className="profile-deck-flexbox">
                            <img 
                                style={{ width:'32px'}} 
                                src={`https://cdn.formatlibrary.com/images/emojis/deckbox.png`}
                                alt={formatIcon}
                            />
                            <h4 style={{width: width-64}}>{title}</h4>
                            <img 
                                style={{ width:'32px'}} 
                                src={`https://cdn.formatlibrary.com/images/emojis/${formatIcon}.png`}
                                alt={formatIcon}
                            />
                        </div>
                    ) : <h4 style={{width}}>{title}</h4>
                }
                <div id="main" style={{maxWidth: '98vw', width, margin, padding}} className="deck-flexbox">
                    <img src={`https://cdn.formatlibrary.com/images/decks/thumbnails/${deck.id}.png`} alt="deck"></img>
                </div>
              </div>
          </Link>
      </div>
    )
}