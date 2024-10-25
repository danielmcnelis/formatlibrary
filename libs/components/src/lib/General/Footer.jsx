
import { Link } from 'react-router-dom'
import './Footer.css'

// FOOTER
export const Footer = () => (
  <div className="footer">
    <div className="left-flex">
      <a href="https://discord.com/invite/formatlibrary" target="_blank" rel="noopener noreferrer">
        <div className="discord-link">
          <div className="discord-logo" />
          <p className="discord-desc">Join our Discord!</p>
        </div>
      </a>
      <br />
      <a href="https://www.buymeacoffee.com/danielmcnelis" target="_blank" rel="noreferrer" className="desktop-only">
        <img
          src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
          alt="Buy Me A Coffee"
          className="coffee-logo"
        />
      </a>
    </div>
    <div>
      <div id="footer-menu">
        <div onClick={() => {window.location.href="/cards/"}}>
          <p className="footer-item">Card Database</p>
        </div>
        <div onClick={() => {window.location.href="/decks/"}}>
          <p className="footer-item">Deck Database</p>
        </div>
        <div onClick={() => {window.location.href="/events/"}}>
          <p className="footer-item">Event Coverage</p>
        </div>
        <div onClick={() => {window.location.href="/replays/"}}>
          <p className="footer-item">Replay Database</p>
        </div>
        <div onClick={() => {window.location.href="/formats/"}}>
          <p className="footer-item">Format Intros</p>
        </div>
      </div>
      <p className="disclaimer">
        Format Library is a public resource for learning about the Yu-Gi-Oh! Trading Card Game and its history.
        Trademarked artwork and card text is used for informational purposes under U.S. fair use copyright policy. Not
        affiliated with 4K Media or Konami Digital Entertainment.
      </p>
      <div id="footer-menu">
        <div to="/terms.html" target="_blank" rel="noopener noreferrer">
          <p className="footer-item">Terms & Conditions</p>
        </div>
        <div to="/privacy.html" target="_blank" rel="noopener noreferrer">
          <p className="footer-item">Privacy Policy</p>
        </div>
      </div>
    </div>

    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Link to="/" state={{page:1}} >
        <div className="footer-logo" />
      </Link>
      <br />
      <a
        href="https://tcgplayer.pxf.io/XYZQm5"
        target="_blank"
        rel="noreferrer"
        className="desktop-only"
      >
        <img src="https://cdn.formatlibrary.com/images/logos/TCGPlayer.png" alt="TCG Player" className="tcgplayer-logo" />
        <p className="tcgplayer-desc" >Shop to support us!</p>
      </a>
    </div>
  </div>
)
