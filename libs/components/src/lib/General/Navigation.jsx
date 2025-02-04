
import { Link } from 'react-router-dom'
import { getCookie } from '@fl/utils'
import './Navigation.css'

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
export const Navigation = (props) => {
    const { switchTheme, theme } = props
    const isContentManager = props.roles?.contentManager
    const isSubscriber = props.roles?.subscriber

    return (
        <>
        <div className="nav-bar">
            <Link to="/" state={{ page: 1 }}  >
                <div id="logo">
                    <img src={'https://cdn.formatlibrary.com/images/logos/Format Library.png'} alt="logo"/>
                    <h1>Format Library</h1>
                </div>
            </Link>
            <div id="nav-menu">
                <div onClick={() => {window.location.href="/cards/"}}>
                    <h2 className="nav-header">CARDS</h2>
                </div>
                <div onClick={() => {window.location.href="/decks/"}}>
                    <h2 className="nav-header">DECKS</h2>
                </div>
                <div onClick={() => {window.location.href="/events/"}}>
                    <h2 className="nav-header">EVENTS</h2>
                </div>
                <div onClick={() => {window.location.href="/replays/"}}>
                    <h2 className="nav-header">REPLAYS</h2>
                </div>
                <div onClick={() => {window.location.href="/formats/"}}>
                    <h2 className="nav-header">FORMATS</h2>
                </div>
                <div onClick={() => {window.location.href="/apps/"}}>
                    <h2 className="nav-header">APPS</h2>
                </div>
                {
                    isContentManager ? (
                        <div onClick={() => {window.location.href="/admin-portal/"}}>
                            <h2 className="nav-header">ADMIN</h2>
                        </div>
                    ) : ''
                }
            </div>
            <div id="nav-menu">
                <div id={`theme-toggle-${theme}`} onClick={() => switchTheme()}>
                    <div id={`theme-toggle-inner-circle-${theme}`}></div>
                </div>
                {
                    isSubscriber ? (
                        <a href="https://billing.stripe.com/p/login/4gw14n5Cd4zp6KkbII">
                            <h1 id="subscribe" className="nav-header-small">MANAGE SUBSCRIPTION</h1>
                        </a>
                    ) : (
                        <a href="/subscribe">
                            <h1 id="subscribe" className="nav-header">SUBSCRIBE</h1>
                        </a>
                    )
                }
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
                <div onClick={() => {window.location.href="/cards/"}} >
                    <h3 className="hamburger-header">Cards</h3>
                </div>
                <div onClick={() => {window.location.href="/decks/"}}>
                    <h3 className="hamburger-header">Decks</h3>
                </div>
                <div onClick={() => {window.location.href="/events/"}}>
                    <h3 className="hamburger-header">Events</h3>
                </div>
                <div onClick={() => {window.location.href="/replays/"}}>
                    <h3 className="hamburger-header">Replays</h3>
                </div>
                <div onClick={() => {window.location.href="/formats/"}}>
                    <h3 className="hamburger-header">Formats</h3>
                </div>
                <div onClick={() => {window.location.href="/apps/"}}>
                    <h3 className="hamburger-header">Apps</h3>
                </div>
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
            <div className="announcement-banner">
                <h2>
                    <a
                        className="inherit-color" 
                        href="https://discord.com/channels/414551319031054346/414577532969418753/1333529424078835732"
                        rel="noreferrer"
                        target="_blank"
                    >The 2025 HAT Format Seasonal Ladder Begins Now! Click to Play.</a></h2>
            </div>
        </>
    )
}
