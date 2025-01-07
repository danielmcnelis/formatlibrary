
import { useState, useEffect } from 'react'
import axios from 'axios'
import { FormatButton } from './FormatButton'
import { Helmet } from 'react-helmet'
import './FormatMenu.css'

export const FormatMenu = () => {
    const [formats, setFormats] = useState(null)
  
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
                <h1 className="format-menu-title">Popular Formats</h1>
                <div className="format-menu">
                    {
                        formats.filter((format) => format.isPopular).map((format) => <FormatButton key={format.id} format={format}  />)
                    }
                </div>
                <div className="divider"/>
                <div className="non-popular-formats">
                    <h1 className="format-menu-title">Spotlight Formats</h1>
                    <div className="format-menu">
                        {
                        formats.filter((format) => format.isSpotlight).map((format) => <FormatButton key={format.id} format={format}  />)
                        }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">DM Formats</h1>
                    <div className="format-menu">
                        {
                        formats.filter((format) => !format.isPopular && !format.isSpotlight && format.era === 'DM').map((format) => <FormatButton key={format.id} format={format}  />)
                        }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">GX Formats</h1>
                    <div className="format-menu">
                        {
                        formats.filter((format) => !format.isPopular && !format.isSpotlight && format.era === 'GX').map((format) => <FormatButton key={format.id} format={format}  />)
                        }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">5D's Formats</h1>
                    <div className="format-menu">
                        {
                        formats.filter((format) => !format.isPopular && !format.isSpotlight && format.era === '5D\'s').map((format) => <FormatButton key={format.id} format={format}  />)
                        }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">ZEXAL Formats</h1>
                    <div className="format-menu">
                        {
                        formats.filter((format) => !format.isPopular && !format.isSpotlight && format.era === 'ZEXAL').map((format) => <FormatButton key={format.id} format={format}  />)
                        }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">ARC-V Formats</h1>
                    <div className="format-menu">
                        {
                        formats.filter((format) => !format.isPopular && !format.isSpotlight && format.era === 'ARC-V').map((format) => <FormatButton key={format.id} format={format}  />)
                        }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">VRAINS Formats</h1>
                    <div className="format-menu">
                        {
                        formats.filter((format) => !format.isPopular && !format.isSpotlight && format.era === 'VRAINS').map((format) => <FormatButton key={format.id} format={format}  />)
                        }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">Series 11 Formats</h1>
                    <div className="format-menu">
                        {
                        formats.filter((format) => !format.isPopular && !format.isSpotlight && format.era === 'Series 11').map((format) => <FormatButton key={format.id} format={format}  />)
                        }
                    </div>
                    <div className="divider"/>
                    <h1 className="format-menu-title">Series 12 Formats</h1>
                    <div className="format-menu">
                        {
                        formats.filter((format) => !format.isPopular && !format.isSpotlight && format.era === 'Series 12').map((format) => <FormatButton key={format.id} format={format}  />)
                        }
                    </div>
                </div>
                <br/>
            </div>
        </>

    )
}
