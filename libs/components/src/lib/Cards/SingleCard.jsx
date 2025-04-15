/* eslint-disable max-statements */

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useMediaQuery } from 'react-responsive'
import { NotFound } from '../General/NotFound'
import { PrintRow } from './PrintRow'
import { StatusBox } from './StatusBar'
import { capitalize, dateToSimple, dateToVerbose, getEraVideoPlaylistId, camelize } from '@fl/utils'
import { Line } from 'react-chartjs-2';
import { Helmet } from 'react-helmet'
import './SingleCard.css'
import banlists from '../../data/banlists.json'
import { Chart as ChartJS, LineElement, PointElement, TimeScale } from 'chart.js'
import 'chartjs-adapter-moment'
ChartJS.register(LineElement, PointElement, TimeScale)

// USE TAB VISIBILITY
const useTabVisibility = () => {
    const [isTabVisible, setIsTabVisible] = useState(document.visibilityState === 'visible')
  
    const handleVisibilityChange = useCallback(() => {
      setIsTabVisible(document.visibilityState === 'visible')
    }, [])
  
    useEffect(() => {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }, [handleVisibilityChange])
  
    return isTabVisible
}

// SINGLE CARD COMPONENT
export const SingleCard = (props) => {
    const tabIsVisible = useTabVisibility()
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' })
    const isAdmin = props.roles?.admin
    const isContentManager = props.roles?.contentManager
    const [inEditMode, setInEditMode] = useState(false)
    const [print, setPrint] = useState({})
    const [data, setData] = useState({
        card: {},
        statuses: {},
        prints: [],
        rulings: {}
    })

    const [prices, setPrices] = useState({
        labelsArr: [],
        pricesArr: []
    })
    
    const raritySymbol = prices.rarity === '10000 Secret Rare' ? 'tenThousandSecretRare' : camelize(prices.rarity || '')

    const { card, statuses, prints, rulings } = data || {}
    const { id } = useParams()
    // const videoPlaylistId = getEraVideoPlaylistId(card?.tcgDate)

    // USE EFFECT
    useEffect(() => window.scrollTo(0, document.getElementById('body')?.offsetTop), [inEditMode])

    // DOWNLOAD CARD IMAGE
    const downloadCardImage = async () => {
        try {
            const {data:{success}} = await axios.post(`/api/images/update-card?artworkId=${card.artworkId || card.id}`)
            if (success) alert(`Success! New Image: /images/cards/${card.artworkId}`)
        } catch (err) {
            console.log(err)
        }
    }

    // UPDATE CARD INFO
    const updateCard = async () => {
        try {
            await axios.post(`/api/cards/update?id=${card.id}`, { ...card })
            setInEditMode(false)
        } catch (err) {
            console.log(err)
        }
    }
    
    // UPDATE RULING
    const updateRuling = async (rulingId) => {
        try {
            const content = document.getElementById(`ruling-${rulingId}`)?.value
            if (content) await axios.post(`/api/rulings/update?id=${rulingId}`, { content })
        } catch (err) {
            console.log(err)
        }
    }

    // DELETE RULING
    const deleteRuling = async (rulingId, isGeneric, key) => {
        try {
            await axios.delete(`/api/rulings/delete?id=${rulingId}`)
            if (isGeneric) {
                setData({ ...data, rulings: { ...rulings, generic: rulings.generic.filter((e) => e.id !== rulingId)} })
            } else {
                setData({ ...data, rulings: { ...rulings, specific: { ...rulings.specific, [key]: rulings.specific.filter((e) => e.id !== rulingId)}}})
            }
        } catch (err) {
            console.log(err)
        }
    }
    
    // USE EFFECT SET CARD
    useEffect(() => {
        const fetchData = async () => {
            try {
                const {data: cardData} = await axios.get(`/api/cards/${id}`)
                setData(cardData)
            } catch (err) {
                console.log(err)
                setData({})
            }
        }
  
        fetchData()
    }, [id])

    // USE EFFECT SET CARD
    useEffect(() => {
        if (!tabIsVisible || !print.id && !data.prints[0]?.id) return
        const fetchData = async () => {
            try {
                const {data: priceData} = await axios.get(`/api/prices/${print.id || data.prints[0]?.id}`)
                setPrices(priceData)
            } catch (err) {
                console.log(err)
                setData({})
            }
        }
  
        fetchData()
    }, [data.prints, print, tabIsVisible])

    // UPDATE PRINT
    const updatePrint = (e) => {
        const p = prints.find((p) => p.id === Number(e.target.value)) || {}
        setPrint(p)
    }
  
    if (data === null) return <NotFound/>
    if (!card?.id) return <div style={{height: '100vh'}}/>
  
    const template = card.category === 'Spell' ? `https://cdn.formatlibrary.com/images/templates/spellCard.png` :
      card.category === 'Trap' ? `https://cdn.formatlibrary.com/images/templates/trapCard.jpeg` :
      card.isFusion ? `https://cdn.formatlibrary.com/images/templates/fusionCard.jpg` :
      card.isRitual ? `https://cdn.formatlibrary.com/images/templates/ritualCard.jpg` :
      card.isSynchro ? `https://cdn.formatlibrary.com/images/templates/synchroCard.png` :
      card.isXyz ? `https://cdn.formatlibrary.com/images/templates/xyzCard.png` :
      card.isPendulum ? `https://cdn.formatlibrary.com/images/templates/pendulumCard.png` :
      card.link ? `https://cdn.formatlibrary.com/images/templates/isLinkCard.png` :
      card.isNormal ? `https://cdn.formatlibrary.com/images/templates/monsterCard.jpg` :
      card.isEffect ? `https://cdn.formatlibrary.com/images/templates/effectCard.png` :
      null
  
    const attribute = card.attribute ? `https://cdn.formatlibrary.com/images/symbols/${card.attribute.toLowerCase()}.png` : null
    const type = card.type ? `https://cdn.formatlibrary.com/images/symbols/${card.type.replace(/\s/g, '-').toLowerCase()}.png` : null
    
    const starWord = card.isXyz ? `Rank` : 
      card.isLink ? `Link` : 
      card.category === 'Monster' ? `Level` : 
      null
  
    const starType = `https://cdn.formatlibrary.com/images/symbols/${starWord?.toLowerCase()}.png`
    const icon = `https://cdn.formatlibrary.com/images/symbols/${card.icon?.toLowerCase()}.png`
  
    const classes = [card.category]
    if (card.isFusion) classes.push('Fusion')
    if (card.isRitual) classes.push('Ritual')
    if (card.isSynchro) classes.push('Synchro')
    if (card.isXyz) classes.push('Xyz')
    if (card.pendulum) classes.push('Pendulum')
    if (card.isLink) classes.push('Link')
    if (card.isGemini) classes.push('Gemini')
    if (card.isFlip) classes.push('Flip')
    if (card.isSpirit) classes.push('Spirit')
    if (card.isToon) classes.push('Toon')
    if (card.isTuner) classes.push('Tuner')
    if (card.isUnion) classes.push('Union')
    if (card.isNormal) classes.push('Normal')
    if (card.isEffect) classes.push('Effect')

    const lineData = {
        labels: prices.labelsArr,
        datasets: [
            {
                data: prices.pricesArr,
                borderColor: 'rgb(99, 128, 255)',
                backgroundColor: 'rgb(143, 160, 234)',
                tension: 0.1,
                pointRadius: 1,
                pointHoverRadius: 8
            }
        ]        
    }

    const lineOptions = {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'month',
                    minUnit: 'month',
                    tooltipFormat:'MMMM D, YYYY'
                }
            },
            y: {
                ticks: {
                    callback: (value) => '$' + value.toFixed(2)
                }
            },
            
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
  
    return (
        <>
            <Helmet>
                <title>{`${card.name} - Yu-Gi-Oh! Card - Format Library`}</title>
                <meta name="og:title" content={`${card.name} - Yu-Gi-Oh! Card - Format Library`} />
                <meta name="description" content={card.description}/>
                <meta name="og:description" content={card.description}/>
                <meta name="image" content={`https://cdn.formatlibrary.com/images/artworks/${card.artworkId}.jpg`}/>
                <meta name="og:image" content={`https://cdn.formatlibrary.com/images/artworks/${card.artworkId}.jpg`}/>
            </Helmet>
            {
                // videoPlaylistId ? <div className="adthrive-content-specific-playlist" data-playlist-id={videoPlaylistId}></div> :
                <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            }
            <div className="body">
                <div className="single-card">
                    <div className="vertical-centered-flexbox">
                        <img className="single-card-image" src={`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`} alt={card.name}/>
                        <div className="space-apart" style={{margin: '24px 0px'}}>
                        {
                            isContentManager ? (
                                !inEditMode ? (
                                    <div className="downloadButton" style={{width: '150px'}} onClick={()=> setInEditMode(true)}>Edit Mode</div>
                                ) : (
                                    <div className="downloadButton" style={{width: '150px'}} onClick={()=> updateCard()}>Save Changes</div>
                                )
                            ) : null
                        }
                        {
                            isAdmin ? (
                                <div className="downloadButton" style={{width: '150px'}} onClick={()=> downloadCardImage()}>Update Image</div>
                            ) : null
                        }
                        </div>
                    </div>
                    {
                        !inEditMode ? (
                            card.category === 'Monster' ? (
                                <div className="card-info">
                                    <div className="single-card-title pwk-border-bottom">{card.name}</div>
                                    <div className="card-info-row pwk-border-bottom">
                                        <img className="card-symbol-template" src={template} alt="template"/>
                                        <div>{classes.join(' / ')}</div>
                                    </div>
                                    <div className="card-info-row pwk-border-bottom">
                                        <div className="card-info-cell pwk-border-right padding-right-50">
                                            <img src={attribute} className="card-symbol-standard" alt={card.attribute}/>
                                            <div>{card.attribute}</div>
                                        </div>
                                        <div className="card-info-cell padding-left-50">
                                            <img src={type} className="card-symbol-standard" alt={card.type?.replace(/\s/g, '-')?.toLowerCase()}/>
                                            <div>{card.type}</div>
                                        </div>
                                    </div>
                                    <div className="pwk-border-bottom">
                                        <div className="single-card-description-label">Description:</div>
                                        <div className="single-card-description-box">
                                        {
                                            card.pendulumEffect && card.isNormal ? 'Pendulum Effect:\n' + card.pendulumEffect + '\n\nFlavor Text:\n' + <i>card.description</i> :
                                            card.pendulumEffect && !card.isNormal ? 'Pendulum Effect:\n' + card.pendulumEffect + '\n\nMonster Effect:\n' + card.description :
                                            card.isNormal ? <i>{card.description}</i> :
                                            card.description
                                        }
                                        </div>
                                    </div>
                                    <div className="card-info-row pwk-border-bottom">
                                        <div className="card-info-cell pwk-border-right">
                                            <img src={starType} className="card-symbol-standard" alt={starType}/>
                                            {
                                                isMobile ? (
                                                    <div style={{padding: '12px 8px'}}>{card.level || card.rating}</div>
                                                ) : (
                                                    <div>{starWord} {card.level || card.rating}</div>
                                                )
                                            }
                                        </div>
                                        <div className="card-info-cell pwk-border-right">
                                            <img src="https://cdn.formatlibrary.com/images/emojis/swords.png" className="card-symbol-standard" alt="sword"/>
                                            {
                                                isMobile ? (
                                                    <div style={{padding: '12px 8px'}}>{card.atk}</div>
                                                ) : (
                                                    <div>ATK: {card.atk}</div>
                                                )
                                            }
                                        </div>
                                        <div className="card-info-cell">
                                            <img src="https://cdn.formatlibrary.com/images/emojis/shield.png" className="card-symbol-standard" alt="shield"/>
                                            {
                                                isMobile ? (
                                                    <div style={{padding: '12px 8px'}}>{card.def}</div>
                                                ) : (
                                                    <div>DEF: {card.def}</div>
                                                )
                                            }
                                        </div>
                                    </div>
                                    <div className="release-dates-row">
                                        <div>
                                        {
                                            isMobile ? (
                                                `TCG: ${dateToSimple(card.tcgDate)}`
                                            ) : (
                                                `TCG Release: ${dateToVerbose(card.tcgDate)}`
                                            )
                                        }
                                        </div>
                                        <div>
                                        {
                                            isMobile ? (
                                                `OCG: ${dateToSimple(card.ocgDate)}`
                                            ) : (
                                                `OCG Release: ${dateToVerbose(card.ocgDate)}`
                                            )
                                        }
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card-info">
                                    <div className="single-card-title pwk-border-bottom">{card.name}</div>
                                    <div className="card-info-row pwk-border-bottom">
                                        <div className="card-info-cell pwk-border-right padding-right-50">
                                            <img src={template} className="card-symbol-template" alt="template"/>
                                            <div>{card.category}</div>
                                        </div>
                                        <div className="card-info-cell padding-left-50">
                                            <img src={icon} className="card-symbol-standard" alt={card.icon}/>
                                            <div>{card.icon}</div>
                                        </div>
                                    </div>
                                    <div className="pwk-border-bottom">
                                        <div className="single-card-description-label">Description:</div>
                                        <div className="single-card-description-box">{card.description}</div>
                                    </div>
                                    <div className="release-dates-row">
                                        <div>
                                        {
                                            isMobile ? (
                                                `TCG: ${dateToSimple(card.tcgDate)}`
                                            ) : (
                                                `TCG Release: ${dateToVerbose(card.tcgDate)}`
                                            )
                                        }
                                        </div>
                                        <div>
                                        {
                                            isMobile ? (
                                                `OCG: ${dateToSimple(card.ocgDate)}`
                                            ) : (
                                                `OCG Release: ${dateToVerbose(card.ocgDate)}`
                                            )
                                        }
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : (
                            card.category === 'Monster' ? (
                                <div className="card-info">
                                    <div className="single-card-title pwk-border-bottom">
                                        <input
                                            id="name"
                                            className="large-input"
                                            defaultValue={card.name || ''}
                                            type="text"
                                            onChange={(e) => {
                                                const cleanName = e.target.value.replaceAll(/['"]/g, '').split(/[^A-Za-z0-9]/).filter((e) => e.length).join(' ')
                                                setData({...data, card:{ ...card, cleanName, name: e.target.value }})
                                            }}
                                        />
                                    </div>
                                    <div className="card-info-row pwk-border-bottom">
                                        <img className="card-symbol-template" src={template} alt="template"/>
                                        <div>
                                            <input
                                                id="card-type"
                                                className="medium-input"
                                                defaultValue={classes.join(' / ') || ''}
                                                type="text"
                                                onChange={(e) => {
                                                    const items = e.target.value.split('/').map((item) => item.trim().toLowerCase())
                                                    const data = {}
                                                    const category = capitalize(items[0])
                                                    items.slice(1).forEach((item) => data[item] = true)
                                                    setData({ ...data, card: { 
                                                        ...card, 
                                                        category,
                                                        isNormal: false,
                                                        isEffect: false,
                                                        isFusion: false,
                                                        isRitual: false,
                                                        isSynchro: false,
                                                        isXyz: false,
                                                        isPendulum: false,
                                                        isLink: false,
                                                        isFlip: false,
                                                        isGemini: false,
                                                        isSpirit: false,
                                                        isToon: false,
                                                        isTuner: false,
                                                        isUnion: false,
                                                        ...data 
                                                    }})
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="card-info-row pwk-border-bottom">
                                        <div className="card-info-cell pwk-border-right padding-right-50">
                                            <img src={attribute} className="card-symbol-standard" alt={card.attribute}/>
                                            <div>
                                                <input
                                                    id="attribute"
                                                    className="medium-input"
                                                    defaultValue={card.attribute || ''}
                                                    type="text"
                                                    onChange={(e) => setData({ ...data, card: { ...card, attribute: e.target.value.toUpperCase() }})}
                                                />
                                            </div>
                                        </div>
                                        <div className="card-info-cell padding-left-50">
                                            <img src={type} className="card-symbol-standard" alt={card.type?.replace(/\s/g, '-')?.toLowerCase()}/>
                                            <div>
                                                <input
                                                    id="type"
                                                    className="medium-input"
                                                    defaultValue={card.type || ''}
                                                    type="text"
                                                    onChange={(e) => setData({ ...data, card: { ...card, type: capitalize(e.target.value.toLowerCase(), true) }})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pwk-border-bottom">
                                        <div className="single-card-description-label">Description:</div>
                                        <div className="single-card-description-box">
                                        {
                                            card.isPendulum ? 'Pendulum Effect:\n' + (
                                                <textarea
                                                    id="pendulum-effect"
                                                    className="description-input"
                                                    defaultValue={card.pendulumEffect || ''}
                                                    type="text"
                                                    onChange={(e) => setData({ ...data, card: { ...card, pendulumEffect: e.target.value }})}
                                                />
                                            ) + '\n\nMonster Effect / Flavor Text:\n' + (
                                                <textarea
                                                    id="type"
                                                    className="description-input"
                                                    defaultValue={card.description || ''}
                                                    type="text"
                                                    onChange={(e) => setData({...data, card: { ...card, description: e.target.value }})}
                                                />
                                            ) : (
                                                <textarea
                                                    id="description"
                                                    className="description-input"
                                                    defaultValue={card.description || ''}
                                                    type="text"
                                                    onChange={(e) => setData({...data, card: { ...card, description: e.target.value }})}
                                                />
                                            )
                                        }
                                        </div>
                                    </div>
                                    <div className="card-info-row pwk-border-bottom">
                                        <div className="card-info-cell pwk-border-right">
                                            <img src={starType} className="card-symbol-standard" alt={starType}/>
                                            <div>
                                                {starWord}
                                                <input
                                                    id="level"
                                                    className="small-input"
                                                    defaultValue={card.level || card.rating || ''}
                                                    type="text"
                                                    onChange={(e) => {
                                                        if (card.level) {
                                                            setData({...data, card:{ ...card, level: parseInt(e.target.value) }})
                                                        } else if (card.rating) {
                                                            setData({...data, card:{ ...card, rating: parseInt(e.target.value) }})
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="card-info-cell pwk-border-right">
                                            <img src="https://cdn.formatlibrary.com/images/emojis/swords.png" className="card-symbol-standard" alt="sword"/>
                                            <div>
                                                ATK:
                                                <input
                                                    id="atk"
                                                    className="small-input"
                                                    defaultValue={`${card.atk}`}
                                                    type="text"
                                                    onChange={(e) => setData({...data, card:{ ...card, atk: parseInt(e.target.value) }})}
                                                />
                                            </div>
                                        </div>
                                        <div className="card-info-cell">
                                            <img src="https://cdn.formatlibrary.com/images/emojis/shield.png" className="card-symbol-standard" alt="shield"/>
                                            <div>
                                                DEF:
                                                <input
                                                    id="def"
                                                    className="small-input"
                                                    defaultValue={`${card.def}`}
                                                    type="text"
                                                    onChange={(e) => setData({...data, card:{ ...card, def: parseInt(e.target.value) }})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="release-dates-row">
                                        <div>
                                            TCG Release: {dateToVerbose(card.tcgDate, false, false)}
                                        </div>
                                        <div>
                                            OCG Release: {dateToVerbose(card.ocgDate, false, false)}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card-info">
                                    <div className="single-card-title pwk-border-bottom">
                                        <input
                                            id="name"
                                            className="large-input"
                                            defaultValue={card.name || ''}
                                            type="text"
                                            onChange={(e) => {
                                                const cleanName = e.target.value.replaceAll(/['"]/g, '').split(/[^A-Za-z0-9]/).filter((e) => e.length).join(' ')
                                                setData({...data, card:{ ...card, cleanName, name: e.target.value }})
                                            }}
                                        />
                                    </div>
                                    <div className="card-info-row pwk-border-bottom">
                                        <div className="card-info-cell pwk-border-right padding-right-50">
                                            <img src={template} className="card-symbol-template" alt="template"/>
                                            <div>
                                                <input
                                                    id="category"
                                                    className="medium-input"
                                                    defaultValue={card.category}
                                                    type="text"
                                                    onChange={(e) => setData({...data, card:{ ...card, category: capitalize(e.target.value.toLowerCase(), true) }})}
                                                />
                                            </div>
                                        </div>
                                        <div className="card-info-cell padding-left-50">
                                            <img src={icon} className="card-symbol-standard" alt={card.icon}/>
                                            <div>
                                                <input
                                                    id="icon"
                                                    className="medium-input"
                                                    defaultValue={card.icon}
                                                    type="text"
                                                    onChange={(e) => setData({...data, card:{ ...card, icon: capitalize(e.target.value.toLowerCase(), true) }})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pwk-border-bottom">
                                        <div className="single-card-description-label">Description:</div>
                                        <div className="single-card-description-box">
                                            <textarea
                                                id="description"
                                                className="description-input"
                                                defaultValue={card.description || ''}
                                                type="text"
                                                onChange={(e) => setData({...data, card:{ ...card, description: e.target.value }})}
                                            />
                                        </div>
                                    </div>
                                    <div className="release-dates-row">
                                        <div>
                                            TCG Release: {dateToVerbose(card.tcgDate, false, false)}
                                        </div>
                                        <div>
                                            OCG Release: {dateToVerbose(card.ocgDate, false, false)}
                                        </div>
                                    </div>
                                </div>
                            )
                        )
                    }
                </div>
                {
                    !inEditMode ? (
                        <div className="status-flexbox">
                            <h2>TCG Status History</h2>
                            <div className="status-box">
                                {banlists.map(([banlist, date]) => {
                                    const status = statuses[banlist] ? statuses[banlist] : card.tcgDate < date ? 'unlimited' : null
                                    return <StatusBox key={banlist} banlist={banlist} status={status}/>
                                })}
                            </div>
                        </div>
                    ) : null
                }
                <div className="horizontal-centered-flexbox space-evenly">
                {
                    prices.pricesArr?.length ? (
                        <div className="line-chart-container vertical-centered-flexbox">
                            <h2 style={{marginBottom: '10px'}}>Price History</h2>
                            <div className="horizontal-centered-flexbox" style={{alignItems: 'center'}}>
                                <div>{prices.edition}</div>
                                <div className="rarity-cell" style={{backgroundImage: `url(https://cdn.formatlibrary.com/images/rarities/${raritySymbol}.png)`, height: '28px', margin: '0px 3px'}}/>
                                {
                                    isMobile ? (<div>{prices.mobileTitle}</div>) : (<div>{prices.desktopTitle}</div>)
                                }   
                            </div>
                            <br/>
                            <Line 
                                className="line-chart"
                                type="line"
                                normalized={true}
                                animation={false}
                                data={lineData}
                                options={lineOptions}
                            />
                            <select
                                id="print"
                                // value={`${print.rarity} - ${print.cardCode}  ${print.cardName}`}
                                style={{maxWidth: '35vw', margin: '10px 0px'}}
                                className="filter"
                                onChange={(e) => updatePrint(e)}
                            >
                                {
                                    prints?.map((p) => <option key={p.id} value={p.id}>{`${p.rarity} - ${p.cardCode} - ${p.cardName}`}</option>)
                                }
                            </select>
                        </div>
                    ) : null
                }
                </div>
                {
                    prints?.length && !inEditMode ? (
                        <div className="prints-flexbox vertical-centered-flexbox">
                            <h2>Prints</h2>
                            <div>Click to purchase on TCGplayer and support Format Library!</div>
                            <div className="print-box">
                            <table>
                                <tbody>
                                {prints?.map((print, index) => <PrintRow key={print.id} index={index} print={print}/>)}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    ) : null
                }
                {
                    rulings?.generic?.length && !inEditMode ? (
                        <div className="rulings-flexbox">
                            <div>Generic Rulings:</div>
                            <div>
                                {rulings.generic.map((ruling) => <li className="ruling" key={ruling.id}>{ruling.content}</li>)}
                            </div>
                            <br/>
                        </div>
                    ) : rulings?.generic?.length && inEditMode && isAdmin ? (
                        <div className="rulings-flexbox">
                            <div>Generic Rulings:</div>
                            <div>
                                {rulings.generic.map((ruling) => (
                                    <div className="ruling-editor-flexbox" key={ruling.id}>
                                        <div className="ruling" style={{width: '80%'}}>   
                                            <textarea
                                                id={`ruling-${ruling.id}`}
                                                className="description-input"
                                                defaultValue={ruling.content}
                                                type="text"
                                            />
                                        </div>
                                        <div className="delete-button" onClick={() => updateRuling(ruling.id)}>UPDATE</div>
                                        <div className="delete-button" onClick={() => deleteRuling(ruling.id, true, 'generic')}>DELETE</div>
                                    </div>
                                ))}
                            </div>
                            <br/>
                        </div>
                    ) : null
                }
                {
                    rulings?.specific && Object.keys(rulings?.specific).length && !inEditMode ? (
                        Object.entries(rulings.specific).map((entry) => {
                            return (
                                <div className="rulings-flexbox">
                                    <div>{entry[0] + ' Rulings:'}</div>
                                    {
                                        entry[1].map((ruling) => (
                                            <li className="ruling" key={ruling.id}>
                                                {ruling.content}
                                            </li>
                                        ))
                                    }
                                    <br/>
                                </div>
                            )
                        })
                    ) : rulings?.specific && Object.keys(rulings?.specific).length && inEditMode && isAdmin ? (
                        Object.entries(rulings.specific).map((entry) => {
                            return (
                                <div className="rulings-flexbox">
                                    <div>{entry[0] + ' Rulings:'}</div>
                                    {
                                        entry[1].map((ruling) => (
                                            <div className="ruling-editor-flexbox" key={ruling.id}>
                                                <div className="ruling" style={{width: '80%'}}>   
                                                    <textarea
                                                        id={`ruling-${ruling.id}`}
                                                        className="description-input"
                                                        defaultValue={ruling.content}
                                                        type="text"
                                                    />
                                                </div>
                                                <div className="delete-button" onClick={() => updateRuling(ruling.id)}>UPDATE</div>
                                                <div className="delete-button" onClick={() => deleteRuling(ruling.id, false, entry[0])}>DELETE</div>
                                            </div>
                                        ))
                                    }
                                    <br/>
                                </div>
                            )
                        })
                    ) : null
                }
            </div>
        </>
    )
}
