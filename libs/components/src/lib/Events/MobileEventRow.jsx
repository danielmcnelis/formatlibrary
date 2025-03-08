
import './MobileEventRow.css'

export const MobileEventRow = (props) => {
    const {event} = props
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    
    return (
        <tr className={`${evenOrOdd}-search-results-row`}>
          <td className="no-padding">
            <div 
                className="search-results-link" 
                onClick={() => {window.location.href=`/events/${event.abbreviation}`}}
            >
              <div className="format-cell-flexbox">
                <img src={`https://cdn.formatlibrary.com/images/emojis/${event.format?.icon}.png`}/>
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
                            src={`/api/players/${event?.winner?.id}/avatar`}
                            alt={event.winnerName}
                        />
                    </div>
                </div>
          </td>
        </tr>
    )
}
