
import { useState, useEffect, useLayoutEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { CardImage } from '../Cards/CardImage'
import { Matchup } from './MatchupBar'
import { NotFound } from '../General/NotFound'
import { useLocation } from 'react-router-dom'
import { capitalize, getCookie } from '@fl/utils'
import './DeckType.css'
const playerId = getCookie('playerId')

const emojis = {
  Helmet: 'https://cdn.formatlibrary.com/images/emojis/helmet.png',
  Controller: 'https://cdn.formatlibrary.com/images/emojis/controller.png',
  Orb: 'https://cdn.formatlibrary.com/images/emojis/orb.png',
  Lock: 'https://cdn.formatlibrary.com/images/emojis/lock.png',
  Bow: 'https://cdn.formatlibrary.com/images/emojis/bow.png',
  Voltage: 'https://cdn.formatlibrary.com/images/emojis/voltage.png',
  Unicorn: 'https://cdn.formatlibrary.com/images/emojis/unicorn.png',
  Volcano: 'https://cdn.formatlibrary.com/images/emojis/volcano.png',
  Thinking: 'https://cdn.formatlibrary.com/images/emojis/thinking.png'
}

const { Helmet, Controller, Orb, Lock, Bow, Voltage, Volcano, Unicorn, Thinking } = emojis

export const DeckType = () => {
    const [summary, setSummary] = useState({})
    const [matchups, setMatchups] = useState(false)
    const [minMatches, setMinMatches] = useState(15)
    const [banlist, setBanList] = useState({})
    const [isAdmin, setIsAdmin] = useState(false)
    const [isSubscriber, setIsSubscriber] = useState(false)
    const navigate = useNavigate()
    const goToFormat = () => navigate(`/formats/${summary.format ? summary.format.name : ''}`)
    const { id } = useParams()
    const location = useLocation()
    const format = location?.search?.slice(8)
    console.log('summary', summary)
    console.log('matchups', matchups)

    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0), [])

    // USE LAYOUT EFFECT
    useEffect(() => {
        const grandTotal = Object.values(matchups).map((m) => m.total).reduce((a, v) => a += v, 0)
        const min = grandTotal < 200 ? 5 :
            grandTotal < 400 ? 10 :
            15

        setMinMatches(min)
    }, [matchups])

    // USE EFFECT
    useEffect(() => {
        const checkIfAdmin = async () => {
            try {
                const { status } = await axios.get(`/api/players/admin/${playerId}`)
                if (status === 200) setIsAdmin(true)
            } catch (err) {
                console.log(err)
            }
        }

        const checkIfSubscriber = async () => {
            try {
                const { status } = await axios.get(`/api/players/subscriber/${playerId}`)
                if (status === 200) setIsSubscriber(true)
            } catch (err) {
                console.log(err)
            }
        }

        checkIfAdmin()
        checkIfSubscriber()
    }, [])

    // USE EFFECT SET MATCHUPS
    useEffect(() => {
        const fetchData = async () => {
          try {
            const {data} = await axios.get(`/api/matchups/${id}?format=${format}&isAdmin=${isAdmin}&isSubscriber=${isSubscriber}`)
            setMatchups(data)
          } catch (err) {
            console.log(err)
            setSummary(null)
          }
        }
    
        fetchData()
      }, [isSubscriber, isAdmin, format, id])

    // USE EFFECT SET CARD
    useEffect(() => {
      const fetchData = async () => {
        try {
          const {data} = await axios.get(`/api/deckTypes/summary?id=${id}&format=${format}`)
          setSummary(data)
        } catch (err) {
          console.log(err)
          setSummary(null)
        }
      }
  
      fetchData()
    }, [])
  
    // USE EFFECT SET CARD
    useEffect(() => {
      const fetchData = async () => {
        try {
          const {data} = await axios.get(`/api/banlists/simple/${summary?.format?.banlist}`)
          setBanList(data)
        } catch (err) {
          console.log(err)
        }
      }
  
      fetchData()
    }, [summary])
  
    if (!summary) return <NotFound/>
    if (!summary.deckType) return <div/>
  
    const categoryImage = summary.deckCategory === 'Aggro' ? Helmet :
      summary.deckCategory === 'Combo' ? Controller :
      summary.deckCategory === 'Control' ? Orb :
      summary.deckCategory === 'Lockdown' ? Lock :
      summary.deckCategory === 'Multiple' ? Unicorn :
      summary.deckCategory === 'Stun' ? Voltage :
      summary.deckCategory === 'Midrange' ? Bow :
      summary.deckCategory === 'Ramp' ? Volcano :
      Thinking
    
    const addLike = async () => {
      const res = await axios.get(`/api/deckTypes/like/${id}`)
      if (res.status === 200) {
        const rating = summary.rating++
        setSummary({rating, ...deck})
      }
    }
  
    const addDownload = async () => {
      const downloads = summary.downloads++
      setSummary({downloads, ...deck})
    }
  
    const toggle = (category, index) => {
      let info = document.getElementById(`${category}-info-${index}`)
      let details = document.getElementById(`${category}-details-${index}`)
      
      if (getComputedStyle(details).display == "none") {
        details.style.display = "block"
      } else {
        details.style.display = "none"
      }
  
      if (getComputedStyle(info).display == "none") {
        info.style.display = "block"
      } else {
        info.style.display = "none"
      } 
    }
  
    return (
      <div className="body">
        <div className="single-deck-title-flexbox">
            <a
                className="link desktop-only"
                href={`/api/deckTypes/download?id=${id}&format=${format}`} 
                download={`${summary.deckType} - ${capitalize(format)} Skeleton.ydk`}
                onClick={()=> addDownload()}
            >                                    
                <div className="deck-button">
                    <b style={{padding: '0px 6px'}}>Download</b>
                    <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/download.png`}/>
                </div>
            </a>
            <div className="single-deck-title">{summary.deckType}</div>
            <Link to="/builder" state={{ deck: {} }} className="desktop-only">                                    
                <div className="deck-button">
                    <b style={{padding: '0px 6px'}}>Open Deck</b>
                    <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/open-file.png`}/>
                </div>
            </Link>
        </div>
        <table className="single-deck-table">
          <tbody>
            <tr className="single-deck-info-1">
              <td>
                <div onClick={() => goToFormat()} className="single-deck-cell">
                  <div className="single-deck-format-link" style={{paddingRight:'7px'}}><b>Format:</b> {summary.format.name}</div>
                  <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/${summary.format.icon}.png`}/>
                </div>       
              </td>
              <td>
                <div className="single-deck-cell">
                  <div className="single-deck-category" style={{paddingRight:'7px'}}><b>Category:</b> {summary.deckCategory}</div>
                  <img className="single-deck-category-emoji" style={{width:'28px'}} src={categoryImage}/>
                </div>
              </td>
              <td>
                <div className="single-deck-cell">
                  <div className="single-deck-category" style={{paddingRight:'7px'}}><b>Frequency:</b> {summary.percent}%</div>
                  <img className="single-deck-category-emoji" style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/math.png`}/>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
  
        <h2>Popular Main Deck Cards</h2>
        <div id="main" className="deck-bubble">
            <div id="main" className="deck-flexbox">
            {
              summary.mainMonsters.map((data, index) => {
                const info = data['1'] > data['2'] && data['1'] > data['3'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100)}%` :
                  data['2'] >= data['1'] && data['2'] >= data['3'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100)}%` :
                  `3x in ${Math.round(data['3'] / summary.analyzed * 100)}%` 
  
                  const details = (data['3'] ? `3x in ${Math.round(data['3'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    (data['2'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    (data['1'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    ((summary.analyzed - data.decks) ? `0x in ${Math.round((summary.analyzed - data.decks) / summary.analyzed * 100) || '<1'}%` : '')
  
                  return (
                    <div className="popular-main" key={'m' + data.card.ypdId}>
                      <CardImage className="popular-main-card" width='72px' padding='1px' margin='0px' card={data.card} status={banlist[data.card.id]}/>
                      <div onClick={() => toggle('main-monsters', index)}>
                        <div id={'main-monsters-info-' + index} className="deckType-info">{info}</div>
                        <div id={'main-monsters-details-' + index} className="expanded-info">{details}</div>
                      </div>
                    </div>
                  )
              })
            }
            {
              summary.mainSpells.map((data, index) => {
                const info = data['1'] > data['2'] && data['1'] > data['3'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100)}%` :
                  data['2'] >= data['1'] && data['2'] >= data['3'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100)}%` :
                  `3x in ${Math.round(data['3'] / summary.analyzed * 100)}%` 
  
                  const details = (data['3'] ? `3x in ${Math.round(data['3'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    (data['2'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    (data['1'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    ((summary.analyzed - data.decks) ? `0x in ${Math.round((summary.analyzed - data.decks) / summary.analyzed * 100) || '<1'}%` : '')
  
                  return (
                    <div className="popular-main" key={'m' + data.card.ypdId} >
                      <CardImage width='72px' padding='1px' margin='0px' card={data.card} status={banlist[data.card.id]}/>
                      <div onClick={() => toggle('main-spells', index)}>
                        <div id={'main-spells-info-' + index} className="deckType-info">{info}</div>
                        <div id={'main-spells-details-' + index} className="expanded-info">{details}</div>
                      </div>
                    </div>
                  )
              })
            }
            {
              summary.mainTraps.map((data, index) => {
                const info = data['1'] > data['2'] && data['1'] > data['3'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100)}%` :
                  data['2'] >= data['1'] && data['2'] >= data['3'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100)}%` :
                  `3x in ${Math.round(data['3'] / summary.analyzed * 100)}%` 
  
                  const details = (data['3'] ? `3x in ${Math.round(data['3'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    (data['2'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    (data['1'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    ((summary.analyzed - data.decks) ? `0x in ${Math.round((summary.analyzed - data.decks) / summary.analyzed * 100) || '<1'}%` : '')
  
                  return (
                    <div className="popular-main" key={'m' + data.card.ypdId} >
                      <CardImage width='72px' padding='1px' margin='0px' card={data.card} status={banlist[data.card.id]}/>
                      <div onClick={() => toggle('main-traps', index)}>
                        <div id={'main-traps-info-' + index} className="deckType-info">{info}</div>
                        <div id={'main-traps-details-' + index} className="expanded-info">{details}</div>
                      </div>
                    </div>
                  )
              })
            }
            </div>
        </div>
  
        {
          summary.extraMonsters.length ? (
            <>
              <br/>
              <h2>Popular Extra Deck Cards</h2>
              <div id="extra" className="deck-bubble">
                  <div id="extra" className="deck-flexbox">
                  {
                    summary.extraMonsters.map((data, index) => {
                      const info = data['1'] > data['2'] && data['1'] > data['3'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100)}%` :
                        data['2'] >= data['1'] && data['2'] >= data['3'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100)}%` :
                        `3x in ${Math.round(data['3'] / summary.analyzed * 100)}%` 
  
                        const details = (data['3'] ? `3x in ${Math.round(data['3'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                        (data['2'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                        (data['1'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                        ((summary.analyzed - data.decks) ? `0x in ${Math.round((summary.analyzed - data.decks) / summary.analyzed * 100) || '<1'}%` : '')
      
                        return (
                          <div className="popular-side" key={'e' + data.card.ypdId} >
                            <CardImage width='72px' padding='1px' margin='0px' card={data.card} status={banlist[data.card.id]}/>
                            <div onClick={() => toggle('extra', index)}>
                              <div id={'extra-info-' + index} className="deckType-info">{info}</div>
                              <div id={'extra-details-' + index} className="expanded-info">{details}</div>
                            </div>
                          </div>
                        )
                    })
                  }
                  </div>
              </div>
            </>
          ) : ''
        }
  
        <br/>
        <h2>Popular Side Deck Cards</h2>
        <div id="side" className="deck-bubble">
            <div id="side" className="deck-flexbox">
            {
              summary.sideMonsters.map((data, index) => {
                const info = data['1'] > data['2'] && data['1'] > data['3'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100)}%` :
                  data['2'] >= data['1'] && data['2'] >= data['3'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100)}%` :
                  `3x in ${Math.round(data['3'] / summary.analyzed * 100)}%` 
  
                  const details = (data['3'] ? `3x in ${Math.round(data['3'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    (data['2'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    (data['1'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    ((summary.analyzed - data.decks) ? `0x in ${Math.round((summary.analyzed - data.decks) / summary.analyzed * 100) || '<1'}%` : '')
  
                  return (
                    <div className="popular-side" key={'s' + data.card.ypdId} >
                      <CardImage width='72px' padding='1px' margin='0px' card={data.card} status={banlist[data.card.id]}/>
                      <div onClick={() => toggle('side-monsters', index)}>
                        <div id={'side-monsters-info-' + index} className="deckType-info">{info}</div>
                        <div id={'side-monsters-details-' + index} className="expanded-info">{details}</div>
                      </div>
                    </div>
                  )
              })
            }
            {
              summary.sideSpells.map((data, index) => {
                const info = data['1'] > data['2'] && data['1'] > data['3'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100)}%` :
                  data['2'] >= data['1'] && data['2'] >= data['3'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100)}%` :
                  `3x in ${Math.round(data['3'] / summary.analyzed * 100)}%` 
  
                  const details = (data['3'] ? `3x in ${Math.round(data['3'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    (data['2'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    (data['1'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    ((summary.analyzed - data.decks) ? `0x in ${Math.round((summary.analyzed - data.decks) / summary.analyzed * 100) || '<1'}%` : '')
  
                  return (
                    <div className="popular-side" key={'s' + data.card.ypdId}>
                      <CardImage width='72px' padding='1px' margin='0px' card={data.card} status={banlist[data.card.id]}/>
                      <div onClick={() => toggle('side-spells', index)}>
                        <div id={'side-spells-info-' + index} className="deckType-info">{info}</div>
                        <div id={'side-spells-details-' + index} className="expanded-info">{details}</div>
                      </div>
                    </div>
                  )
              })
            }
            {
              summary.sideTraps.map((data, index) => {
                const info = data['1'] > data['2'] && data['1'] > data['3'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100)}%` :
                  data['2'] >= data['1'] && data['2'] >= data['3'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100)}%` :
                  `3x in ${Math.round(data['3'] / summary.analyzed * 100)}%` 
  
                  const details = (data['3'] ? `3x in ${Math.round(data['3'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    (data['2'] ? `2x in ${Math.round(data['2'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    (data['1'] ? `1x in ${Math.round(data['1'] / summary.analyzed * 100) || '<1'}%\n` : '') +
                    ((summary.analyzed - data.decks) ? `0x in ${Math.round((summary.analyzed - data.decks) / summary.analyzed * 100) || '<1'}%` : '')
  
                  return (
                    <div className="popular-side" key={'s' + data.card.ypdId}>
                      <CardImage width='72px' padding='1px' margin='0px' card={data.card} status={banlist[data.card.id]}/>
                        <div onClick={() => toggle('side-traps', index)}>
                          <div id={'side-traps-info-' + index} className="deckType-info">{info}</div>
                          <div id={'side-traps-details-' + index} className="expanded-info">{details}</div>
                        </div>
                    </div>
                  )
              })
            }
            </div>
        </div>
        {
            matchups ? (
                <>
                    <br/>
                    <h2>Matchups</h2>
                    <div className="matchup-box">
                    {
                        Object.entries(matchups).filter((m) => m[1].total >= minMatches).sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total)).map((m) => <Matchup deckType={m[0]} wins={m[1].wins} losses={m[1].losses} total={m[1].total} format={format}/>)
                    }
                    </div>
                </>
            ) : ''
        }
      </div>
    )
}
