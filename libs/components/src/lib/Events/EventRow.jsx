
import { Link } from 'react-router-dom'
import './EventRow.css'

export const EventRow = (props) => {
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
                <div>{format.name}</div>
              </div>
            </div>
          </td>
          <td className="no-padding">
            <div 
                className="search-results-link" 
                onClick={() => {window.location.href=`/events/${event.abbreviation}`}}
            >
              <div className="event-name-cell">
                {event.name}
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
                    src={`https://cdn.formatlibrary.com/images/pfps/${event.winner.discordId || event.winner.name}.png`}
                    onError={(e) => {
                            e.target.onerror = null
                            e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                        }
                    }
                    alt={event.winner.name}
                />
                <div>{event.winnerName || 'N/A'}</div>
              </div>
            </div>
          </td>
          <td className="no-padding">
            <div 
                className="search-results-link" 
                onClick={() => {window.location.href=`/events/${event.abbreviation}`}}
            >
              <div className="community-cell-flexbox">
                <img src={`https://cdn.formatlibrary.com/images/logos/${event.community?.replaceAll('+', '%2B')}.png`}/>
                <div>{event.community}</div>
              </div>
            </div>
          </td>
          <td className="no-padding">
            <div 
                className="search-results-link" 
                onClick={() => {window.location.href=`/events/${event.abbreviation}`}}
            >
              <div className="size-cell">
                {event.size} 👤
              </div>
            </div>
          </td>
          <td className="no-padding">
            <div 
                className="search-results-link" 
                onClick={() => {window.location.href=`/events/${event.abbreviation}`}}
            >
                <div className="date-cell">
                    {event.startDate ? event.startDate.substring(0, 10) : ''}
                </div>
            </div>
          </td>
        </tr>
    )
}
