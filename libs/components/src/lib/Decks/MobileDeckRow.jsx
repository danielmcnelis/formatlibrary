
import { Link } from 'react-router-dom'
import { capitalize, ordinalize } from '@fl/utils'
import './MobileDeckRow.css'

export const MobileDeckRow = (props) => {
    const {deck} = props
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    
    return (
      <tr className={`${evenOrOdd}-search-results-row`}>
        <td className="no-padding">
          <Link className="black-text" 
              to={`/decks/${deck.id}`}
              target="_blank" 
              rel="noopener noreferrer"
          >
            <div className="format-cell-flexbox">
                <img 
                    src={`https://cdn.formatlibrary.com/images/emojis/${deck.format.icon}.png`}
                    alt="format-emoji"
                />
            </div>
          </Link>
        </td>
        <td className="no-padding">
          <Link className="black-text" 
              to={`/decks/${deck.id}`}    
              target="_blank" 
              rel="noopener noreferrer"
          >
            <div className="deckType-cell">
              {capitalize(deck.type, true) || '?'}
            </div>
          </Link>
        </td>
        <td className="no-padding">
          <Link className="black-text" 
              to={`/decks/${deck.id}`}
              target="_blank" 
              rel="noopener noreferrer"
          >
            <div className="player-cell">
              <img 
                  className="player-cell-pfp"
                  src={`https://cdn.formatlibrary.com/images/pfps/${deck.player.discordId || deck.player.name}.png`}
                  onError={(e) => {
                          e.target.onerror = null
                          e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                      }
                  }
                  alt={deck.builder}
              />
            </div>
          </Link>
        </td>
        <td className="no-padding">
          <Link className="black-text" 
              to={`/decks/${deck.id}`}
              target="_blank" 
              rel="noopener noreferrer"
          >
              <div className="placement-cell">
              {ordinalize(deck.placement) || 'N/A'}
              </div>
          </Link>
        </td>
      </tr>
      )
}
