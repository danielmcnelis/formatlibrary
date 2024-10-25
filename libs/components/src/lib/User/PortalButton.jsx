
import { Link } from 'react-router-dom'
import './PortalButton.css'

//FORMAT BUTTONS
export const PortalButton = (props) => {
    return (
      <div 
        className="portal-link" 
        onClick={() => {window.location.href=`${props.to}`}}
        style={{ backgroundImage: `url(https://cdn.formatlibrary.com/images${props.icon})`}}
      >
        <div className="portal-button">
          <div>{props.label}</div>
        </div>
      </div>
    )
}
