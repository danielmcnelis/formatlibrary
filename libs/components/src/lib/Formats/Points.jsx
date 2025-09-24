
import { useState, useEffect } from 'react'
import axios from 'axios'
import { CardImage } from '../Cards/CardImage'
import { NotFound } from '../General/NotFound'
import './BanList.css'


export const Points = () => {
    const [points, setPoints] = useState([])
      
    // USE EFFECT SET CARD
    useEffect(() => {
      const fetchData = async () => {
        try {
          const {data} = await axios.get(`/api/points/`)
          return setPoints(data)
        } catch (err) {
          console.log(err)
          setPoints(null)
        }
      }
  
      fetchData()
    }, [])

    if (points === null) return <NotFound/>
    if (!points?.length) return <div />
  
    return (
        <div>
            <div className="divider"/>
                <div id="banlist" className="banlist">
                    <h2 className="subheading">{'Genesys Point System'}</h2>
                    <h3 className="banlist-date">Effective - September 24, 2025</h3>
                    {
                    points?.length ? (
                        <div>
                            <div id="forbidden" className="banlist-bubble">
                                <div id="forbidden" className="banlist-category">Forbidden:</div>
                                <div id="forbidden" className="banlist-flexbox">
                                {
                                points.map((el) => 
                                <
                                    CardImage 
                                    width='72px' 
                                    padding='1px' 
                                    margin='0px'
                                    points={el[1]}
                                    key={el[0].id} 
                                    card={el[0].card}
                                />
                                )
                                }
                                </div>
                            </div>
                        </div>
                    ) : ''
                    }
                </div>
        </div>
    )
}
