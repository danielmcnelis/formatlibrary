
import { Link } from 'react-router-dom'
import { abbreviateString, ordinalize } from '@fl/utils'
import './DeckImage.css'



export const DeckImage = (props) => {
    const {deck, width, margin, padding, coverage, formatIcon} = props
    if (!deck) return <div/>
    const placement = ordinalize(deck.placement)
    const deckTypeNamePlusDeckBuilderName = abbreviateString(`${deck.deckTypeName} - ${deck.builderName}`, 36)
    const title = coverage ? `${deckTypeNamePlusDeckBuilderName} - ${placement}` :
      `${deckTypeNamePlusDeckBuilderName}${deck.eventAbbreviation ? ' - ' + deck.eventAbbreviation : ''}`

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
                    ) : <h4 style={{width: '100%'}}>{title}</h4>
                }
                <div id="main" style={{maxWidth: '98vw', width, margin, padding}} className="deck-flexbox">
                    <img style={{maxWidth: '98vw'}} src={`https://cdn.formatlibrary.com/images/decks/thumbnails/${deck.id}.png`} alt="deck"></img>
                </div>
              </div>
          </Link>
      </div>
    )
}