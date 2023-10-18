
import { Link } from 'react-router-dom'
import './PortalButton.css'

//FORMAT BUTTONS
export const PortalButton = (props) => {
    return (
      <Link 
        to={`/${props.to}`} 
        className="portal-link" 
        style={{ backgroundImage: `url(https://cdn.formatlibrary.com/images${props.icon})`}}
      >
        <div className="portal-button">
          <div>{props.label}</div>
        </div>
      </Link>
    )
}
