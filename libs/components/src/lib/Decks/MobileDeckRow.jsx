
import { capitalize, ordinalize } from '@fl/utils'
import './MobileDeckRow.css'

export const MobileDeckRow = (props) => {
    const {deck} = props
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    
    return (
      <tr className={`${evenOrOdd}-search-results-row`} onClick={() => {window.open(`/decks/${deck.id}`, '_blank')}}>
        <td className="no-padding">
            <div className="format-cell-flexbox">
                <img 
                    src={`https://cdn.formatlibrary.com/images/emojis/${deck.format?.icon}.png`}
                    alt="format icon"
                />
            </div>
        </td>
        <td className="no-padding">
            <div className="deckType-cell">
              {capitalize(deck.deckTypeName, true) || '?'}
            </div>
        </td>
        <td className="no-padding">
            <div className="player-cell">
              <img 
                  className="player-cell-pfp"
                  src={`/api/players/${deck.builder?.id}/avatar`}  
                  alt={deck.builderName}
              />
            </div>
        </td>
        <td className="no-padding">
            <div className="placement-cell">
            {ordinalize(deck.placement) || 'N/A'}
            </div>
        </td>
      </tr>
      )
}
