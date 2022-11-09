// import { Link } from 'react-router-dom'
// import { CardImage } from './CardImage'
// import { capitalize, ordinalize } from '@fl/utils'

export const EventImage = (props = {}) => {
  const { event, width, margin, padding } = props
  if (!event) return <div />
  // const main = event.main
  // const title = `${capitalize(event.eventType, true)} - ${event.player ? event.player.name : event.builder} - ${ordinalize(event.placement)} - ${event.event}`

  return (
    <div className="EventImage-box">
      {/* <Link to={`/events/${event.id}`}>
        <div id="main" className="EventImages">
          <h4>{title}</h4>
          <div id="main" style={{width, margin, padding}} className="event-flexbox">
            {
              main.map((card, index) => <CardImage width='36px' padding='0px' margin='0px' key={`${card.id}.${index}`}  card={card}/>)
            }
          </div>
        </div>
      </Link> */}
    </div>
  )
}
