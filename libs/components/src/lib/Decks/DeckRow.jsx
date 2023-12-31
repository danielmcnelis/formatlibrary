
import { Link } from 'react-router-dom'
import { ordinalize } from '@fl/utils'
import './DeckRow.css'

export const DeckRow = (props) => {
    const {deck} = props
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    
    return (
          <tr className={`${evenOrOdd}-search-results-row`}>
            <td className="no-padding">
              <Link className="search-results-link" 
                  to={`/decks/${deck.id}`}
                  target="_blank" 
                  rel="noopener noreferrer"
              >
                <div className="format-cell-flexbox">
                  <img src={`https://cdn.formatlibrary.com/images/emojis/${deck.format.icon}.png`} alt={deck.format.icon}/>
                  <div>{deck.formatName}</div>
                </div>
              </Link>
            </td>
            <td className="no-padding">
              <Link className="search-results-link" 
                  to={`/decks/${deck.id}`}
                  target="_blank" 
                  rel="noopener noreferrer"
              >
                <div className="deckType-cell">
                  {deck.type || '-'}
                </div>
              </Link>
            </td>
            <td className="no-padding">
              <Link className="search-results-link" 
                  to={`/decks/${deck.id}`}
                  target="_blank" 
                  rel="noopener noreferrer"
              >
                <div className="player-cell">
                  <img 
                      className="player-cell-pfp"
                      src={`https://cdn.formatlibrary.com/images/pfps/${deck.player.discordId || deck.player.name}.png`}                    
                      alt={`${deck.builder}`}
                      onError={(e) => {
                              e.target.onerror = null
                              e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                          }
                      }
                  />
                  <div>{deck.builder || '-'}</div>
                </div>
              </Link>
            </td>
            <td className="no-padding">
              <Link className="search-results-link" 
                  to={`/decks/${deck.id}`}
                  target="_blank" 
                  rel="noopener noreferrer"
              >
                <div className="placement-cell">
                  {deck.placement ? ordinalize(deck.placement) : '-'}
                </div>
              </Link>
            </td>
            <td className="no-padding">
              <Link className="search-results-link"
                  to={`/decks/${deck.id}`}
                  target="_blank" 
                  rel="noopener noreferrer"
              >
                <div className="community-cell-flexbox">
                  {
                    deck.eventName ? <img src={`https://cdn.formatlibrary.com/images/logos/${deck.community?.replaceAll('+', '%2B')}.png`} alt={deck.community}/> : <img/>
                  }
                  <div>{deck.eventName || '-'}</div>
                </div>
              </Link>
            </td>
            <td className="no-padding">
              <Link className="search-results-link" 
                  to={`/decks/${deck.id}`}
                  target="_blank" 
                  rel="noopener noreferrer"
              >
                <div className="placement-cell">
                  {deck.rating} <img style={{width: '20px'}} src="https://cdn.formatlibrary.com/images/emojis/heart.png" alt="heart"/>
                </div>
              </Link>
            </td>
            <td className="no-padding">
              <Link className="search-results-link" 
                  to={`/decks/${deck.id}`}
                  target="_blank" 
                  rel="noopener noreferrer"
              >
                <div className="placement-cell">
                  {deck.downloads} <img style={{width: '20px'}} src="https://cdn.formatlibrary.com/images/emojis/disk.png" alt="disk"/>
                </div>
              </Link>
            </td>
            <td className="no-padding">
              <Link className="search-results-link" 
                  to={`/decks/${deck.id}`}
                  target="_blank" 
                  rel="noopener noreferrer"
              >
                <div className="date-cell">
                  {deck.publishDate ? deck.publishDate.substring(0, 10) : '-'}
                </div>
              </Link>
            </td>
          </tr>
    )
}
