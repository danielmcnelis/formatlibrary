/* eslint-disable max-statements */

import { useState, useEffect, useLayoutEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { NotFound } from '../General/NotFound'
import { PrintRow } from './PrintRow'
import { StatusBox } from './StatusBar'
import { capitalize, dateToVerbose, getCookie } from '@fl/utils'
import { Helmet } from 'react-helmet'
import './SingleCard.css'

const banlists = [
  ['May 2002', '2002-05-07'],
  ['July 2002', '2002-07-01'],
  ['October 2002', '2002-10-01'],
  ['December 2002', '2002-12-01'],
  ['April 2003', '2003-04-01'],
  ['May 2003', '2003-05-08'],
  ['July 2003', '2003-07-08'],
  ['August 2003', '2003-08-25'],
  ['November 2003', '2003-11-17'],
  ['February 2004', '2004-02-02'],
  ['April 2004', '2004-04-19'],
  ['October 2004', '2004-10-01'],
  ['April 2005', '2005-04-01'],
  ['October 2005', '2005-10-01'],
  ['April 2006', '2006-04-01'],
  ['September 2006', '2006-09-01'],
  ['March 2007', '2007-03-01'],
  ['June 2007', '2007-06-01'],
  ['September 2007', '2007-09-01'],
  ['March 2008', '2008-03-01'],
  ['May 2008', '2008-05-09'],
  ['September 2008', '2008-09-01'],
  ['March 2009', '2009-03-01'],
  ['September 2009', '2009-09-01'],
  ['March 2010', '2010-03-01'],
  ['September 2010', '2010-09-01'],
  ['March 2011', '2011-03-01'],
  ['September 2011', '2011-09-01'],
  ['March 2012', '2012-03-01'],
  ['September 2012', '2012-09-01'],
  ['March 2013', '2013-03-01'],
  ['September 2013', '2013-09-01'],
  ['October 2013', '2013-10-11'],
  ['January 2014', '2014-01-01'],
  ['April 2014', '2014-04-01'],
  ['July 2014', '2014-07-14'],
  ['October 2014', '2014-10-01'],
  ['January 2015', '2015-01-01'],
  ['April 2015', '2015-04-01'],
  ['July 2015', '2015-07-16'],
  ['November 2015', '2015-11-09'],
  ['February 2016', '2016-02-08'],
  ['April 2016', '2016-04-11'],
  ['August 2016', '2016-08-29'],
  ['March 2017', '2017-03-31'],
  ['June 2017', '2017-06-12'],
  ['September 2017', '2017-09-18'],
  ['November 2017', '2017-11-06'],
  ['February 2018', '2018-02-05'],
  ['May 2018', '2018-05-21'],
  ['September 2018', '2018-09-17'],
  ['December 2018', '2018-12-03'],
  ['January 2019', '2019-01-28'],
  ['April 2019', '2019-04-29'],
  ['July 2019', '2019-07-15'],
  ['October 2019', '2019-10-14'],
  ['January 2020', '2020-01-20'],
  ['April 2020', '2020-04-01'],
  ['June 2020', '2020-06-15'],
  ['September 2020', '2020-09-14'],
  ['December 2020', '2020-12-15'],
  ['March 2021', '2021-03-15'],
  ['July 2021', '2021-07-01'],
  ['October 2021', '2021-10-01'],
  ['February 2022', '2022-02-07'],
  ['May 2022', '2022-05-17'],
  ['October 2022', '2022-10-03'],
  ['December 2022', '2022-12-01'],
  ['February 2023', '2023-02-13'],
  ['June 2023', '2023-06-05'],
  ['September 2023', '2023-09-25'],
  ['January 2024', '2024-01-01']
]

const playerId = getCookie('playerId')

export const SingleCard = () => {
    const [isAdmin, setIsAdmin] = useState(false)
    const [isContentManager, setIsContentManager] = useState(false)
    const [inEditMode, setInEditMode] = useState(false)
    const [card, setCard] = useState({})
    const [statuses, setStatuses] = useState({})
    const [prints, setPrints] = useState([])
    const [rulings, setRulings] = useState({})
    const { id } = useParams()

    // USE EFFECT
    useEffect(() => window.scrollTo(0, document.getElementById('body')?.offsetTop), [inEditMode])
  
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

        if (playerId) checkIfAdmin()
    }, [])

    // USE EFFECT
    useEffect(() => {
        const checkIfContentManager = async () => {
            try {
                const { status } = await axios.get(`/api/players/content-manager/${playerId}`)
                if (status === 200) {
                    setIsContentManager(true)
                }
            } catch (err) {
                console.log(err)
            }
        }

        if (playerId) checkIfContentManager()
    }, [])
    
    // DOWNLOAD CARD IMAGE
    const downloadCardImage = async () => {
        try {
            const {data} = await axios.post(`/api/images/update-card?ypdId=${card.ypdId}`)
            if (data.success) alert(`Success! New Image: /images/cards/${card.ypdId}`)
        } catch (err) {
            console.log(err)
        }
    }

    // UPDATE CARD INFO
    const updateCardInfo = async () => {
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
    const deleteRuling = async (rulingId) => {
        try {
            await axios.delete(`/api/rulings/delete?id=${rulingId}`)
            const {data} = await axios.get(`/api/cards/${id}`)
            setRulings(data.rulings)
        } catch (err) {
            console.log(err)
        }
    }
    
    // USE EFFECT SET CARD
    useEffect(() => {
      const fetchData = async () => {
        try {
          const {data} = await axios.get(`/api/cards/${id}`)
          setCard(data.card)
          setStatuses(data.statuses)
          setPrints(data.prints)
          setRulings(data.rulings)
        } catch (err) {
          console.log(err)
          setCard(null)
        }
      }
  
      fetchData()
    }, [id])
  
    if (card === null) return <NotFound/>
    if (!card.id) return <div />
  
    const template = card.category === 'Spell' ? `https://cdn.formatlibrary.com/images/templates/spellCard.png` :
      card.category === 'Trap' ? `https://cdn.formatlibrary.com/images/templates/trapCard.jpeg` :
      card.fusion ? `https://cdn.formatlibrary.com/images/templates/fusionCard.jpg` :
      card.ritual ? `https://cdn.formatlibrary.com/images/templates/ritualCard.jpg` :
      card.synchro ? `https://cdn.formatlibrary.com/images/templates/synchroCard.png` :
      card.xyz ? `https://cdn.formatlibrary.com/images/templates/xyzCard.png` :
      card.pendulum ? `https://cdn.formatlibrary.com/images/templates/pendulumCard.png` :
      card.link ? `https://cdn.formatlibrary.com/images/templates/linkCard.png` :
      card.normal ? `https://cdn.formatlibrary.com/images/templates/monsterCard.jpg` :
      card.effect ? `https://cdn.formatlibrary.com/images/templates/effectCard.png` :
      null
  
    const attribute = card.attribute ? `https://cdn.formatlibrary.com/images/symbols/${card.attribute.toLowerCase()}.png` : null
    const type = card.type ? `https://cdn.formatlibrary.com/images/symbols/${card.type.replace(/\s/g, '-').toLowerCase()}.png` : null
  
    const starType = card.xyz ? `https://cdn.formatlibrary.com/images/symbols/rank.png` : 
      card.link ? `https://cdn.formatlibrary.com/images/symbols/link.png` : 
      card.category === 'Monster' ? `https://cdn.formatlibrary.com/images/symbols/star.png` : 
      null
    
    const starWord = card.xyz ? `Rank` : 
      card.link ? `Link` : 
      card.category === 'Monster' ? `Level` : 
      null
  
    const symbol = card.category === 'Monster' ? null :
      card.icon === 'Continuous' ? `https://cdn.formatlibrary.com/images/symbols/continuous.png` :
      card.icon === 'Field' ? `https://cdn.formatlibrary.com/images/symbols/field.png` : 
      card.icon === 'Ritual' ? `https://cdn.formatlibrary.com/images/symbols/ritual.png` : 
      card.icon === 'Quick-Play' ? `https://cdn.formatlibrary.com/images/symbols/quick-play.png` : 
      card.icon === 'Normal' ? `https://cdn.formatlibrary.com/images/symbols/normal.png` : 
      card.icon === 'Equip' ? `https://cdn.formatlibrary.com/images/symbols/equip.png` :  
      card.icon === 'Counter' ? `https://cdn.formatlibrary.com/images/symbols/counter.png` : 
      null
  
      const imagePath = `https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`
      let cardType = `${card.category}`
      if (card.fusion) cardType += ` / Fusion`
      if (card.ritual) cardType += ` / Ritual`
      if (card.synchro) cardType += ` / Synchro`
      if (card.xyz) cardType += ` / Xyz`
      if (card.pendulum) cardType += ` / Pendulum`
      if (card.link) cardType += ` / Link`
      if (card.gemini) cardType += ` / Gemini`
      if (card.flip) cardType += ` / Flip`
      if (card.spirit) cardType += ` / Spirit`
      if (card.toon) cardType += ` / Toon`
      if (card.tuner) cardType += ` / Tuner`
      if (card.union) cardType += ` / Union`
      if (card.normal) cardType += ` / Normal`
      if (card.effect) cardType += ` / Effect`
  
      return (
        <>
            <Helmet>
                <title>{`${card?.name} - Yu-Gi-Oh! Card - Format Library`}</title>
                <meta name="og:title" content={`${card?.name} - Yu-Gi-Oh! Card - Format Library`} />
                <meta name="description" content={card.description}/>
                <meta name="og:description" content={card.description}/>
                <meta name="image" content={`https://cdn.formatlibrary.com/images/artworks/${card.ypdId}.jpg`}/>
                <meta name="og:image" content={`https://cdn.formatlibrary.com/images/artworks/${card.ypdId}.jpg`}/>
            </Helmet>
            <div className="body" id="body">
                {card.id ? (
                <div>
                    <div className="flexy">
                    <img className="single-card-image" src={imagePath} alt={card.name}/>
                        {
                            !inEditMode ? (
                                <table className="single-card-table">
                                    <thead>
                                    <tr>
                                        <th colSpan="5" className="single-card-title">{card.name}</th>
                                    </tr>
                                    </thead>
                                    {
                                    card.category === 'Monster' ? (
                                        <tbody>
                                            <tr className="single-card-standard-row">
                                                <td className="single-card-symbol-td">
                                                    <img src={template} className="single-card-cardType" alt="card type"/>
                                                </td>
                                                <td colSpan="4" className="single-card-large-label">{cardType}</td>
                                            </tr>
                                            <tr className="single-card-standard-row">
                                                <td className="single-card-symbol-td">
                                                    <img src={attribute} className="single-card-symbol" alt="card symbol"/>
                                                </td>
                                                <td className="single-card-label-inner-td">{card.attribute}</td>
                                                <td className="single-card-symbol-td">
                                                    <img src={type} className="single-card-symbol" alt="card symbol"/>
                                                </td>
                                                <td colSpan="2" className="single-card-label-td">{card.type}</td>
                                            </tr>
                                            <tr style={{ alignContent: 'left', fontSize: '16px', fontStyle: 'italic'}}>
                                                <td className="single-card-description-label" colSpan="5">Description:</td>
                                            </tr>
                                            <tr style={{alignContent: 'left', fontSize: '18px'}}>
                                                <td colSpan="5" className="single-card-description-box">
                                                {
                                                    card.pendulumEffect && card.normal ? 'Pendulum Effect:\n' + card.pendulumEffect + '\n\nFlavor Text:\n' + <i>card.description</i> :
                                                    card.pendulumEffect && !card.normal ? 'Pendulum Effect:\n' + card.pendulumEffect + '\n\nMonster Effect:\n' + card.description :
                                                    card.normal ? <i>{card.description}</i> :
                                                    card.description
                                                }
                                                </td>
                                            </tr>
                                            <tr className="blank-row">
                                            <td colSpan="5">
                                                <div />
                                            </td>
                                            </tr>
                                            <tr className="single-card-bottom-row">
                                            <td id="star-td" className="single-card-symbol-td">
                                                <img src={starType} className="single-card-symbol" alt={starType}/>
                                            </td>
                                            <td id="level-td" colSpan="2" className="single-card-label-inner-td">
                                                {starWord} {card.level || card.rating}
                                            </td>
                                            <td id="atk-td" className="single-card-label-inner-td">
                                                <span>ATK: </span>{card.atk}
                                            </td>
                                            <td id="def-td" className="single-card-label-td"><span>DEF: </span>{card.def}</td>
                                            </tr>
                                            <tr className="single-card-date-row">
                                            <td colSpan="3">
                                                TCG Release: {dateToVerbose(card.tcgDate, false, false)}
                                            </td>
                                            <td colSpan="3">
                                                OCG Release: {dateToVerbose(card.ocgDate, false, false)}
                                            </td>
                                            </tr>
                                        </tbody>
                                    ) : (
                                        <tbody>
                                            <tr className="single-card-standard-row">
                                                <td className="single-card-symbol-td">
                                                    <img src={template} className="single-card-cardType" alt="card type"/>
                                                </td>
                                                <td className="single-card-label-inner-td">
                                                    {card.category}
                                                </td>
                                                <td className="single-card-symbol-td">
                                                    <img src={symbol} className="single-card-symbol" alt="card symbol"/>
                                                </td>
                                                <td colSpan="2" className="single-card-label-td">
                                                    {card.icon}
                                                </td>
                                            </tr>
                                            <tr
                                                style={{
                                                    alignContent: 'left',
                                                    fontSize: '16px',
                                                    fontStyle: 'italic'
                                                }}
                                            >
                                                <td colSpan="5" style={{padding: '20px 0px 0px 10px'}}>
                                                    Description:
                                                </td>
                                            </tr>
                                            <tr style={{alignContent: 'left', fontSize: '18px'}}>
                                                <td colSpan="5" className="single-card-description-box">
                                                    {card.description}
                                                </td>
                                            </tr>
                                            <tr className="blank-row">
                                                <td colSpan="5">
                                                    <div />
                                                </td>
                                            </tr>
                                            <tr className="single-card-date-row">
                                                <td colSpan="3">
                                                    TCG Release: {dateToVerbose(card.tcgDate, false, false)}
                                                </td>
                                                <td colSpan="3">
                                                    OCG Release: {dateToVerbose(card.ocgDate, false, false)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    )}
                                </table>
                            ) : (
                                <table className="single-card-table">
                                    <thead>
                                    <tr>
                                        <th colSpan="5" className="single-card-title">
                                            <input
                                                id="name"
                                                className="large-input"
                                                defaultValue={card.name || ''}
                                                type="text"
                                                onChange={(e) => {
                                                    const cleanName = e.target.value.replaceAll(/['"]/g, '').split(/[^A-Za-z0-9]/).filter((e) => e.length).join(' ')
                                                    setCard({ ...card, cleanName, name: e.target.value })
                                                }}
                                            />
                                        </th>
                                    </tr>
                                    </thead>
                                    {
                                    card.category === 'Monster' ? (
                                        <tbody>
                                            <tr className="single-card-standard-row">
                                                <td className="single-card-symbol-td">
                                                    <img src={template} className="single-card-cardType" alt="card type"/>
                                                </td>
                                                <td colSpan="4" className="single-card-large-label">
                                                    <input
                                                        id="card-type"
                                                        className="medium-input"
                                                        defaultValue={cardType || ''}
                                                        type="text"
                                                        onChange={(e) => {
                                                            const items = e.target.value.split('/').map((item) => item.trim().toLowerCase())
                                                            const data = {}
                                                            const category = capitalize(items[0])
                                                            items.slice(1).forEach((item) => data[item] = true)
                                                            setCard({ 
                                                                ...card, 
                                                                category,
                                                                normal: false,
                                                                effect: false,
                                                                fusion: false,
                                                                ritual: false,
                                                                synchro: false,
                                                                xyz: false,
                                                                pendulum: false,
                                                                link: false,
                                                                flip: false,
                                                                gemini: false,
                                                                spirit: false,
                                                                toon: false,
                                                                tuner: false,
                                                                union: false,
                                                                ...data 
                                                            })
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                            <tr className="single-card-standard-row">
                                                <td className="single-card-symbol-td">
                                                    <img src={attribute} className="single-card-symbol" alt="card symbol"/>
                                                </td>
                                                <td className="single-card-label-inner-td">
                                                    <input
                                                        id="attribute"
                                                        className="medium-input"
                                                        defaultValue={card.attribute || ''}
                                                        type="text"
                                                        onChange={(e) => setCard({ ...card, attribute: e.target.value.toUpperCase() })}
                                                    />
                                                </td>
                                                <td className="single-card-symbol-td">
                                                    <img src={type} className="single-card-symbol" alt="card symbol"/>
                                                </td>
                                                <td colSpan="2" className="single-card-label-td">
                                                    <input
                                                        id="type"
                                                        className="medium-input"
                                                        defaultValue={card.type || ''}
                                                        type="text"
                                                        onChange={(e) => setCard({ ...card, type: capitalize(e.target.value.toLowerCase(), true) })}
                                                    />
                                                </td>
                                            </tr>
                                            <tr style={{ alignContent: 'left', fontSize: '16px', fontStyle: 'italic'}}>
                                                <td className="single-card-description-label" colSpan="5">Description:</td>
                                            </tr>
                                            <tr style={{alignContent: 'left', fontSize: '18px'}}>
                                                <td colSpan="5" className="single-card-description-box">
                                                {
                                                    card.pendulum ? (
                                                        <>
                                                            Pendulum Effect:
                                                            <textarea
                                                                id="pendulum-effect"
                                                                className="description-input"
                                                                defaultValue={card.pendulumEffect || ''}
                                                                type="text"
                                                                onChange={(e) => setCard({ ...card, pendulumEffect: e.target.value })}
                                                            />
                                                            Monster Effect:
                                                            <textarea
                                                                id="type"
                                                                className="description-input"
                                                                defaultValue={card.description || ''}
                                                                type="text"
                                                                onChange={(e) => setCard({ ...card, description: e.target.value })}
                                                            />
                                                        </>
                                                    ) : (
                                                        <textarea
                                                            id="description"
                                                            className="description-input"
                                                            defaultValue={card.description || ''}
                                                            type="text"
                                                            onChange={(e) => setCard({ ...card, description: e.target.value })}
                                                        />
                                                    )
                                                }
                                            </td>
                                            </tr>
                                            <tr className="blank-row">
                                            <td colSpan="5">
                                                <div />
                                            </td>
                                            </tr>
                                            <tr className="single-card-bottom-row">
                                                <td id="star-td" className="single-card-symbol-td">
                                                    <img src={starType} className="single-card-symbol" alt={starType}/>
                                                </td>
                                                <td id="level-td" colSpan="2" className="single-card-label-inner-td">
                                                    {starWord}
                                                    <input
                                                        id="level"
                                                        className="small-input"
                                                        defaultValue={card.level || card.rating || ''}
                                                        type="text"
                                                        onChange={(e) => {
                                                            if (card.level) {
                                                                setCard({ ...card, level: parseInt(e.target.value) })
                                                            } else if (card.rating) {
                                                                setCard({ ...card, rating: parseInt(e.target.value) })
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td id="atk-td" className="single-card-label-inner-td">
                                                    ATK:
                                                    <input
                                                        id="atk"
                                                        className="small-input"
                                                        defaultValue={`${card.atk}`}
                                                        type="text"
                                                        onChange={(e) => setCard({ ...card, atk: parseInt(e.target.value) })}
                                                    />
                                                </td>
                                                <td id="def-td" className="single-card-label-td">
                                                    DEF:
                                                    <input
                                                        id="def"
                                                        className="small-input"
                                                        defaultValue={`${card.def}`}
                                                        type="text"
                                                        onChange={(e) => setCard({ ...card, def: parseInt(e.target.value) })}
                                                    />
                                                </td>
                                            </tr>
                                            <tr className="single-card-date-row">
                                            <td colSpan="3">
                                                TCG Release: {dateToVerbose(card.tcgDate, false, false)}
                                            </td>
                                            <td colSpan="3">
                                                OCG Release: {dateToVerbose(card.ocgDate, false, false)}
                                            </td>
                                            </tr>
                                        </tbody>
                                    ) : (
                                        <tbody>
                                            <tr className="single-card-standard-row">
                                                <td className="single-card-symbol-td">
                                                    <img src={template} className="single-card-cardType" alt="card type"/>
                                                </td>
                                                <td className="single-card-label-inner-td">
                                                    <input
                                                        id="category"
                                                        className="medium-input"
                                                        defaultValue={card.category}
                                                        type="text"
                                                        onChange={(e) => setCard({ ...card, category: capitalize(e.target.value.toLowerCase(), true) })}
                                                    />
                                                </td>
                                                <td className="single-card-symbol-td">
                                                    <img src={symbol} className="single-card-symbol" alt="card symbol"/>
                                                </td>
                                                <td colSpan="2" className="single-card-label-td">
                                                    <input
                                                        id="icon"
                                                        className="medium-input"
                                                        defaultValue={card.icon}
                                                        type="text"
                                                        onChange={(e) => setCard({ ...card, icon: capitalize(e.target.value.toLowerCase(), true) })}
                                                    />
                                                </td>
                                            </tr>
                                            <tr
                                                style={{
                                                    alignContent: 'left',
                                                    fontSize: '16px',
                                                    fontStyle: 'italic'
                                                }}
                                            >
                                                <td colSpan="5" style={{padding: '20px 0px 0px 10px'}}>
                                                    Description:
                                                </td>
                                            </tr>
                                            <tr style={{alignContent: 'left', fontSize: '18px'}}>
                                                <td colSpan="5" className="single-card-description-box">
                                                    <textarea
                                                        id="description"
                                                        className="description-input"
                                                        defaultValue={card.description || ''}
                                                        type="text"
                                                        onChange={(e) => setCard({ ...card, description: e.target.value })}
                                                    />
                                                </td>
                                            </tr>
                                            <tr className="blank-row">
                                                <td colSpan="5">
                                                    <div />
                                                </td>
                                            </tr>
                                            <tr className="single-card-date-row">
                                                <td colSpan="3">
                                                    TCG Release: {dateToVerbose(card.tcgDate, false, false)}
                                                </td>
                                                <td colSpan="3">
                                                    OCG Release: {dateToVerbose(card.ocgDate, false, false)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    )}
                                </table>   
                            )
                        }
                    </div>
                    {
                        !inEditMode ? (
                            <div className="status-flexbox">
                                <div>TCG Status History:</div>
                                <div className="status-box">
                                    {banlists.map((b) => {
                                    const banlist = b[0]
                                    const date = b[1]
                                    const status = statuses[banlist] ? statuses[banlist] : card.tcgDate < date ? 'unlimited' : null
                                    return <StatusBox key={banlist} banlist={banlist} status={status}/>
                                    })}
                                </div>
                            </div>
                        ) : null
                    }

                    {
                        prints?.length && !inEditMode ? (
                            <div className="prints-flexbox">
                                <div>Prints:</div>
                                <div className="print-box">
                                <table>
                                    <tbody>
                                    {prints.map((print, index) => <PrintRow key={print.id} index={index} print={print}/>)}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        ) : null
                    }

                    {
                        rulings?.generic?.length && !inEditMode ? (
                            <div className="prints-flexbox">
                                <div>Generic Rulings:</div>
                                <div>
                                    {rulings.generic.map((ruling) => (
                                        <li className="ruling">
                                            {ruling.content}
                                        </li>
                                    ))}
                                </div>
                                <br/>
                            </div>
                        ) : rulings?.generic?.length && inEditMode && isAdmin ? (
                            <div className="prints-flexbox">
                                <div>Generic Rulings:</div>
                                <div>
                                    {rulings.generic.map((ruling) => (
                                        <div className="ruling-editor-flexbox">
                                            <div className="ruling" style={{width: '80%'}}>   
                                                <textarea
                                                    id={`ruling-${ruling.id}`}
                                                    className="description-input"
                                                    defaultValue={ruling.content}
                                                    type="text"
                                                />
                                            </div>

                                            <div className="delete-button" onClick={() => updateRuling(ruling.id)}>
                                                UPDATE
                                            </div>

                                            <div className="delete-button" onClick={() => deleteRuling(ruling.id)}>
                                                DELETE
                                            </div>
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
                                    <div className="prints-flexbox">
                                        <div>{entry[0] + ' Rulings:'}</div>
                                        {
                                            entry[1].map((ruling) => (
                                                <li className="ruling">
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
                                    <div className="prints-flexbox">
                                        <div>{entry[0] + ' Rulings:'}</div>
                                        {
                                            entry[1].map((ruling) => (
                                                <div className="ruling-editor-flexbox">
                                                    <div className="ruling" style={{width: '80%'}}>   
                                                        <textarea
                                                            id={`ruling-${ruling.id}`}
                                                            className="description-input"
                                                            defaultValue={ruling.content}
                                                            type="text"
                                                        />
                                                    </div>
        
                                                    <div className="delete-button" onClick={() => updateRuling(ruling.id)}>
                                                        UPDATE
                                                    </div>
        
                                                    <div className="delete-button" onClick={() => deleteRuling(ruling.id)}>
                                                        DELETE
                                                    </div>
                                                </div>
                                            ))
                                        }
                                        <br/>
                                    </div>
                                )
                            })
                        ) : null
                    }

                    <div className="space-apart">       
                        {
                            isContentManager ? (
                                !inEditMode ? (
                                    <div
                                        className="downloadButton"
                                        style={{width: '200px'}}
                                        onClick={()=> setInEditMode(true)}
                                    >
                                        Edit Mode
                                    </div>
                                ) : (
                                    <div
                                        className="downloadButton"
                                        style={{width: '200px'}}
                                        onClick={()=> updateCardInfo()}
                                    >
                                        Save Changes
                                    </div>
                                )
                            ) : null
                        }
                        {
                            isAdmin ? (
                                <div
                                    className="downloadButton"
                                    style={{width: '200px'}}
                                    onClick={()=> downloadCardImage()}
                                >
                                    Update Image
                                </div>
                            ) : null
                        }
                    </div>
                </div>
                ) : (
                ''
                )}
            </div>
        </>
      )
}
