
import { Link } from 'react-router-dom'
import './MobileEventRow.css'

export const MobileEventRow = (props) => {
    const {event} = props
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    const format = event.format || {}
    
    return (
        <tr className={`${evenOrOdd}-search-results-row`}>
          <td className="no-padding">
            <div 
                className="search-results-link" 
                onClick={() => {window.location.href=`/events/${event.abbreviation}`}}
            >
              <div className="format-cell-flexbox">
                <img src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`}/>
              </div>
            </div>
          </td>
          <td className="no-padding">
                <div 
                    className="search-results-link" 
                    onClick={() => {window.location.href=`/events/${event.abbreviation}`}}
                >
              <div className="community-cell-flexbox">
                  <img src={`https://cdn.formatlibrary.com/images/logos/${event.communityName?.replaceAll('+', '%2B')}.png`}/>
                  <div>{event.name}</div>
              </div>
              </div>
          </td>
          <td className="no-padding">
                <div 
                    className="search-results-link" 
                    onClick={() => {window.location.href=`/events/${event.abbreviation}`}}
                >
                    <div className="player-cell">
                        <img 
                            className="player-cell-pfp"
                            src={`https://cdn.formatlibrary.com/images/pfps/${event.winner?.discordId || event.winnerName}.png`}
                            onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                                }
                            }
                            alt={event.winnerName}
                        />
                    </div>
                </div>
          </td>
        </tr>
    )
}
