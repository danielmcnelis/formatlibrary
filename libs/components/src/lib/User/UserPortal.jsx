
import { Link } from 'react-router-dom'
import { PortalButton } from './PortalButton'
import './UserPortal.css'

export const UserPortal = () => {
    return (
        <div className="body">
            <h1>Applications</h1>
            <div className="user-menu">
                <PortalButton label="Deck Builder" to="/deck-builder" icon="/emojis/deckbox.png" />
                <PortalButton label="Pack Simulator" to="/pack-simulator" icon="/artworks/LOB.jpg" />
                <PortalButton label="Start Cube" to="/start-cube" icon="/emojis/cube.png" />
                <PortalButton label="Text to YDK" to="/text-to-ydk" icon="/emojis/ydk.png" />
            </div>
        </div>
    )
}
