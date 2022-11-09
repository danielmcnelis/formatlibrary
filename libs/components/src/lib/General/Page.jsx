
import { Navigation } from './Navigation'
import { Footer } from './Footer'
import { useState, useEffect } from 'react'

export const Page = (props) => {

  const { element } = props
  return (
    <>
      <Navigation/>
      {element}
      <Footer/>
    </>
  )
}
