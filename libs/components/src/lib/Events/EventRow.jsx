import './EventRow.css'

export const EventRow = (props) => {
    const {event} = props
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    
    return (
        <tr className={`${evenOrOdd}-search-results-row`} onClick={() => {window.open(`/events/${event.abbreviation}`, '_blank')}}>
          <td className="no-padding">
            <div 
                className="search-results-link" 
                
            >
              <div className="format-cell-flexbox">
                <img src={`https://cdn.formatlibrary.com/images/emojis/${event.format?.icon}.webp`} alt="format icon"/>
                <div>{event.formatName}</div>
              </div>
            </div>
          </td>
          <td className="no-padding">
                <div className="event-name-cell">
                    {event.name}
                </div>
          </td>
          <td className="no-padding">
                <div className="player-cell">
                    <img 
                        className="player-cell-pfp"
                        src={`/api/players/${event?.winner?.id}/avatar`}
                        alt={event.winnerName}
                    />
                    <div>{event.winnerName || 'N/A'}</div>
                </div>
          </td>
          <td className="no-padding">
              <div className="community-cell-flexbox">
                <img src={`https://cdn.formatlibrary.com/images/logos/${event.communityName?.replaceAll('+', '%2B')}.webp`} alt="community logo"/>
                <div>{event.communityName}</div>
              </div>
          </td>
          <td className="no-padding">
              <div className="size-cell">
                {event.size} 👤
              </div>
          </td>
          <td className="no-padding">
                <div className="date-cell">
                    {event.startedAt ? event.startedAt.substring(0, 10) : ''}
                </div>
          </td>
        </tr>
    )
}
