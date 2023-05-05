
import { useState, useEffect } from 'react'
import axios from 'axios'
import { FormatButton } from './FormatButton'

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
      <div className="body">
      <h1 className="format-menu-title">Popular Formats</h1>
      <div className="format-menu">
          {
            formats.filter((f) => f.popular).map((format) => <FormatButton key={format.id} format={format}/>)
          }
      </div>
      
      <div className="divider"/>

        <h1 className="format-menu-title">Spotlight Formats</h1>
        <div className="format-menu">
            {
              formats.filter((f) => f.spotlight).map((format) => <FormatButton key={format.id} format={format}/>)
            }
        </div>
        
        <div className="divider"/>
  
        <h1 className="format-menu-title">Other Formats</h1>
        <div className="format-menu">
            {
              formats.filter((f) => !f.popular && !f.spotlight).map((format) => <FormatButton key={format.id} format={format}/>)
            }
        </div>
        <br/>
      </div>
    )
}
