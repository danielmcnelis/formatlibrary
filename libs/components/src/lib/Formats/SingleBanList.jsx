
import { useLayoutEffect } from 'react'
import { BanList } from './BanList'
import { Helmet } from 'react-helmet'

export const SingleBanList = (props) => {

    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0))
  
    return (
        <>
            <Helmet>
                <title>{`${props?.format?.name} Format Banlist - Yu-Gi-Oh! Format Library`}</title>
                <meta name="description" content={`An interactive list of cards with images showing the Forbidden, Limited, and Semi-Limited cards in ${props?.format?.name} Format.`}/>
            </Helmet>
            <div className="body">
                <BanList {...props}/>
            </div>
        </>
    )
}
