
import { useState, useEffect, useLayoutEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CardImage } from '../Cards/CardImage'
import { NotFound } from '../General/NotFound'
import axios from 'axios'
import { dateToSimple, dateToVerbose, ordinalize } from '@fl/utils'
import { getCookie } from '@fl/utils'
import { Helmet } from 'react-helmet'
import './SingleDeck.css'

const emojis = {
  Helmet: 'https://cdn.formatlibrary.com/images/emojis/helmet.png',
  Controller: 'https://cdn.formatlibrary.com/images/emojis/controller.png',
  Orb: 'https://cdn.formatlibrary.com/images/emojis/orb.png',
  Unicorn: 'https://cdn.formatlibrary.com/images/emojis/unicorn.png',
  Volcano: 'https://cdn.formatlibrary.com/images/emojis/volcano.png',
  Bow: 'https://cdn.formatlibrary.com/images/emojis/bow.png',
  Voltage: 'https://cdn.formatlibrary.com/images/emojis/voltage.png',
  Lock: 'https://cdn.formatlibrary.com/images/emojis/lock.png',
  Thinking: 'https://cdn.formatlibrary.com/images/emojis/thinking.png',
  First: 'https://cdn.formatlibrary.com/images/emojis/1st.png',
  Second: 'https://cdn.formatlibrary.com/images/emojis/2nd.png',
  Third: 'https://cdn.formatlibrary.com/images/emojis/3rd.png',
  Consolation: 'https://cdn.formatlibrary.com/images/emojis/consolation.png',
  Heart: 'https://cdn.formatlibrary.com/images/emojis/heart.png',
  Disk: 'https://cdn.formatlibrary.com/images/emojis/disk.png',
  Eye: 'https://cdn.formatlibrary.com/images/emojis/eye.png'
}

const { Unicorn, Voltage, Bow, Volcano, Controller, Orb, Lock, Thinking, First, Second, Third, Consolation, Heart, Disk, Eye } = emojis

