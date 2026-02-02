
import { Link } from 'react-router-dom'
import { ordinalize } from '@fl/utils'
import './DeckRow.css'

export const DeckRow = (props) => {
    const {deck} = props
    console.log('deck::', deck)
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    
    return (
        <tr className={`${evenOrOdd}-search-results-row`} onClick={() => {window.open(`/decks/${deck.id}`, '_blank')}}>
            <td className="no-padding">
                <div className="format-cell-flexbox">
                  <img src={`https://cdn.formatlibrary.com/images/emojis/${deck.format?.icon}.webp`} alt={deck.format?.icon}/>
                  <div>{deck.formatName}</div>
                </div>
            </td>
            <td className="no-padding">
                <div className="deckType-cell">
                  {deck.deckTypeName || '-'}
                </div>
            </td>
            <td className="no-padding">
                <div className="player-cell">
                  <img 
                      className="player-cell-pfp"
                      src={`/api/players/${deck.builder?.id}/avatar`}                   
                      alt={`${deck.builderName}`}
                  />
                  <div>{deck.builderName || '-'}</div>
                </div>
            </td>
            <td className="no-padding">
                <div className="placement-cell">
                  {deck.placement ? ordinalize(deck.placement) : '-'}
                </div>
            </td>
            <td className="no-padding">
                <div className="community-cell-flexbox">
                  {
                    deck.eventAbbreviation ? <img src={`https://cdn.formatlibrary.com/images/logos/${deck.communityName?.replaceAll('+', '%2B')}.webp`} alt={deck.communityName}/> : <img/>
                  }
                  <div>{deck.eventAbbreviation || '-'}</div>
                </div>
            </td>
            <td className="no-padding">
                <div className="placement-cell">
                  {deck.rating} <img style={{width: '20px'}} src="https://cdn.formatlibrary.com/images/emojis/heart.webp" alt="heart"/>
                </div>
            </td>
            <td className="no-padding">
                <div className="placement-cell">
                  {deck.downloads} <img style={{width: '20px'}} src="https://cdn.formatlibrary.com/images/emojis/disk.webp" alt="disk"/>
                </div>
            </td>
            <td className="no-padding">
                <div className="date-cell">
                  {deck.publishDate ? deck.publishDate.substring(0, 10) : '-'}
                </div>
            </td>
          </tr>
    )
}
