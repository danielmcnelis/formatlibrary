
import { Navigation } from './Navigation'
import { Footer } from './Footer'

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
