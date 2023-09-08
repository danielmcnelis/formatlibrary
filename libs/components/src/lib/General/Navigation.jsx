
import { Link } from 'react-router-dom'
import './Navigation.css'
import { getCookie } from '@fl/utils'

const playerId = getCookie('playerId')
const discordId = getCookie('discordId')
const discordPfp = getCookie('discordPfp')
const googlePfp = getCookie('googlePfp')

// TOGGLE
const toggle = () => {
  const menu = document.getElementById('hamburger-menu')
  menu.classList.toggle('open')
  menu.classList.toggle('closed')
}

// NAVIGATION
export const Navigation = () => {
    return (
        <div className="nav-bar">
            <Link to="/">
                <div id="logo">
                    <img src={'https://cdn.formatlibrary.com/images/logos/Format Library.png'} alt="logo"/>
                    <h1>Format Library</h1>
                </div>
            </Link>
            <div id="nav-menu">
                <Link to="/" state={{ page: 1 }}>
                    <h2 className="nav-header">HOME</h2>
                </Link>
                <Link to="/cards/">
                    <h2 className="nav-header">CARDS</h2>
                </Link>
                <Link to="/decks/">
                    <h2 className="nav-header">DECKS</h2>
                </Link>
                <Link to="/events/">
                    <h2 className="nav-header">EVENTS</h2>
                </Link>
                <Link to="/replays/">
                    <h2 className="nav-header">REPLAYS</h2>
                </Link>
                <Link to="/formats/">
                    <h2 className="nav-header">FORMATS</h2>
                </Link>
                <Link to="/builder/">
                    <h2 className="nav-header">BUILDER</h2>
                </Link>
                {
                    playerId ? (
                        <a href="/settings/">
                            <img
                                className="avatar"
                                src={
                                    googlePfp ? `https://lh3.googleusercontent.com/a/${googlePfp}` :
                                    discordPfp && discordId ? `https://cdn.discordapp.com/avatars/${discordId}/${discordPfp}.webp` :
                                    `https://cdn.formatlibrary.com/images/pfps/${discordId}.png`}
                                onError={(e) => {
                                        e.target.onerror = null
                                        e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                                    }
                                }
                                alt="avatar"
                            />
                        </a>
                    ) : (
                        <a href="/auth/login/">
                            <h1 id="login" className="nav-header">LOGIN</h1>
                        </a>
                    )
                }
            </div>
            <div id="hamburger-menu" className="closed" onClick={() => toggle()}>
                <div id="hamburger-button" className="closed-menu" style={{fontSize: '44px'}}>
                    ≡
                </div>
                <div id="hamburger-button" className="open-menu" style={{fontSize: '44px'}}>
                    ⌄
                </div>
                <Link to="/" state={{ page: 1 }}>
                    <h3 className="hamburger-header">Home</h3>
                </Link>
                <Link to="/cards/">
                    <h3 className="hamburger-header">Cards</h3>
                </Link>
                <Link to="/decks/">
                    <h3 className="hamburger-header">Decks</h3>
                </Link>
                <Link to="/events/">
                    <h3 className="hamburger-header">Events</h3>
                </Link>
                <Link to="/events/">
                    <h3 className="hamburger-header">Replays</h3>
                </Link>
                <Link to="/formats/">
                    <h3 className="hamburger-header">Formats</h3>
                </Link>
                {
                    playerId ? (
                        <a href="/auth/logout/">
                            <h3 className="hamburger-header">Logout</h3>
                        </a>
                    ) : (
                        <a href="/auth/login/">
                            <h3 className="hamburger-header">Login</h3>
                        </a>
                    )
                }
            </div>
        </div>
    )
}
