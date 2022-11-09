
import { Link } from 'react-router-dom'
import { capitalize, underscorize } from '@fl/utils'

//FORMAT BUTTONS
export const FormatButton = (props) => {
    const { format } = props
    if (!format) return
    const month = capitalize(format.banlist.slice(0, 3))
    const period = month !== 'May' ? '.' : ''
    const year = `20${format.banlist.slice(-2)}`
  
    return (
      <Link 
        to={underscorize(`/formats/${format.name}`)} 
        className="format-link" 
        style={{ backgroundImage: `url(https://cdn.formatlibrary.com/images/emojis/${format.icon}.png)`}}
      >
        <div className="format-button">
          <div>{format.name}</div>
          <div>{`${month}${period} ${year}`}</div>
        </div>
      </Link>
    )
}
