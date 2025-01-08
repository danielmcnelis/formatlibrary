
import { useState, useEffect } from 'react'
import axios from 'axios'
import { FormatButton } from './FormatButton'
import { Helmet } from 'react-helmet'
import './FormatMenu.css'

export const FormatMenu = (props) => {
    const [formats, setFormats] = useState(null)
    const [category, setCategory] = useState('TCG')

    const isContentManager = props.roles?.contentManager
    const popularFormats = formats?.filter((format) => format.category === category && format.isPopular)
    const spotlightFormats = formats?.filter((format) => format.category === category && format.isSpotlight)
    const dmFormats = formats?.filter((format) => format.category === category && !format.isPopular && !format.isSpotlight && format.era === 'DM')
    const gxFormats = formats?.filter((format) => format.category === category && !format.isPopular && !format.isSpotlight && format.era === 'GX')
    const fiveDsFormats = formats?.filter((format) => format.category === category && !format.isPopular && !format.isSpotlight && format.era === '5D\'s')
    const zexalFormats = formats?.filter((format) => format.category === category && !format.isPopular && !format.isSpotlight && format.era === 'ZEXAL')
    const arcVFormats = formats?.filter((format) => format.category === category && !format.isPopular && !format.isSpotlight && format.era === 'ARC-V')
    const vrainsFormats = formats?.filter((format) => format.category === category && !format.isPopular && !format.isSpotlight && format.era === 'VRAINS')
    const sevensFormats = formats?.filter((format) => format.category === category && !format.isPopular && !format.isSpotlight && format.era === 'SEVENS')
    const goRushFormats = formats?.filter((format) => format.category === category && !format.isPopular && !format.isSpotlight && format.era === 'GO RUSH!!')

    // SWITCH CATEGORY
    const switchCategory = async () => {
        if (category === 'TCG') {
            setCategory('OCG')
        } else {
            setCategory('TCG')
        }
    }
  
    // USE EFFECT SET FORMATS
    useEffect(() => {
      const fetchData = async () => {
        try {
          const {data} = await axios.get(`/api/formats/`)
          return setFormats(data)
        } catch (err) {
          console.log(err)
        }
      }
  
      fetchData()
    }, [])
  
    if (!formats) return <div style={{height: '100vh'}}/>
  
    return (
        
        <>
            <Helmet>
                <title>{`Yu-Gi-Oh! Formats - Format Library`}</title>
                <meta name="og:title" content={`Yu-Gi-Oh! Formats - Format Library`}/>
                <meta name="description" content={`Learn more about any Yu-Gi-Oh! format from 2002 to today.`}/>
                <meta name="og:description" content={`Learn more about any Yu-Gi-Oh! format from 2002 to today.`}/>
            </Helmet>
            {/* Default Gaming Playlist */}
            <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            <div className="body">
                {
                    isContentManager ? (
                        <>
                            <div className='horizontal-space-between-flexbox' >
                                <h2>{category}</h2>
                                <div 
                                    id={`category-toggle-${category}`} 
                                    onClick={() => switchCategory()}
                                >
                                    <div id={`category-toggle-inner-circle-${category}`}></div>
                                </div>
                            </div>
                            <h1 className="format-menu-title">Popular Formats</h1>
                        </>
                    ) : <h1 className="format-menu-title">Popular Formats</h1>
                }
                <div className="format-menu">
                    {
                        popularFormats.length ? (
                            <>
                                <h1 className="format-menu-title">Popular Formats</h1>
                                <div className="format-menu">
                                {
                                    popularFormats.map((format) => <FormatButton key={format.id} format={format}  />)
                                }
                                </div>
                                <div className="divider"/>
                            </>
                        ) : ''
                    }
                </div>
                <div className="divider"/>
                <div className="non-popular-formats">
                    {
                        spotlightFormats.length ? (
                            <>
                                <h1 className="format-menu-title">Spotlight Formats</h1>
                                <div className="format-menu">
                                {
                                    spotlightFormats.map((format) => <FormatButton key={format.id} format={format}  />)
                                }
                                </div>
                                <div className="divider"/>
                            </>
                        ) : ''
                    }
                    <h1 className="format-menu-title">DM Formats</h1>
                    <div className="format-menu">
                    {
                        dmFormats.map((format) => <FormatButton key={format.id} format={format}  />)
                    }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">GX Formats</h1>
                    <div className="format-menu">
                    {
                        gxFormats.map((format) => <FormatButton key={format.id} format={format}  />)
                    }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">5D's Formats</h1>
                    <div className="format-menu">
                    {
                        fiveDsFormats.map((format) => <FormatButton key={format.id} format={format}  />)
                    }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">ZEXAL Formats</h1>
                    <div className="format-menu">
                    {
                        zexalFormats.map((format) => <FormatButton key={format.id} format={format}  />)
                    }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">ARC-V Formats</h1>
                    <div className="format-menu">
                    {
                        arcVFormats.map((format) => <FormatButton key={format.id} format={format}  />)
                    }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">VRAINS Formats</h1>
                    <div className="format-menu">
                    {
                        vrainsFormats.map((format) => <FormatButton key={format.id} format={format}  />)
                    }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">SEVENS Formats</h1>
                    <div className="format-menu">
                    {
                        sevensFormats.map((format) => <FormatButton key={format.id} format={format}  />)
                    }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">GO RUSH!! Formats</h1>
                    <div className="format-menu">
                    {
                        goRushFormats.map((format) => <FormatButton key={format.id} format={format}  />)
                    }
                    </div>
                </div>
                <br/>
            </div>
        </>

    )
}
