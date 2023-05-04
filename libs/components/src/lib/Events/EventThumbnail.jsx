
import { Link } from 'react-router-dom'
import { capitalize } from '@fl/utils'

export const EventThumbnail = (props = {}) => {
    const {event, winner, format} = props
    if (!event || !winner) return <div/>

  return (
        <Link className='link' to={`/events/${event.abbreviation}`}>
          <div className="eventThumbnail">  
              <h3>{capitalize(event.abbreviation, true)}</h3>
              <div className="eventThumbnail-flexbox">
                  <img 
                    className="eventThumbnail-image" 
                    src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`}
                    alt={event.format.name}
                  />
                  <img 
                    className="eventThumbnail-player-pfp" 
                    src={`https://cdn.formatlibrary.com/images/pfps/${winner.discordId || winner.name}.png`}
                    onError={(e) => {
                            e.target.onerror = null
                            e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                        }
                    }
                    alt={winner.name}
                  />
                  <img 
                    className="eventThumbnail-image" 
                    src={`https://cdn.formatlibrary.com/images/logos/${event.community}.png`} 
                    alt={event.community}
                  />
              </div>
          </div>
        </Link>
  )
}
