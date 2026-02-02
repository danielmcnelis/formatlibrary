
// import { Link } from 'react-router-dom'
import { abbreviateString, capitalize } from '@fl/utils'
import './EventThumbnail.css'

export const EventThumbnail = (props = {}) => {
    const {event, winner, format} = props
    if (!event || !winner) return <div/>

  return (
        <div 
            className='link' 
            onClick={() => {window.location.href=`/events/${event.abbreviation}`}}
        >
          <div className="eventThumbnail">  
              <h3>{capitalize(event.abbreviation, true)}</h3>
              <div className="eventThumbnail-flexbox">
                  <img 
                    className="eventThumbnail-format-icon" 
                    src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.webp`}
                    alt={format.name}
                  />
                  <img 
                    className="eventThumbnail-player-pfp" 
                    src={`/api/players/${event?.winner?.id}/avatar`}
                    alt={abbreviateString(winner.name)}
                  />
                  <img 
                    className="eventThumbnail-logo" 
                    src={`https://cdn.formatlibrary.com/images/logos/${event.communityName?.replaceAll('+', '%2B')}.webp`} 
                    alt={event.communityName}
                  />
              </div>
          </div>
        </div>
  )
}
