
import { useLayoutEffect } from 'react'
import { BanList } from './BanList'
import { Helmet } from 'react-helmet'
import { useParams } from 'react-router-dom'
import { capitalize } from '@fl/utils'

export const SingleBanList = (props) => {
    const [id, setId] = useState(null)
    const { id: useParamsId } = useParams()
    if (useParamsId && id !== useParamsId) {
        setId(useParamsId)
    }
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0))
    
    return (
        <>
            <Helmet>
                <title>{`${capitalize(id?.replaceAll('-', ' '), true)} Yu-Gi-Oh! Banlist - Format Library`}</title>
                <meta name="og:title" content={`${capitalize(id?.replaceAll('-', ' '), true)} Yu-Gi-Oh! Banlist - Format Library`}/>
                <meta name="description" content={`An interactive list of Forbidden, Limited, and Semi-Limited Yu-Gi-Oh! cards from ${capitalize(id?.replaceAll('-', ' '), true)}.`}/>
                <meta name="og:description" content={`An interactive list of Forbidden, Limited, and Semi-Limited Yu-Gi-Oh! cards from ${capitalize(id?.replaceAll('-', ' '), true)}.`}/>
            </Helmet>
            {/* Default Gaming Playlist */}
            <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            <div className="body">
                <BanList {...props}/>
            </div>
        </>
    )
}
