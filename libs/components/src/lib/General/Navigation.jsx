
import { Link,  } from 'react-router-dom'
import { useMediaQuery } from 'react-responsive'
import { getCookie } from '@fl/utils'
import './Navigation.css'
import axios from 'axios'
const playerId = getCookie('playerId')

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
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' })

    const logOut = async () => {
        try {
            const { request } = await axios.post(`/auth/logout`)
            window.location.href = request.responseURL
        } catch (err) {
            console.log(err)
        }
    }

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
                <div id={`theme-toggle-${theme}`} onClick={() => switchTheme()}>
                    <div id={`theme-toggle-inner-circle-${theme}`}></div>
                </div>
                {
                    isSubscriber ? (
                        <a href="https://billing.stripe.com/p/login/4gw14n5Cd4zp6KkbII">
                            <h1 id="subscribe" className="nav-header-small">MANAGE SUBSCRIPTION</h1>
                        </a>
                    ) : (
                        playerId ? (
                            <a href="/subscribe">
                                <h1 id="subscribe" className="nav-header">SUBSCRIBE</h1>
                            </a>
                        ) : (
                            <a href="/auth/login" onClick={() => alert('Please log-in before subscribing.')}>
                                <h1 id="subscribe" className="nav-header">SUBSCRIBE</h1>
                            </a>   
                        )
                    )
                }
                {
                    playerId ? (
                        <a href="/settings/">
                            <img
                                className="avatar"
                                src={`/api/players/${playerId}/avatar`}  
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
            {
                isMobile ? (
                    <div id={`theme-toggle-${theme}`} onClick={() => switchTheme()}>
                        <div id={`theme-toggle-inner-circle-${theme}`}></div>
                    </div>
                ) : ''
            }
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
                {
                    isSubscriber ? (
                        <a href="https://billing.stripe.com/p/login/4gw14n5Cd4zp6KkbII">
                            <h3 className="hamburger-header">Subscription</h3>
                        </a>
                    ) : playerId ? (
                        <a href="/subscribe">
                            <h3 className="hamburger-header">Subscribe</h3>
                        </a>
                    ) : (
                        <a href="/auth/login/" onClick={() => alert('Please log-in before subscribing.')}>
                            <h3 className="hamburger-header">Subscribe</h3>
                        </a>  
                    )
                }
                {
                    playerId ? (
                        <div onClick={() => logOut()} >
                            <h3 className="hamburger-header">Logout</h3>
                        </div>
                    ) : (
                        <a href="/auth/login/">
                            <h3 className="hamburger-header">Login</h3>
                        </a>
                    )
                }
            </div>
        </div>
            {/* <div className="announcement-banner">
                <h2>
                    <a
                        className="inherit-color" 
                        href="https://discord.com/channels/414551319031054346/414577532969418753/1362067266451144704"
                        rel="noreferrer"
                        target="_blank"
                    >The Goat Format Seasonal Ladder is Underway - Click for More Info!</a></h2>
            </div> */}
        </>
    )
}
