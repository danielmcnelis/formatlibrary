/* eslint-disable max-statements */

import { useState, useEffect, useLayoutEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { NotFound } from '../General/NotFound'
import { PrintRow } from './PrintRow'
import { StatusBox } from './StatusBar'
import { dateToVerbose } from '@fl/utils'

const banlists = [
  ['may02', '2002-05-01'],
  ['jul02', '2002-07-01'],
  ['oct02', '2002-10-01'],
  ['dec02', '2002-12-01'],
  ['apr03', '2003-04-01'],
  ['may03', '2003-05-01'],
  ['jul03', '2003-07-01'],
  ['aug03', '2003-08-01'],
  ['nov03', '2003-11-01'],
  ['feb04', '2004-02-01'],
  ['apr04', '2004-04-01'],
  ['oct04', '2004-10-01'],
  ['apr05', '2005-04-01'],
  ['oct05', '2005-10-01'],
  ['apr06', '2006-04-01'],
  ['sep06', '2006-09-01'],
  ['mar07', '2007-03-01'],
  ['jun07', '2007-06-01'],
  ['sep07', '2007-09-01'],
  ['mar08', '2008-03-01'],
  ['may08', '2008-05-01'],
  ['sep08', '2008-09-01'],
  ['mar09', '2009-03-01'],
  ['sep09', '2009-09-01'],
  ['mar10', '2010-03-01'],
  ['sep10', '2010-09-01'],
  ['mar11', '2011-03-01'],
  ['sep11', '2011-09-01'],
  ['mar12', '2012-03-01'],
  ['sep12', '2012-09-01'],
  ['mar13', '2013-03-01'],
  ['sep13', '2013-09-01'],
  ['oct13', '2013-10-01'],
  ['jan14', '2014-01-01'],
  ['apr14', '2014-04-01'],
  ['jul14', '2014-07-01'],
  ['oct14', '2014-10-01'],
  ['jan15', '2015-01-01'],
  ['apr15', '2015-04-01'],
  ['jul15', '2015-07-01'],
  ['nov15', '2015-11-01'],
  ['feb16', '2016-02-01'],
  ['apr16', '2016-04-01'],
  ['aug16', '2016-08-01'],
  ['mar17', '2017-03-01'],
  ['jun17', '2017-06-01'],
  ['sep17', '2017-09-01'],
  ['nov17', '2017-11-01'],
  ['feb18', '2018-02-01'],
  ['may18', '2018-05-01'],
  ['sep18', '2018-09-01'],
  ['dec18', '2018-12-01'],
  ['jan19', '2019-01-01'],
  ['apr19', '2019-04-01'],
  ['jul19', '2019-07-01'],
  ['oct19', '2019-10-01'],
  ['jan20', '2020-01-01'],
  ['apr20', '2020-04-01'],
  ['jun20', '2020-06-01'],
  ['sep20', '2020-09-01'],
  ['dec20', '2020-12-01'],
  ['mar21', '2021-03-01'],
  ['jul21', '2021-03-01'],
  ['oct21', '2021-03-01'],
  ['feb22', '2022-02-01'],
  ['may22', '2022-05-01'],
  ['oct22', '2022-10-01']
]

// eslint-disable-next-line complexity
export const SingleCard = () => {
    const [card, setCard] = useState({})
    const [statuses, setStatuses] = useState({})
    const [prints, setPrints] = useState([])
    const [rulings, setRulings] = useState({})
    const [isAdmin, setIsAdmin] = useState(false)
    const { id } = useParams()
    console.log('rulings', rulings)
    if (rulings && rulings.specific) console.log('Object.entries(rulings?.specific)', Object.entries(rulings?.specific))
  
      // DOWNLOAD CARD IMAGE
      const downloadCardImage = async () => {
          try {
              const {data} = await axios.post(`/api/images/update-card?ypdId=${card.ypdId}`)
              if (data.success) alert(`Success! New Image: /images/cards/${card.ypdId}`)
          } catch (err) {
              console.log(err)
          }
      }
  
      // USE EFFECT
      useEffect(() => {
          const checkIfAdmin = async () => {
            //   const {data} = await axios.get(`/authX/admin`, {
            //       headers: {
            //           username: localStorage.getItem('username'),
            //           password: localStorage.getItem('password')
            //       }
            //   })
              
              setIsAdmin(true)
          }
          
          checkIfAdmin()
      }, [])
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0))
  
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
        <div className="body">
          {card.id ? (
            <div>
              <div className="flexy">
                <img className="single-card-image" src={imagePath} />
                <table className="single-card-table">
                  <thead>
                    <tr>
                      <th colSpan="5" className="single-card-title">
                        {card.name}
                      </th>
                    </tr>
                  </thead>
                  {card.category === 'Monster' ? (
                    <tbody>
                      <tr className="single-card-standard-row">
                        <td className="single-card-symbol-td">
                          <img src={template} className="single-card-cardType" />
                        </td>
                        <td colSpan="4" className="single-card-large-label">
                          {cardType}
                        </td>
                      </tr>
                      <tr className="single-card-standard-row">
                        <td className="single-card-symbol-td">
                          <img src={attribute} className="single-card-symbol" />
                        </td>
                        <td className="single-card-label-inner-td">
                          {card.attribute}
                        </td>
                        <td className="single-card-symbol-td">
                          <img src={type} className="single-card-symbol" />
                        </td>
                        <td colSpan="2" className="single-card-label-td">
                          {card.type}
                        </td>
                      </tr>
                      <tr
                        style={{
                          alignContent: 'left',
                          fontSize: '16px',
                          fontStyle: 'italic'
                        }}
                      >
                        <td className="single-card-description-label" colSpan="5">
                          Description:
                        </td>
                      </tr>
                      <tr style={{alignContent: 'left', fontSize: '18px'}}>
                        <td colSpan="5" className="single-card-description-box">
                          {card.pendulum ? 
                            `${
                              card.description.includes('[ Pendulum Effect ]') ?
                              card.description.slice(20, card.description.indexOf('----')) + '\n\n' :
                              ''
                            }${
                              card.description.includes('[ Monster Effect ]') ? 
                              card.description.slice(card.description.indexOf('[ Monster Effect ]') + 19) :
                              card.description.includes('[ Flavor Text ]') ? 
                              <i>{card.description.slice(card.description.indexOf('[ Flavor Text ]') + 16)}</i> :
                              card.description
                            }` :
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
                          <img src={starType} className="single-card-symbol" />
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
                        <td colSpan="5">
                          Release Date: {dateToVerbose(card.tcgDate, false, false)}
                        </td>
                      </tr>
                    </tbody>
                  ) : (
                    <tbody>
                      <tr className="single-card-standard-row">
                        <td className="single-card-symbol-td">
                          <img src={template} className="single-card-cardType" />
                        </td>
                        <td className="single-card-label-inner-td">
                          {card.category}
                        </td>
                        <td className="single-card-symbol-td">
                          <img src={symbol} className="single-card-symbol" />
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
                        <td colSpan="5">
                          Release Date: {dateToVerbose(card.tcgDate, false, false)}
                        </td>
                      </tr>
                    </tbody>
                  )}
                </table>
              </div>
              <div className="status-flexbox">
                <div>Status History:</div>
                <div className="status-box">
                  {banlists.map((b) => {
                    const banlist = b[0]
                    const date = b[1]
                    const status = statuses[banlist] ? statuses[banlist] : card.tcgDate < date ? 'unlimited' : null
                    return <StatusBox key={banlist} banlist={banlist} status={status}/>
                  })}
                </div>
              </div>
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

              <div className="prints-flexbox">
                {rulings?.generic?.length ? (
                    <div>
                        <div>Generic Rulings:</div>
                        <div>
                            {rulings.generic.map((ruling) => <li>{ruling.conent}</li>)}
                        </div>
                    </div>
                ) : ''}
                <div> 
                    {rulings && rulings.specific && Object.keys(rulings.specific).length ? (
                        <div>
                            {
                                Object.entries(rulings.specific.map((entry) => {
                                    console.log(entry[0] + 'Rulings')
                                    console.log(entry[1])
                                    return (
                                        <div>
                                            <div>{entry[0] + 'Rulings'}</div>
                                            {
                                                entry[1].map((ruling) => (<li>{ruling.conent}</li>))
                                            }
                                        </div>
                                    )
                                }))
                            }
                        </div>
                    ) : ''}
                </div>
              </div>
              <div>
                  {
                      isAdmin ? (
                          <a
                              className="downloadButton"
                              onClick={()=> downloadCardImage()}
                          >
                              Update Image
                          </a>
                      ) : ''
                  }
              </div>
            </div>
          ) : (
            ''
          )}
        </div>
      )
}
