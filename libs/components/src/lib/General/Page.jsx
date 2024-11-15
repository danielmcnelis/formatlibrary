
import { Navigation } from './Navigation'
import { Footer } from './Footer'
import useLocalStorage from 'use-local-storage'
import { Helmet } from 'react-helmet'

// PAGE
export const Page = (props) => {
  const { element, disableAds } = props
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
    <div>
    {
        disableAds ? (
            <div id="theme" data-theme={theme}>
                <Navigation switchTheme={switchTheme} theme={theme}/>
                {element}
                <Footer/>
            </div>
        ) : (
            <>
                <Helmet>
                    <script data-no-optimize="1" data-cfasync="false" src="https://formatlibrary.com/raptive.js"></script>
                </Helmet>
                <div id="theme" data-theme={theme}>
                    <Navigation switchTheme={switchTheme} theme={theme}/>
                    {element}
                    <Footer/>
                </div>
            </>
        )
    }
    </div>
)
}