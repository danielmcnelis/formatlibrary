
import { Link } from 'react-router-dom'
import { PortalButton } from './PortalButton'
import { Helmet } from 'react-helmet'
import './UserPortal.css'

export const UserPortal = () => {
    return (
        <>
            <Helmet>
                <title>{`Yu-Gi-Oh! Apps - Yu-Gi-Oh! Format Library`}</title>
                <meta name="description" content={`Featuring the best browser-based apps for Yu-Gi-Oh! players of all kinds.\nDeck Builder • Cube Draft • Pack Simulator • Text-YDK Converter`}/>
            </Helmet>
            <div className="body">
                <h1>Applications</h1>
                <div className="user-menu">
                    <PortalButton label="Deck Builder" to="/deck-builder" icon="/emojis/deckbox.png" />
                    <PortalButton label="Pack Simulator" to="/pack-simulator" icon="/artworks/LOB.jpg" />
                    <PortalButton label="Start Cube" to="/start-cube" icon="/emojis/cube.png" />
                    <PortalButton label="Text to YDK" to="/text-to-ydk" icon="/emojis/ydk.png" />
                </div>
            </div>
        </>
    )
}
