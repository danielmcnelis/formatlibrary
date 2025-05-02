
import { useState, useEffect } from 'react'
import axios from 'axios'
import { CardImage } from '../Cards/CardImage'
import { NotFound } from '../General/NotFound'
import { useParams, useSearchParams } from 'react-router-dom'
import './BanList.css'


export const BanList = (props) => {
    const [banlist, setBanlist] = useState({})
    const [searchParams, ] = useSearchParams()
    const {format} = props
    const [id, setId] = useState(null)
    const { id: useParamsId } = useParams()
    if (useParamsId && id !== useParamsId) {
        setId(useParamsId)
    }
    const category = searchParams.get('category') || format?.category || 'TCG'
    const BL = format?.banlist || id
    
  
    // USE EFFECT SET CARD
    useEffect(() => {
      const fetchData = async () => {
        try {
          const {data} = await axios.get(`/api/banlists/${BL}?category=${category}`)
          return setBanlist(data)
        } catch (err) {
          console.log(err)
          setBanlist(null)
        }
      }
  
      fetchData()
    }, [BL, format?.category])
  
    if (banlist === null) return <NotFound/>
    const { forbidden, limited, semiLimited, unlimited, limited1, limited2, limited3 } = banlist
    if (
        !banlist.id || (
            !forbidden?.length &&
            !limited?.length &&
            !semiLimited?.length &&
            !limited1?.length &&
            !limited2?.length &&
            !limited3?.length &&
            !unlimited?.length
        )
    ) return <div />
  
    return (
        <div>
            <div className="divider"/>
                <div id="banlist" className="banlist">
                    <h2 className="subheading">{forbidden.length ? 'Forbidden & Limited List' : 'Limited List'}</h2>
                    <h3 className="banlist-date">Effective - {BL}</h3>
                    {
                    forbidden.length ? (
                        <div>
                            <div id="forbidden" className="banlist-bubble">
                                <div id="forbidden" className="banlist-category">Forbidden:</div>
                                <div id="forbidden" className="banlist-flexbox">
                                {
                                forbidden.map((el) => 
                                <
                                    CardImage 
                                    width='72px' 
                                    padding='1px' 
                                    margin='0px'
                                    previous={el.restriction !== el.previous ? el.previous : null}
                                    key={el.card.id} 
                                    card={el.card}
                                />
                                )
                                }
                                </div>
                            </div>
                        </div>
                    ) : ''
                    }

                    {
                    limited.length ? (
                        <div>
                            <div id="limited" className="banlist-bubble">
                                <div id="limited" className="banlist-category">Limited:</div>
                                <div id="limited" className="banlist-flexbox">
                                {
                                limited.map((el) => 
                                <
                                    CardImage 
                                    width='72px' 
                                    padding='1px' 
                                    margin='0px'
                                    previous={el.restriction !== el.previous ? el.previous : null}
                                    key={el.card.id} 
                                    card={el.card}
                                />
                                )
                                }
                                </div>
                            </div>
                        </div>
                    ) : ''
                    }

                    {
                    semiLimited.length ? (
                        <div>
                            <div id="semi-limited" className="banlist-bubble">
                                <div id="semi-limited" className="banlist-category">Semi-Limited:</div>
                                <div id="semi-limited" className="banlist-flexbox">
                                {
                                semiLimited.map((el) => 
                                <
                                    CardImage 
                                    width='72px' 
                                    padding='1px' 
                                    margin='0px'
                                    previous={el.restriction !== el.previous ? el.previous : null}
                                    key={el.card.id} 
                                    card={el.card}
                                />
                                )
                                }
                                </div>
                            </div>
                        </div>
                    ) : ''
                    }


                    {
                    limited1.length ? (
                        <div>
                            <div id="limited-1" className="banlist-bubble">
                                <div id="limited-1" className="banlist-category">Up to 1 Per Deck:</div>
                                <div id="limited-1" className="banlist-flexbox">
                                {
                                limited1.map((el) => 
                                <
                                    CardImage 
                                    width='72px' 
                                    padding='1px' 
                                    margin='0px'
                                    previous={el.restriction !== el.previous ? el.previous : null}
                                    key={el.card.id} 
                                    card={el.card}
                                />
                                )
                                }
                                </div>
                            </div>
                        </div>
                    ) : ''
                    }

                    {  
                    limited2.length ? (
                        <div>
                            <div id="limited-2" className="banlist-bubble">
                                <div id="limited-2" className="banlist-category">Up to 2 Per Deck:</div>
                                <div id="limited-2" className="banlist-flexbox">
                                {
                                limited1.map((el) => 
                                <
                                    CardImage 
                                    width='72px' 
                                    padding='1px' 
                                    margin='0px'
                                    previous={el.restriction !== el.previous ? el.previous : null}
                                    key={el.card.id} 
                                    card={el.card}
                                />
                                )
                                }
                                </div>
                            </div>
                        </div>
                    ) : ''
                    }

                    {
                    limited3.length ? (
                        <div>
                            <div id="limited-3" className="banlist-bubble">
                                <div id="limited-3" className="banlist-category">Up to 3 Per Deck:</div>
                                <div id="limited-3" className="banlist-flexbox">
                                {
                                limited3.map((el) => 
                                <
                                    CardImage 
                                    width='72px' 
                                    padding='1px' 
                                    margin='0px'
                                    previous={el.restriction !== el.previous ? el.previous : null}
                                    key={el.card.id} 
                                    card={el.card}
                                />
                                )
                                }
                                </div>
                            </div>
                        </div>
                    ) : ''
                    }

                    {
                        unlimited.length ? (
                            <div id="unlimited" className="banlist-bubble">
                                <div id="unlimited" className="banlist-category">No Longer Restricted:</div>
                                    <div id="unlimited" className="banlist-flexbox">
                                    {
                                    unlimited.map((el) => 
                                        <
                                        CardImage 
                                        width='72px' 
                                        padding='1px' 
                                        margin='0px'
                                        previous={el.restriction !== el.previous ? el.previous : null}
                                        key={el.card.id}
                                        card={el.card}
                                        />
                                    )
                                    }
                                </div>
                            </div>
                        ) : ''
                    }
                </div>
        </div>
    )
}
