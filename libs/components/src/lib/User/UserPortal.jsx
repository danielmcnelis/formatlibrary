
import { PortalButton } from './PortalButton'
import { Helmet } from 'react-helmet'
import './UserPortal.css'

export const UserPortal = (props) => {
    return (
        <>
            <Helmet>
                <title>{`Yu-Gi-Oh! Apps - Format Library`}</title>
                <meta name="og:title" content={`Yu-Gi-Oh! Apps - Format Library`}/>
                <meta name="description" content={`Featuring a variety of useful web apps for Yu-Gi-Oh! players. Deck Builder • Cube Draft • Pack Simulator • Text-YDK Converter`}/>
                <meta name="og:description" content={`Featuring a variety of useful web apps for Yu-Gi-Oh! players. Deck Builder • Cube Draft • Pack Simulator • Text-YDK Converter`}/>
            </Helmet>
            {/* Default Gaming Playlist */}
            <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            <div className="body">
                <h1>Applications</h1>
                <div className="user-menu">
                    {/* <PortalButton label="Rated Lobby" to="/rated-lobby" icon="/emojis/master.webp" /> */}
                    <PortalButton label="Deck Builder" to="/deck-builder" icon="/emojis/deckbox.webp" />
                    <PortalButton label="Pack Simulator" to="/pack-simulator" icon="/artworks/LOB.jpg" />
                    <PortalButton label="Draft App" to="/start-draft" icon="/emojis/cube.webp" />
                    <PortalButton label="Sealed App" to="/start-sealed" icon="/emojis/seal.webp" />
                </div>
            </div>
        </>
    )
}
