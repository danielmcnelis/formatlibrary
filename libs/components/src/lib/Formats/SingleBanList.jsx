
import { useLayoutEffect } from 'react'
import { BanList } from './BanList'
import { Helmet } from 'react-helmet'
import { useParams } from 'react-router-dom'

export const SingleBanList = (props) => {
    const { id } = useParams()
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0))
    
    return (
        <>
            <Helmet>
                <title>{`${props.format?.banlist} Yu-Gi-Oh! Banlist - Format Library`}</title>
                <meta name="og:title" content={`${props.format?.banlist} Yu-Gi-Oh! Banlist - Format Library`}/>
                <meta name="description" content={`An interactive list of Forbidden, Limited, and Semi-Limited Yu-Gi-Oh! cards from ${props.format?.banlist || id?.replace('-', ' ')}.`}/>
                <meta name="og:description" content={`An interactive list of Forbidden, Limited, and Semi-Limited Yu-Gi-Oh! cards from ${props.format?.banlist || id?.replace('-', ' ')}.`}/>
            </Helmet>
            {/* Default Gaming Playlist */}
            <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            <div className="body">
                <BanList {...props}/>
            </div>
        </>
    )
}
