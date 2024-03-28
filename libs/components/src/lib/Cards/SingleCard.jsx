/* eslint-disable max-statements */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useMediaQuery } from 'react-responsive'
import { NotFound } from '../General/NotFound'
import { PrintRow } from './PrintRow'
import { StatusBox } from './StatusBar'
import { capitalize, dateToSimple, dateToVerbose, getCookie } from '@fl/utils'
import { Helmet } from 'react-helmet'
import './SingleCard.css'
import banlists from '../../data/banlists.json'

const playerId = getCookie('playerId')

export const SingleCard = () => {
    const isMobile = useMediaQuery({ query: '(max-width: 480px)' })
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
        const checkRoles = async () => {
            try {
                const accessToken = getCookie('access')
                const { data: player } = await axios.get(`/api/players/roles`, {
                    headers: {
                        ...(accessToken && {authorization: `Bearer ${accessToken}`})
                    }
                })

                if (player.admin) setIsAdmin(true)
                if (player.contentManager) setIsContentManager(true)
            } catch (err) {
                console.log(err)
            }
        }

        if (playerId) checkRoles()
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
    const deleteRuling = async (rulingId, isGeneric, key) => {
        try {
            await axios.delete(`/api/rulings/delete?id=${rulingId}`)
            if (isGeneric) {
                setRulings({ ...rulings, generic: rulings.generic.filter((e) => e.id !== rulingId)})
            } else {
                setRulings({ ...rulings, specific: { ...rulings.specific, [key]: rulings.specific[key].filter((e) => e.id !== rulingId) }})
            }
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
    
    const starWord = card.xyz ? `Rank` : 
      card.link ? `Link` : 
      card.category === 'Monster' ? `Level` : 
      null
  
    const starType = `https://cdn.formatlibrary.com/images/symbols/${starWord?.toLowerCase()}.png`
    const icon = `https://cdn.formatlibrary.com/images/symbols/${card.icon?.toLowerCase()}.png`
  
    const classes = [card.category]
    if (card.fusion) classes.push('Fusion')
    if (card.ritual) classes.push('Ritual')
    if (card.synchro) classes.push('Synchro')
    if (card.xyz) classes.push('Xyz')
    if (card.pendulum) classes.push('Pendulum')
    if (card.link) classes.push('Link')
    if (card.gemini) classes.push('Gemini')
    if (card.flip) classes.push('Flip')
    if (card.spirit) classes.push('Spirit')
    if (card.toon) classes.push('Toon')
    if (card.tuner) classes.push('Tuner')
    if (card.union) classes.push('Union')
    if (card.normal) classes.push('Normal')
    if (card.effect) classes.push('Effect')
  
    return (
        <>
            <Helmet>
                <title>{`${card.name} - Yu-Gi-Oh! Card - Format Library`}</title>
                <meta name="og:title" content={`${card.name} - Yu-Gi-Oh! Card - Format Library`} />
                <meta name="description" content={card.description}/>
                <meta name="og:description" content={card.description}/>
                <meta name="image" content={`https://cdn.formatlibrary.com/images/artworks/${card.ypdId}.jpg`}/>
                <meta name="og:image" content={`https://cdn.formatlibrary.com/images/artworks/${card.ypdId}.jpg`}/>
            </Helmet>
            <div className="body">
                <div className="single-card">
                    <img className="single-card-image" src={`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`} alt={card.name}/>
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
                                            card.pendulumEffect && card.normal ? 'Pendulum Effect:\n' + card.pendulumEffect + '\n\nFlavor Text:\n' + <i>card.description</i> :
                                            card.pendulumEffect && !card.normal ? 'Pendulum Effect:\n' + card.pendulumEffect + '\n\nMonster Effect:\n' + card.description :
                                            card.normal ? <i>{card.description}</i> :
                                            card.description
                                        }
                                        </div>
                                    </div>
                                    <div className="card-info-row pwk-border-bottom">
                                        <div className="card-info-cell pwk-border-right">
                                            <img src={starType} className="card-symbol-standard" alt={starType}/>
                                            {
                                                isMobile ? (
                                                    <div>{card.level || card.rating}</div>
                                                ) : (
                                                    <div>{starWord} {card.level || card.rating}</div>
                                                )
                                            }
                                        </div>
                                        <div className="card-info-cell pwk-border-right">
                                            <img src="https://cdn.formatlibrary.com/images/emojis/swords.png" className="card-symbol-standard" alt="sword"/>
                                            {
                                                isMobile ? (
                                                    <div>{card.atk}</div>
                                                ) : (
                                                    <div>ATK: {card.atk}</div>
                                                )
                                            }
                                        </div>
                                        <div className="card-info-cell">
                                            <img src="https://cdn.formatlibrary.com/images/emojis/shield.png" className="card-symbol-standard" alt="shield"/>
                                            {
                                                isMobile ? (
                                                    <div>{card.def}</div>
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
                                                setCard({ ...card, cleanName, name: e.target.value })
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
                                                    onChange={(e) => setCard({ ...card, attribute: e.target.value.toUpperCase() })}
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
                                                    onChange={(e) => setCard({ ...card, type: capitalize(e.target.value.toLowerCase(), true) })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pwk-border-bottom">
                                        <div className="single-card-description-label">Description:</div>
                                        <div className="single-card-description-box">
                                        {
                                            card.pendulum ? 'Pendulum Effect:\n' + (
                                                <textarea
                                                    id="pendulum-effect"
                                                    className="description-input"
                                                    defaultValue={card.pendulumEffect || ''}
                                                    type="text"
                                                    onChange={(e) => setCard({ ...card, pendulumEffect: e.target.value })}
                                                />
                                            ) + '\n\nMonster Effect / Flavor Text:\n' + (
                                                <textarea
                                                    id="type"
                                                    className="description-input"
                                                    defaultValue={card.description || ''}
                                                    type="text"
                                                    onChange={(e) => setCard({ ...card, description: e.target.value })}
                                                />
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
                                                            setCard({ ...card, level: parseInt(e.target.value) })
                                                        } else if (card.rating) {
                                                            setCard({ ...card, rating: parseInt(e.target.value) })
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
                                                    onChange={(e) => setCard({ ...card, atk: parseInt(e.target.value) })}
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
                                                    onChange={(e) => setCard({ ...card, def: parseInt(e.target.value) })}
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
                                                setCard({ ...card, cleanName, name: e.target.value })
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
                                                    onChange={(e) => setCard({ ...card, category: capitalize(e.target.value.toLowerCase(), true) })}
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
                                                    onChange={(e) => setCard({ ...card, icon: capitalize(e.target.value.toLowerCase(), true) })}
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
                                                onChange={(e) => setCard({ ...card, description: e.target.value })}
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
                            <div>TCG Status History:</div>
                            <div className="status-box">
                                {banlists.map(([banlist, date]) => {
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
                                {rulings.generic.map((ruling) => <li className="ruling" key={ruling.id}>{ruling.content}</li>)}
                            </div>
                            <br/>
                        </div>
                    ) : rulings?.generic?.length && inEditMode && isAdmin ? (
                        <div className="prints-flexbox">
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
                                <div className="prints-flexbox">
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
                                <div className="prints-flexbox">
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
                <div className="space-apart">
                {
                    isContentManager ? (
                        !inEditMode ? (
                            <div className="downloadButton" style={{width: '200px'}} onClick={()=> setInEditMode(true)}>Edit Mode</div>
                        ) : (
                            <div className="downloadButton" style={{width: '200px'}} onClick={()=> updateCardInfo()}>Save Changes</div>
                        )
                    ) : null
                }
                {
                    isAdmin ? (
                        <div className="downloadButton" style={{width: '200px'}} onClick={()=> downloadCardImage()}>Update Image</div>
                    ) : null
                }
                </div>
            </div>
        </>
    )
}
