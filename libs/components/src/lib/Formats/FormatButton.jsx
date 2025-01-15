
// import { Link } from 'react-router-dom'
import { capitalize, urlize } from '@fl/utils'
import './FormatButton.css'

//FORMAT BUTTONS
export const FormatButton = (props) => {
    const { format } = props
    if (!format) return
    const month = capitalize(format.banlist?.slice(0, 3))
    const period = month !== 'May' ? '.' : ''
    const year = format.banlist?.split(" ")[1]
    const description = format.category === 'OCG' ? 
        `${format.banlist?.slice(-2)}${(new Date(format.banlist).getMonth() + 1).toString().padStart(2, '0')} Banlist` : 
        `${month}${period} ${year}`
  
    return (
      <div 
        onClick={() => {window.location.href=`${urlize(`/formats/${format.name}`)}`}}
        className="format-link" 
        style={{ backgroundImage: `url(https://cdn.formatlibrary.com/images/emojis/${format.icon}.png)`}}
      >
        <div className="format-button">
          <div>{format.name}</div>
          <div>{description}</div>
        </div>
      </div>
    )
}
