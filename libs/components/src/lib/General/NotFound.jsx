
import { useLayoutEffect } from 'react'

export const NotFound = () => {
  // USE LAYOUT EFFECT
  useLayoutEffect(() => window.scrollTo(0, 0))

  return (
    <div className="body">
      <div className="not-found-flexbox">
        <h1>404 - Not Found</h1>
        <img id="dig" src="https://cdn.formatlibrary.com/images/artworks/dig.jpg" />
      </div>
    </div>
  )
}
