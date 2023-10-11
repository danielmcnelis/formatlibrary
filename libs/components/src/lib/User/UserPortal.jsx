
import { Link } from 'react-router-dom'
import './UserPortal.css'

export const UserPortal = () => {
    return (
        <div className="body">
            <h1>Applications</h1>
            <div className="user-menu">
                <Link to="/builder/">
                    <div className="user-button">Deck Builder</div>
                </Link>
                <Link to="/start-cube/">
                    <div className="user-button">Start Cube</div>
                </Link>
                <Link to="/text-to-ydk/">
                    <div className="user-button">Text to YDK</div>
                </Link>
            </div>
        </div>
    )
}
