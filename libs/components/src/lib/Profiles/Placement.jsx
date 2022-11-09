
import { ordinalize } from "@fl/utils"
import { Link } from "react-router-dom"

const emojis = {
  First: 'https://cdn.formatlibrary.com/images/emojis/1st.png',
  Second: 'https://cdn.formatlibrary.com/images/emojis/2nd.png',
  Third: 'https://cdn.formatlibrary.com/images/emojis/3rd.png',
  Consolation: 'https://cdn.formatlibrary.com/images/emojis/consolation.png'
}
const { First, Second, Third, Consolation } = emojis

//PLACEMENT
export const Placement = (props) => {
  const { deck } = props
  if (!deck) return <div />

  const placementImage =
    deck.placement === 1 ? First : deck.placement === 2 ? Second : deck.placement === 3 ? Third : Consolation

  return (
    <Link className="link" to={`/events/${deck.eventName}`}>
        <div className="badge">
            <img src={placementImage} alt={ordinalize(deck.placemenent) + ' place'}/>
            <div className="badge-label">{deck.eventName}</div>
        </div>
    </Link>
  )
}
