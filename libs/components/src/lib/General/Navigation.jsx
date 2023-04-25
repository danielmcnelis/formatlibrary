
import { Link } from 'react-router-dom'
import './Navigation.css'
import { getCookie } from '@fl/utils'

const toggle = () => {
  const menu = document.getElementById('hamburger-menu')
  menu.classList.toggle('open')
  menu.classList.toggle('closed')
}

const playerId = getCookie('playerId')
const discordId = getCookie('discordId')
const discordPfp = getCookie('discordPfp')
const googlePfp = getCookie('googlePfp')

//NavBar
export const Navigation = () => {
    return (
        <div className="navigation-bar">
            <Link to="/">
            <div id="logo">
                <img src={'https://cdn.formatlibrary.com/images/logos/AJTBLS.png'} alt="logo"/>
                <h1>Format Library</h1>
            </div>
            </Link>
            <div id="navigation-menu">
                <Link to="/" state={{ page: 1 }}>
                    <h2 className="navigation-item">HOME</h2>
                </Link>
                <Link to="/cards/">
                    <h2 className="navigation-item">CARDS</h2>
                </Link>
                <Link to="/decks/">
                    <h2 className="navigation-item">DECKS</h2>
                </Link>
                <Link to="/events/">
                    <h2 className="navigation-item">EVENTS</h2>
                </Link>
                <Link to="/formats/">
                    <h2 className="navigation-item">FORMATS</h2>
                </Link>
                <Link to="/builder/">
                    <h2 className="navigation-item">BUILDER</h2>
                </Link>
                {
                    playerId ? (
                        <a href="/settings/">
                            <img
                                className="player-cell-pfp"
                                style={{width: '3.3vw'}}
                                src={
                                    googlePfp ? `https://lh3.googleusercontent.com/a/${googlePfp}` :
                                    discordPfp && discordId ? `https://cdn.discordapp.com/avatars/${discordId}/${discordPfp}.webp` :
                                    `https://cdn.formatlibrary.com/images/pfps/${discordId}.png`}
                                onError={(e) => {
                                        e.target.onerror = null
                                        e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                                    }
                                }
                                alt="profile"
                            />
                        </a>
                    ) : (
                        <a href="/auth/login/">
                            <h1 id="login" className="navigation-item">LOGIN</h1>
                        </a>
                    )
                }
            </div>
            <div id="hamburger-menu" className="closed" onClick={() => toggle()}>
                <div id="hamburger-button" className="closed-b" style={{fontSize: '44px'}}>
                    ≡
                </div>
                <div id="hamburger-button" className="open-b" style={{fontSize: '44px'}}>
                    ⌄
                </div>
                <Link to="/" state={{ page: 1 }}>
                    <h3 className="hamburger-item">Home</h3>
                </Link>
                <Link to="/cards/">
                    <h3 className="hamburger-item">Cards</h3>
                </Link>
                <Link to="/decks/">
                    <h3 className="hamburger-item">Decks</h3>
                </Link>
                <Link to="/events/">
                    <h3 className="hamburger-item">Events</h3>
                </Link>
                <Link to="/formats/">
                    <h3 className="hamburger-item">Formats</h3>
                </Link>
            </div>
        </div>
)
}
