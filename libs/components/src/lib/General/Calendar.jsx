



import { useLayoutEffect } from 'react'

export const Calendar = () => {
  // USE LAYOUT EFFECT
  useLayoutEffect(() => window.scrollTo(0, 0))

  return (
    <div className="body">
      <div className="center" style={{"width":"100%"}}>
        <iframe title="Format Library Event Calendar" src="https://calendar.google.com/calendar/embed?wkst=1&ctz=America%2FNew_York&showPrint=0&src=Zm9ybWF0bGlicmFyeUBnbWFpbC5jb20&color=%23039be5" style={{"border":"solid 1px #777", "margin":"0px auto", "width":"90%", "height":"80vh", "frameborder":"0", "scrolling":"no"}}></iframe>
      </div>
    </div>
  )
}
