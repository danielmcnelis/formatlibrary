
import { Navigation } from './Navigation'
import { Footer } from './Footer'
import useLocalStorage from 'use-local-storage'

// PAGE
export const Page = (props) => {
  const { element } = props
  const defaultDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const [theme, setTheme] = useLocalStorage('theme', defaultDark ? 'dark' : 'light')  

    // SWITCH THEME
    const switchTheme = () => {
        if (theme === 'light') {
            setTheme('dark')
        } else {
            setTheme('light')
        }
    }

    
  return (
    <div id="theme" data-theme={theme}>
      <Navigation switchTheme={switchTheme} theme={theme}/>
      {element}
      <Footer/>
    </div>
  )
}
