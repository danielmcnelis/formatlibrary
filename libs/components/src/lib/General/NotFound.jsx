
import { useLayoutEffect } from 'react'
import './NotFound.css'

export const NotFound = () => {
  // USE LAYOUT EFFECT
  useLayoutEffect(() => window.scrollTo(0, 0))

  return (
    <div className="body">
    {/* Default Gaming Playlist */}
    <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
      <div className="not-found-flexbox">
        <h1>404 - Not Found</h1>
        <img id="dig" src="https://cdn.formatlibrary.com/images/artworks/dig.webp" alt="Fossil Dig" />
      </div>
    </div>
  )
}