export const SingleDeck = (props) => {
    const accessToken = getCookie('access')
    const isAdmin = props.roles?.admin
    const isContentManager = props.roles?.contentManager
    const isSubscriber = props.roles?.subscriber

    const [deck, setDeck] = useState({})
    const [banlist, setBanlist] = useState({})
    const [inEditMode, setInEditMode] = useState(false)
    const [suggestions, setSuggestions] = useState([])
    const [input, setInput] = useState('')
    const [selectedDeckType, setSelectedDeckType] = useState({})
    const [deckTypes, setDeckTypes] = useState([])

    const navigate = useNavigate()
    const { id } = useParams()
    // const videoPlaylistId = deck?.format?.videoPlaylistId
    
  // USE LAYOUT EFFECT
  useLayoutEffect(() => window.scrollTo(0, 0), [])

    // UPDATE DECK INFO
    const updateDeckInfo = async () => {
        try {
            const {data} = await axios.post(`/api/decks/labels?id=${deck.id}`, { 
                ...deck, 
                deckTypeName: selectedDeckType.name, 
                deckTypeId: selectedDeckType.id,
                category: selectedDeckType.category
            }, {
                headers: {
                    ...(accessToken && {authorization: `Bearer ${accessToken}`})
                }
            })

            setInEditMode(false)
            setDeck({...deck, ...data})
        } catch (err) {
            console.log(err)
        }
    }

    
  // USE EFFECT SET DECK
  useEffect(() => {
    const fetchDeckData = async () => {
        // If user is subscriber or admin: Hit different endpoints that require authentication
        if (isAdmin) {
            try {
                const {data: deckData} = await axios.get(`/api/decks/admin/${id}`, {
                    headers: {
                        ...(accessToken && {authorization: `Bearer ${accessToken}`})
                    }
                })

                setDeck(deckData)
            } catch (err) {
                console.log(err)
                setDeck(null)
            }
        } else if (isSubscriber) {
            try {
                const {data: deckData} = await axios.get(`/api/decks/subscriber/${id}`, {
                    headers: {
                        ...(accessToken && {authorization: `Bearer ${accessToken}`})
                    }
                })

                setDeck(deckData)
                } catch (err) {
                console.log(err)
                setDeck(null)
                }
        } else {
            try {
                const {data: deckData} = await axios.get(`/api/decks/${id}`)
                setDeck(deckData)
                } catch (err) {
                console.log(err)
                setDeck(null)
                }

        }
    }

    fetchDeckData()
  }, [id, isAdmin, isSubscriber])


  // USE EFFECT SET DeckTypes
  useEffect(() => {
    const fetchDeckTypes = async () => {
      try {
        const {data} = await axios.get(`/api/decktypes/`)
        setDeckTypes(data)
      } catch (err) {
        console.log(err)
      }
    }

    if (inEditMode) {
        fetchDeckTypes()
    }
  }, [inEditMode])

  
    // USE EFFECT SET BANLIST
    useEffect(() => {
        if (!deck || !deck.format) return
        const fetchData = async () => {
        try {
            const {data} = await axios.get(`/api/banlists/cards/${deck.format.banlist}?category=${deck.format.category || 'TCG'}`)
            setBanlist(data)
        } catch (err) {
            console.log(err)
        }
        }

        fetchData()
    }, [deck])
    
    // USE EFFECT HANDLE AUTOCOMPLETE
    useEffect(() => {
        if (!input || !input.length || input.length < 3) {
            if (suggestions.length) {
                return setSuggestions([])
            } else {
                return
            }
        }

        const newSuggestions = []

        //Iterate through all entries in the list and find matches
        for (let i = 0; i < deckTypes.length; i++) {
            if (deckTypes[i].name?.toLowerCase().includes(input.toLowerCase())) {
                newSuggestions.push(deckTypes[i]?.name)
            }
        }

        setSuggestions(newSuggestions.sort())
    }, [input, deckTypes])


    // HANDLE SUGGESTION CLICK
    const handleSuggestionClick = (str) => {
        document.getElementById("decktype-input").value = str
        const matchesInput = (e) => e.name?.toLowerCase() === str.toLowerCase()
        setSelectedDeckType(deckTypes[deckTypes.findIndex(matchesInput)])
        setSuggestions([])
    }

    // HANDLE DECK DOWNLOAD
    const handleDeckDownload = async () => {
        try {
            let fileUrl
            if (deck.display === true) {
                const {data: blob} = await axios.get(`/api/decks/download/${deck.id}`, {
                    responseType: 'blob',
                })

                fileUrl = window.URL.createObjectURL(blob)
            } else {
                const {data: blob} = await axios.get(`/api/decks/download/subscriber/${deck.id}`, {
                  responseType: 'blob',
                    headers: {
                        ...(accessToken && {authorization: `Bearer ${accessToken}`})
                    }
                })

                fileUrl = window.URL.createObjectURL(blob)
            }

            let alink = document.createElement("a")
                alink.href = fileUrl
                alink.download = `${deck.builderName}-${deck.deckTypeName || deck.name}.ydk`
                alink.click()
    
            return setDeck({ downloads: deck.downloads + 1, ...deck})
        } catch (err) {
            console.log(err)
        }
    }

  if (!deck) return <NotFound/>
  if (!deck.id) return <div style={{height: '100vh'}}/>

  let extension =  (deck.builderName || '').replaceAll('%', '%25')
    .replaceAll('/', '%2F')
    .replaceAll(' ', '_')
    .replaceAll('#', '%23')
    .replaceAll('?', '%3F')
    .replaceAll('&', '%26')
    .replaceAll('★', '_')

  const goToEvent = () => navigate(`/events/${deck.eventAbbreviation}`)
  const goToFormat = () => navigate(`/formats/${deck.formatName}`)
  const goToPlayer = () => navigate(`/players/${extension}`)

  const categoryImage = deck.category === 'Aggro' ? emojis.Helmet :
    deck.category === 'Combo' ? Controller :
    deck.category === 'Control' ? Orb :
    deck.category === 'Lockdown' ? Lock :
    deck.category === 'Midrange' ? Bow :
    deck.category === 'Multiple' ? Unicorn :
    deck.category === 'Ramp' ? Volcano :
    deck.category === 'Stun' ? Voltage :
    Thinking

  const placementImage = deck.placement === 1 ? First :
    deck.placement === 2 ? Second :
    deck.placement === 3 ? Third :
    Consolation

  const addLike = async () => {
    const res = await axios.get(`/api/decks/like/${deck.id}`)
    if (res.status === 200) {
      const rating = deck.rating++
      setDeck({rating, ...deck})
    }
  }

  const addDownload = async () => {
    const downloads = deck.downloads++
    setDeck({downloads, ...deck})
  }

  const fullName = deck.builderName || ''
  const displayName = fullName.length <= 24 ? fullName : fullName.slice(0, 24).split(' ')[0] || ''

  return (
    <>
        <Helmet>
            <title>{`${deck?.deckTypeName} ${deck?.formatName} Deck by ${deck?.builderName} - Format Library`}</title>
            <meta 
                name="description" 
                content={
                    deck?.placement ? `${ordinalize(deck?.placement)} Place ${deck?.formatName} Format ${deck?.deckTypeName} Deck by ${deck?.builderName}. This deck was used in ${deck.eventAbbreviation} on ${dateToVerbose(deck.publishDate)}.` :
                        `${deck?.formatName} Format ${deck?.deckTypeName} Deck by ${deck?.builderName}. This deck was shared by ${deck?.builderName} on ${dateToVerbose(deck.publishDate)}.`
                }
            />
        </Helmet>
        {
            // videoPlaylistId ? <div className="adthrive-content-specific-playlist" data-playlist-id={videoPlaylistId}></div> :
            <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
        }
        <div className="body">
            <div className="single-deck-title-flexbox">
                <div>
                    {
                        isContentManager ? (
                            <div style={{width: '80px'}}></div>
                        ) : null
                    }
                </div>
                <div
                    className="link desktop-only show-cursor"
                    onClick={() => handleDeckDownload()}
                >                                     
                    <div className="deck-button show-cursor">
                        <b style={{padding: '0px 6px'}}>Download</b>
                        <img 
                            style={{width:'28px'}} 
                            src={`https://cdn.formatlibrary.com/images/emojis/download.png`}
                            alt="download"
                        />
                    </div>
                </div>
                {

                !inEditMode ? (
                        <div 
                            onClick={() => {window.location.href=`/deckTypes/${deck.deckTypeName.toLowerCase().replace(/\s/g, '-')}?format=${deck.formatName.toLowerCase().replace(/\s/g, '_')}`}}
                        >
                            <div className="single-deck-title">{deck.deckTypeName || deck.name}</div>
                        </div>
                    ) : (
                        <div>
                            <form autoComplete='on'>
                            <input
                                id="decktype-input"
                                className="large-input"
                                defaultValue={deck.deckTypeName || deck.name}
                                type="text"
                                onChange={(e) => {
                                    setInput(e.target.value)
                                }}
                            />
                            </form>
                            <div className="suggestions-flex">
                                {
                                    suggestions.map((s) => {
                                        return (
                                            <div 
                                                className="suggestion" 
                                                key={s} 
                                                onClick={() => handleSuggestionClick(s)}
                                            >{s}</div>
                                        )
                                })
                                }
                            </div>
                        </div>
                    )
                }
                <Link to="/deck-builder" state={{ deck: deck }} className="desktop-only">                                    
                    <div className="deck-button">
                        <b style={{padding: '0px 6px'}}>Open Deck</b>
                        <img 
                            style={{width:'28px'}} 
                            src={`https://cdn.formatlibrary.com/images/emojis/open-file.png`}
                            alt="open"
                        />
                    </div>
                </Link>
                <div>
                    {
                        isContentManager ? (
                            !inEditMode ? (
                                <div className="downloadButton" style={{width: '80px'}} onClick={()=> setInEditMode(true)}>Edit</div>
                            ) : (
                                <div className="downloadButton" style={{width: '80px'}} onClick={()=> updateDeckInfo()}>Save</div>
                            )
                        ) : null
                    }
                </div>
            </div>
            <table className="single-deck-table">
                <tbody>
                <tr className="single-deck-info-1">
                    <td id="single-deck-builder-td">
                    <div className="single-deck-cell">
                        <div onClick={() => goToPlayer()} className="single-deck-builder-link">
                            <b>Builder: </b>
                            <p>{displayName}</p>
                            <img 
                                className="single-deck-builder-cell-pfp"
                                src={`/api/players/${deck.builder?.id}/avatar`}  
                                alt={deck.builderName}
                            />
                        </div>
                    </div>       
                    </td>
                    <td>
                    
                    <div onClick={() => goToFormat()} className="single-deck-cell">
                        <div className="single-deck-format-link" style={{paddingRight:'7px'}}><b>Format:</b> {deck.formatName}</div>
                        <img 
                            style={{width:'28px'}} 
                            src={`https://cdn.formatlibrary.com/images/emojis/${deck.format.icon}.png`}
                            alt={deck.format.icon}
                        />
                    </div>       
                    </td>
                    {
                        deck.category ? (
                            <td>
                            <div className="single-deck-cell">
                                <div className="single-deck-category" style={{paddingRight:'7px'}}><b>Category:</b> {deck.category}</div>
                                <img 
                                    className="single-deck-category-emoji" 
                                    style={{width:'28px'}} 
                                    src={categoryImage}
                                    alt={deck.category}
                                />
                            </div>
                            </td>
                        ) : (
                            <td>
                                <div className="single-deck-cell">
                                <div className="desktop-only"><b>Last Updated:</b> {dateToVerbose(deck.updatedAt, false, false)}</div>
                                <div id="single-deck-uploaded-mobile" className="mobile-only"><b>Last Updated:</b> {dateToSimple(deck.updatedAt)}</div>
                                </div>
                            </td>
                        )
                    }
                </tr>
                {
                    deck.eventAbbreviation && deck.placement ? (
                        <tr className="single-deck-info-2">
                        <td>
                        <div onClick={() => goToEvent()} className="single-deck-cell">
                            <div className="single-deck-event-link" style={{paddingRight:'7px'}}><b>Event:</b> {deck.eventAbbreviation}</div> 
                            <img 
                                style={{width:'28px'}} 
                                src={`https://cdn.formatlibrary.com/images/logos/${deck.communityName?.replaceAll('+', '%2B')}.png`}
                                alt={deck.communityName}
                            />
                        </div>   
                        </td>
                        <td>
                        <div className="single-deck-cell">
                            <div style={{paddingRight:'7px'}}><b>Place:</b> {ordinalize(deck.placement)}</div> 
                            <img 
                                style={{width:'28px'}} 
                                src={placementImage}
                                alt={deck.placement}
                            />
                        </div>   
                        </td>
                        <td>
                        <div className="single-deck-cell">
                            <div className="desktop-only"><b>Uploaded:</b> {dateToVerbose(deck.publishDate, false, false)}</div>
                            <div id="single-deck-uploaded-mobile" className="mobile-only"><b>Uploaded:</b> {dateToSimple(deck.publishDate)}</div>
                        </div>
                        </td>
                    </tr>
                    ) : ''
                }
                </tbody>
            </table>

            <div className="deck-component">
                <div id="main" className="deck-bubble">
                    <div id="main" className="deck-flexbox">
                    {
                        deck.main.map((card, index) => <CardImage className="card-image" width='72px' padding='1px' margin='0px' key={`${deck.id}-${index}-${card.id}`} card={card} status={banlist[card.id]}/>)
                    }
                    </div>
                </div>
                {
                    deck.side.length ? (
                    <div id="side" className="deck-bubble">
                        <div id="side" className="deck-flexbox">
                        {
                            deck.side.map((card, index) => <CardImage className="card-image" width='48px' padding='0.5px' margin='0px' key={`${deck.id}-${index}-${card.id}`} card={card} status={banlist[card.id]}/>)
                        }
                        </div>
                    </div>
                    ) : ''
                }
                {
                    deck.extra.length ? (
                    <div id="extra" className="deck-bubble">
                        <div id="extra" className="deck-flexbox">
                        {
                            deck.extra.map((card, index) => <CardImage className="card-image"f width='48px' padding='0.5px' margin='0px' key={`${deck.id}-${index}-${card.id}`} card={card} status={banlist[card.id]}/>)
                        }
                        </div>
                    </div>
                    ) : ''
                }
                <table className='deck-stats-table'>
                    <tbody>
                        <tr>
                            <td>
                            <div className="deck-stats-cell">
                                <div style={{paddingRight:'7px'}}><b className="deck-stats-label">Likes: </b>{deck.rating}</div>
                                <img className="likeImg" alt="heart" onClick={() => addLike()} style={{width:'28px'}} src={Heart}/>
                            </div>   
                            </td>
                            <td>
                            <div className="deck-stats-cell show-cursor">
                                <div style={{paddingRight:'7px'}}><b className="deck-stats-label show-cursor">Downloads: </b>{deck.downloads}</div> 
                                <div
                                    onClick={()=> handleDeckDownload()}
                                >
                                    <img style={{width:'28px'}} alt="download" src={Disk}/>
                                </div>
                            </div>   
                            </td>
                            <td>
                            <div className="deck-stats-cell">
                                <div style={{paddingRight:'7px'}}><b className="deck-stats-label">Views: </b>{deck.views}</div> 
                                <img style={{width:'28px'}} src={Eye} alt="eye"/>
                            </div>   
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </>
  )
}
