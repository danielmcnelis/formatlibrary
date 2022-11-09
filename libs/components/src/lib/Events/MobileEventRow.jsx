
import { Link } from 'react-router-dom'

export const MobileEventRow = (props) => {
    const {event} = props
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    const format = event.format || {}
    
    return (
        <tr className={`${evenOrOdd}-search-results-row`}>
          <td className="no-padding">
            <Link className="black-text" to={`/events/${event.abbreviation}`}>
              <div className="format-cell-flexbox">
                <img src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`}/>
              </div>
            </Link>
          </td>
          <td className="no-padding">
              <Link className="black-text" to={`/events/${event.abbreviation}`}>
              <div className="community-cell-flexbox">
                  <img src={`https://cdn.formatlibrary.com/images/logos/${event.community}.png`}/>
                  <div>{event.name}</div>
              </div>
              </Link>
          </td>
          <td className="no-padding">
              <Link className="black-text" to={`/events/${event.abbreviation}`}>
              <div className="player-cell">
                  <img 
                      className="player-cell-pfp"
                      src={
                        event.player.discordPfp ? `https://cdn.discordapp.com/avatars/${event.player.discordId}/${event.player.discordPfp}.webp` :
                        `https://cdn.formatlibrary.com/images/pfps/${event.player.name}.png`
                      }
                      onError={(e) => {
                              e.target.onerror = null
                              e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                          }
                      }
                      alt={event.player.name}
                  />
              </div>
              </Link>
          </td>
        </tr>
    )
}
