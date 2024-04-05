import { Link } from 'react-router-dom'
import { capitalize } from '@fl/utils'
import './StatusBar.css'

//STATUS BOX
export const StatusBox = (props) => {
    const { banlist, status } = props
    if (!banlist) return <p/>
    const backgroundColor = status === 'forbidden' ? 'red' :
      status === 'limited' ? 'orange' :
      status === 'semi-limited' ? 'yellow' :
      status === 'unlimited' || status === 'no longer on list' ? 'green' :
      '#e8e8e8'
  
      return (
          <Link to={`/banlists/${banlist?.toLowerCase()?.replaceAll(' ', '-')}`} key={banlist} className="status-cell" style={{backgroundColor}}>
             <p>{`${capitalize(banlist.slice(0, 3))} '${banlist.slice(-2)}`}</p>
          </Link>
      )
  } 
