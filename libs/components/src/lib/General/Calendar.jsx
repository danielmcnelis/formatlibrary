



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
        <iframe title="Format Library Event Calendar" src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FNew_York&showPrint=0&showCalendars=0&src=Zm9ybWF0bGlicmFyeUBnbWFpbC5jb20&src=ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&color=%23039be5&color=%230b8043" style={{"border":"solid 1px #777", "width":"800", "height":"600", "frameborder":"0", "scrolling":"no"}}></iframe>
      </div>
    </div>
  )
}
