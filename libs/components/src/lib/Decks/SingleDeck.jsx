
import { useState, useEffect, useLayoutEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CardImage } from '../Cards/CardImage'
import { NotFound } from '../General/NotFound'
import axios from 'axios'
import { dateToSimple, dateToVerbose, ordinalize } from '@fl/utils'

const emojis = {
  Helmet: 'https://cdn.formatlibrary.com/images/emojis/helmet.png',
  Controller: 'https://cdn.formatlibrary.com/images/emojis/controller.png',
  Orb: 'https://cdn.formatlibrary.com/images/emojis/orb.png',
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

const { Helmet, Controller, Orb, Lock, Thinking, First, Second, Third, Consolation, Heart, Disk, Eye } = emojis

export const SingleDeck = () => {
    const [deck, setDeck] = useState({})
    const [banlist, setBanlist] = useState({})
    const navigate = useNavigate()
    const { id } = useParams()

  // USE LAYOUT EFFECT
  useLayoutEffect(() => window.scrollTo(0, 0), [])

  // USE EFFECT SET DECK
  useEffect(() => {
    const fetchData = async () => {
      try {
        const {data} = await axios.get(`/api/decks/${id}`)
        setDeck(data)
      } catch (err) {
        console.log(err)
        setDeck(null)
      }
    }

    fetchData()
  }, [id])

  // USE EFFECT SET DECK
  useEffect(() => {
    if (!deck || !deck.format) return
    const fetchData = async () => {
      try {
        const {data} = await axios.get(`/api/banlists/simple/${deck.format.banlist}`)
        setBanlist(data)
      } catch (err) {
        console.log(err)
      }
    }

    fetchData()
  }, [deck])

  if (!deck) return <NotFound/>
  if (!deck.id) return <div/>

  const extension =  deck.player.name.replaceAll('%', '%252525')
    .replaceAll('/', '%2F')
    .replaceAll(' ', '_')
    .replaceAll('#', '%23')
    .replaceAll('?', '%3F') + '#' + deck.player.discriminator
    
  const goToEvent = () => navigate(`/events/${deck.eventName}`)
  const goToFormat = () => navigate(`/formats/${deck.formatName}`)
  const goToPlayer = () => navigate(`/players/${extension}`)

  const categoryImage = deck.category === 'Aggro' ? Helmet :
    deck.category === 'Combo' ? Controller :
    deck.category === 'Control' ? Orb :
    deck.category === 'Lockdown' ? Lock :
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

  const fullName = deck.player && deck.player.name ? deck.player.name : deck.builder
  const displayName = fullName.length <= 24 ? fullName : fullName.slice(0, 24).split(' ').slice(0, -1).join(' ')

  return (
    <div className="body">
      <div className="single-deck-title-flexbox">
        <a
            className="link desktop-only"
            href={`/api/decks/download/${deck.id}`} 
            download={`${deck.builder}-${deck.type || deck.name}.ydk`}
            onClick={()=> addDownload()}
        >                                    
            <div className="deck-button">
                <b style={{padding: '0px 6px'}}>Download</b>
                <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/download.png`}/>
            </div>
        </a>
        <div className="single-deck-title">{deck.type || deck.name}</div>
        <Link to="/builder" state={{ deck: deck }} className="desktop-only">                                    
            <div className="deck-button">
                <b style={{padding: '0px 6px'}}>Open Deck</b>
                <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/open-file.png`}/>
            </div>
        </Link>
      </div>
      <table className="single-deck-table">
        <tbody>
          <tr className="single-deck-info-1">
            <td id="single-deck-builder-td">
              <div className="single-deck-cell">
                {
                  deck.player && deck.player.discriminator ? (
                    <div onClick={() => goToPlayer()} className="single-deck-builder-link">
                      <b>Builder: </b>
                      <p>{displayName}</p>
                      <img 
                        className="single-deck-builder-cell-pfp"
                        src={
                            deck.player.discordPfp ? `https://cdn.discordapp.com/avatars/${deck.player.discordId}/${deck.player.discordPfp}.webp` :
                            `https://cdn.formatlibrary.com/images/pfps/${deck.player.discordId || deck.player.name}.png`
                        }
                        onError={(e) => {
                                e.target.onerror = null
                                e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                            }
                        }
                        alt={deck.player.name}
                      />
                    </div>
                  ) : (
                    <div style={{paddingRight:'7px'}}><b>Builder:</b> {displayName}</div>
                  )
                }
              </div>       
            </td>
            <td>
              <div onClick={() => goToFormat()} className="single-deck-cell">
                <div className="single-deck-format-link" style={{paddingRight:'7px'}}><b>Format:</b> {deck.formatName}</div>
                <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/${deck.format.icon}.png`}/>
              </div>       
            </td>
            {
                deck.category ? (
                    <td>
                      <div className="single-deck-cell">
                        <div className="single-deck-category" style={{paddingRight:'7px'}}><b>Category:</b> {deck.category}</div>
                        <img className="single-deck-category-emoji" style={{width:'28px'}} src={categoryImage}/>
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
            deck.eventName && deck.placement ? (
                <tr className="single-deck-info-2">
                <td>
                  <div onClick={() => goToEvent()} className="single-deck-cell">
                    <div className="single-deck-event-link" style={{paddingRight:'7px'}}><b>Event:</b> {deck.eventName}</div> 
                    <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/logos/${deck.community}.png`}/>
                  </div>   
                </td>
                <td>
                  <div className="single-deck-cell">
                    <div style={{paddingRight:'7px'}}><b>Place:</b> {ordinalize(deck.placement)}</div> 
                    <img style={{width:'28px'}} src={placementImage}/>
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
                <img className="likeImg" onClick={() => addLike()} style={{width:'28px'}} src={Heart}/>
              </div>   
            </td>
            <td>
              <div className="deck-stats-cell">
                <div style={{paddingRight:'7px'}}><b className="deck-stats-label">Downloads: </b>{deck.downloads}</div> 
                <a
                  href={`/api/decks/download/${id}`} 
                  download={`${deck.builder}-${deck.type || deck.name}.ydk`}
                  onClick={()=> addDownload()}
                >
                  <img style={{width:'28px'}} src={Disk}/>
                </a>
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
  )
}
