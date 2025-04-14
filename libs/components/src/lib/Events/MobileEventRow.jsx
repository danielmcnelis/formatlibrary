
import './MobileEventRow.css'

export const MobileEventRow = (props) => {
    const {event} = props
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    
    return (
        <tr className={`${evenOrOdd}-search-results-row`} onClick={() => {window.open(`/events/${event.abbreviation}`, '_blank')}}>
          <td className="no-padding">
            <div className="format-cell-flexbox">
                <img src={`https://cdn.formatlibrary.com/images/emojis/${event.format?.icon}.png`} alt="format icon"/>
            </div>
          </td>
          <td className="no-padding">
                <div className="community-cell-flexbox">
                    <img src={`https://cdn.formatlibrary.com/images/logos/${event.communityName?.replaceAll('+', '%2B')}.png`} alt="community logo"/>
                </div>
          </td>
          <td className="no-padding">
                <div className="event-name-cell-flexbox">
                    <div>{event.name}</div>
                </div>
          </td>
          <td className="no-padding">
            <div className="player-cell">
                <img 
                    className="player-cell-pfp"
                    src={`/api/players/${event?.winner?.id}/avatar`}
                    alt={event.winnerName}
                />
            </div>
          </td>
        </tr>
    )
}
