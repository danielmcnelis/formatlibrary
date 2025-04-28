
import { useState, useEffect, useLayoutEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { CardImage } from '../Cards/CardImage'
import { DeckImage } from './DeckImage'
import { Matchup } from './MatchupBar'
import { NotFound } from '../General/NotFound'
import { useLocation } from 'react-router-dom'
import { capitalize, getCookie, urlize } from '@fl/utils'
import { Helmet } from 'react-helmet'
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

const { Controller, Orb, Lock, Bow, Voltage, Volcano, Unicorn, Thinking } = emojis

export const DeckType = (props) => {
    const accessToken = getCookie('access')
    const [summary, setSummary] = useState({})
    const [winRateData, setWinRateData] = useState({})
    const [matchups, setMatchups] = useState({})
    const [banlist, setBanList] = useState({})
    
    const { id } = useParams()
    const location = useLocation()
    const format = location?.search?.slice(8) || summary?.format?.name
    // const videoPlaylistId = summary?.format?.videoPlaylistId

    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0), [])

    // USE EFFECT FETCH DATA
    useEffect(() => {
        const fetchData = async () => {
            try {
                let summaryApiUrl = `/api/decktypes/summary?id=${id}`
                if (format) summaryApiUrl += `&format=${format}`

                const {data: summaryData} = await axios.get(summaryApiUrl)
                setSummary(summaryData)

                if (accessToken) {
                    let winRateSummaryUrl = `/api/decktypes/winrates?id=${id}`
                    if (format) winRateSummaryUrl += `&format=${format}`
                    if (props.roles?.admin) winRateSummaryUrl += '&isAdmin=true'
                    if (props.roles?.subscriber) winRateSummaryUrl += '&isSubscriber=true'
    
                    const {data: winRateData} = await axios.get(winRateSummaryUrl, {
                        headers: {
                            ...(accessToken && {authorization: `Bearer ${accessToken}`})
                        }
                    })
    
                    setWinRateData(winRateData)
    
                    let matchupApiUrl = `/api/matchups/${id}`
                    if (props.roles?.admin) matchupApiUrl += '&isAdmin=true'
                    if (props.roles?.subscriber) matchupApiUrl += '&isSubscriber=true'
                    if (format) matchupApiUrl += `?format=${format}`
    
                    const {data: matchupData} = await axios.get(matchupApiUrl, {
                        headers: {
                            ...(accessToken && {authorization: `Bearer ${accessToken}`})
                        }
                    })
    
                    setMatchups(matchupData)
                }


                if (summaryData?.format) {
                    const {data: banlistData} = await axios.get(`/api/banlists/cards/${summaryData?.format?.banlist}?category=${summaryData?.format?.category || 'TCG'}`)
                    setBanList(banlistData)
                }
            } catch (err) {
                console.log(err)
                setSummary(null)
            }
        }

        fetchData()
    }, [id, format, props.roles])

    if (!summary) return <NotFound/>
    if (!summary?.deckType) return <div style={{height: '100vh'}}/>
  
    const categoryImage = summary.deckCategory === 'Aggro' ? emojis.Helmet :
      summary.deckCategory === 'Combo' ? Controller :
      summary.deckCategory === 'Control' ? Orb :
      summary.deckCategory === 'Lockdown' ? Lock :
      summary.deckCategory === 'Multiple' ? Unicorn :
      summary.deckCategory === 'Stun' ? Voltage :
      summary.deckCategory === 'Midrange' ? Bow :
      summary.deckCategory === 'Ramp' ? Volcano :
      Thinking
  
    // const addDownload = async () => {
    //   const downloads = summary.downloads++
    //   setSummary({downloads, ...deck})
    // }
  
    const toggle = (category, index) => {
      let info = document.getElementById(`${category}-info-${index}`)
      let details = document.getElementById(`${category}-details-${index}`)
      
      if (getComputedStyle(details).display === "none") {
        details.style.display = "block"
      } else {
        details.style.display = "none"
      }
  
      if (getComputedStyle(info).display === "none") {
        info.style.display = "block"
      } else {
        info.style.display = "none"
      } 
    }
  
    return (
        <>
            <Helmet>
                <title>{`${summary.deckType} Deck - Yu-Gi-Oh! ${summary?.format?.name} Format - Format Library`}</title>
                <meta name="og:title" content={`${summary.deckType} Deck - Yu-Gi-Oh! ${summary?.format?.name} Format - Format Library.`}/>
                <meta name="description" content={`Example decklists and detailed breakdown of cards used in ${summary.deckType} decks for Yu-Gi-Oh!'s ${summary?.format?.name} Format.`}/>
                <meta name="og:description" content={`Example decklists and detailed breakdown of cards used in ${summary.deckType} decks for Yu-Gi-Oh!'s ${summary?.format?.name} Format.`}/>
            </Helmet>
            {
                // videoPlaylistId ? <div className="adthrive-content-specific-playlist" data-playlist-id={videoPlaylistId}></div> :
                <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            }
            <div className="body">
                <div className="single-decktype-title-flexbox">
                    <a
                        className="link desktop-only"
                        href={`/api/decktypes/download?id=${id}&format=${format}`} 
                        download={`${summary.deckType} - ${capitalize(format)} Skeleton.ydk`}
                        // onClick={()=> addDownload()}
                    >                                    
                        <div className="deck-button">
                            <b style={{padding: '0px 6px'}}>Download</b>
                            <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/download.png`} alt="download"/>
                        </div>
                    </a>
                    <div className="single-decktype-title">{summary.deckType}</div>
                    <Link to="/deck-builder" state={{ deck: {name: summary.deckType, formatName: summary.format?.name}, skeleton: `/api/decktypes/download?id=${id}&format=${format}` }} className="desktop-only">                                    
                        <div className="deck-button">
                            <b style={{padding: '0px 6px'}}>Open Deck</b>
                            <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/open-file.png`} alt="open-file"/>
                        </div>
                    </Link>
                </div>
                <table className="single-decktype-table">
                    <tbody>
                        <tr className="single-decktype-info-1">
                            <td>
                                <div onClick={() => {window.location.href=`/formats/${summary.format?.name ? urlize(summary.format.name) : ''}`}} className="single-decktype-cell">
                                <div className="single-decktype-format-link" style={{paddingRight:'7px'}}><b>Format:</b> {summary.format?.name}</div>
                                <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/${summary.format?.icon}.png`} alt="format-icon"/>
                                </div>       
                            </td>
                            <td className='desktop-only'>
                                <div className="single-decktype-cell">
                                <div className="single-decktype-category" style={{paddingRight:'7px'}}><b>Category:</b> {summary.deckCategory}</div>
                                <img className="single-decktype-category-emoji" style={{width:'28px'}} src={categoryImage} alt={summary.deckCategory}/>
                                </div>
                            </td>
                            <td>
                                <div className="single-decktype-cell">
                                <div className="single-decktype-category" style={{paddingRight:'7px'}}><b>Frequency:</b> {summary.percent}%</div>
                                <img className="single-decktype-category-emoji" style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/math.png`} alt="calculator"/>
                                </div>
                            </td>
                        </tr>
                        
                            {
                                winRateData.overallWinRate || winRateData.tournamentWinRate || winRateData.conversionRate ? (
                                    <tr className="single-decktype-info-2">
                                        <td>
                                            <div className="single-decktype-cell">
                                            <div className="single-decktype-category" style={{paddingRight:'7px'}}><b>Overall Win Rate:</b> {winRateData.overallWinRate ? `${winRateData.overallWinRate}%` : 'N/A'}</div>
                                            <img className="single-decktype-category-emoji" style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/abacus.png`} alt="abacus"/>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="single-decktype-cell">
                                            <div className="single-decktype-category" style={{paddingRight:'7px'}}><b>Conversion Rate:</b> {winRateData.conversionRate ? `${winRateData.conversionRate}%` : 'N/A'}</div>
                                            <img className="single-decktype-category-emoji" style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/microscope.png`} alt="microscope"/>
                                            </div>
                                        </td>
                                        <td className='desktop-only'>
                                            <div className="single-decktype-cell">
                                            <div className="single-decktype-category" style={{paddingRight:'7px'}}><b>Tournament Win Rate:</b> {winRateData.tournamentWinRate ? `${winRateData.tournamentWinRate}%` : 'N/A'}</div>
                                            <img className="single-decktype-category-emoji" style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/1st.png`} alt="1st.png"/>
                                            </div>
                                        </td>
                                    </tr>
                                ) : ''
                            }
                        
                    </tbody>
                </table>
        
                <div className="popular-cards">
                    <h2>Popular Main Deck Cards</h2>
                    <div id="main" className="decktype-bubble">
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
                                <div className="popular-main" key={'m' + data.card.artworkId}>
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
                                <div className="popular-main" key={'m' + data.card.artworkId} >
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
                                <div className="popular-main" key={'m' + data.card.artworkId} >
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
            
                    <div>
                        {
                        summary.extraMonsters?.length ? (
                            <>
                            <br/>
                            <h2>Popular Extra Deck Cards</h2>
                            <div id="extra" className="decktype-bubble">
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
                                        <div className="popular-side" key={'e' + data.card.artworkId} >
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
                        <div id="side" className="decktype-bubble">
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
                                    <div className="popular-side" key={'s' + data.card.artworkId} >
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
                                    <div className="popular-side" key={'s' + data.card.artworkId}>
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
                                    <div className="popular-side" key={'s' + data.card.artworkId}>
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
                    </div>
                </div>
                
                <div className="decktype-example-decks">
                {   
                    summary.examples ? (
                        <div id="top-decks">
                            <div className="subcategory-title-flexbox">
                                <img 
                                    style={{ width:'64px'}} 
                                    src={`https://cdn.formatlibrary.com/images/emojis/${summary.format.icon}.png`}
                                    alt={format.name}
                                />
                                <h2 className="subheading">{summary.examples[1] ? 'Example Decks:' : 'Example Deck:'}</h2>
                                <img 
                                    style={{ height:'64px'}} 
                                    src={'https://cdn.formatlibrary.com/images/emojis/deckbox.png'}
                                    alt="deckbox"
                                />
                                </div>
                                <div id="deckGalleryFlexBox">
                                {
                                    summary.examples.map((deck, index) => {
                                        if (deck) {
                                            return (<div className="vertical-flexbox"><h3>{index === 0 ? 'Most Popular:' : 'Recent Top:'}</h3><
                                                DeckImage
                                                key={deck.id}
                                                index={index} 
                                                deck={deck}
                                                width="100%"
                                                margin="10px 1px"
                                                padding="1px"
                                                coverage={true}
                                            /></div>)
                                        } else {
                                            return ''
                                        }
                                    })
                                }
                            </div>
                        </div>
                    ) : ''
                }
                </div>
                {
                    Object.entries(matchups).length ? (
                        <div className={"desktop-only"}>
                            <br/>
                            <h2>Matchups</h2>
                            <div className="matchup-box">
                            {
                                Object.entries(matchups).filter((m) => m[1].total >= 6).sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total)).map((m) => <Matchup deckType={m[0]} wins={m[1].wins} losses={m[1].losses} total={m[1].total} format={format || summary.formatName}/>)
                            }
                            </div>
                        </div>
                    ) : (
                        <div className="desktop-only matchups">
                            <br/>
                            <h2>Matchups</h2>
                            <div className="horizontal-centered-flexbox">
                                <div className="matchup-box-preview"/>
                            </div>
                            <div className="horizontal-centered-flexbox" style={{"padding": "0.2em 0.2em 0.6em"}}>
                                <div><i>This matchup data is for paid subscribers.</i></div>
                            </div>
                            <div className="horizontal-centered-flexbox">
                            {
                                playerId ? (
                                    <a href="/subscribe">
                                        <h1 id="subscribe" className="nav-header">SUBSCRIBE</h1>
                                    </a>
                                ) : (
                                    <a href="/auth/login" onClick={() => alert('Please log-in before subscribing.')}>
                                        <h1 id="subscribe" className="nav-header">SUBSCRIBE</h1>
                                    </a>   
                                )
                            }
                            </div>
                        </div>
                    )
                }
            </div>
        </>
    )
}
