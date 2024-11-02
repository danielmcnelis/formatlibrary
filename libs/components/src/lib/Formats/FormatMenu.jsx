
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
  
    if (!formats) return <div />
  
    return (
        
        <>
            <Helmet>
                <title>{`Yu-Gi-Oh! Formats - Format Library`}</title>
                <meta name="og:title" content={`Yu-Gi-Oh! Formats - Format Library`}/>
                <meta name="description" content={`Learn more about any Yu-Gi-Oh! format from 2002 to today.`}/>
                <meta name="og:description" content={`Learn more about any Yu-Gi-Oh! format from 2002 to today.`}/>
            </Helmet>
            {/* Default Gaming Playlist */}
            <div class="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            <div className="body">
                <h1 className="format-menu-title">Popular Formats</h1>
                <div className="format-menu">
                    {
                        formats.filter((f) => f.popular).map((format) => <FormatButton key={format.id} format={format}  />)
                    }
                </div>
                
                <div className="divider"/>

                <h1 className="format-menu-title">Spotlight Formats</h1>
                <div className="format-menu">
                    {
                    formats.filter((f) => f.spotlight).map((format) => <FormatButton key={format.id} format={format}  />)
                    }
                </div>
                
                <div className="divider"/>
        
                <h1 className="format-menu-title">Other Formats</h1>
                <div className="format-menu">
                    {
                    formats.filter((f) => !f.popular && !f.spotlight).map((format) => <FormatButton key={format.id} format={format}  />)
                    }
                </div>
                <br/>
            </div>
        </>

    )
}
