
// import { Link } from 'react-router-dom'
import { capitalize, urlize } from '@fl/utils'
import './FormatButton.css'

//FORMAT BUTTONS
export const FormatButton = (props) => {
    const { format } = props
    if (!format) return
    const month = capitalize(format.banlist.slice(0, 3))
    const period = month !== 'May' ? '.' : ''
    const year = `20${format.banlist.slice(-2)}`
  
    return (
      <div 
        // to={urlize(`/formats/${format.name}`)}
        onClick={() => {window.location.href=`${urlize(`/formats/${format.name}`)}`}}
        className="format-link" 
        style={{ backgroundImage: `url(https://cdn.formatlibrary.com/images/emojis/${format.icon}.png)`}}
      >
        <div className="format-button">
          <div>{format.name}</div>
          <div>{`${month}${period} ${year}`}</div>
        </div>
      </div>
    )
}
