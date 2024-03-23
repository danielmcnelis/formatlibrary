
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { CardImage } from '../../../Cards/CardImage'
import { FocalCard } from '../Builders/FocalCard'
import { getCookie } from '@fl/utils'
import ReactCountdownClock from 'react-countdown-clock'
import { Helmet } from 'react-helmet'
import { useSocket } from '@fl/hooks'
import { SocketProvider } from '@fl/context'
import {config} from '@fl/config'
import io from 'socket.io-client'
const websocket = io(config.siteUrl, { transports: ["websocket"] })

import './DraftLobby.css'

const playerId = getCookie('playerId')

// USE AUDIO
const useAudio = (url) => {
  const [audio] = useState(new Audio(url))
  const [playing, setPlaying] = useState(false)
  const toggle = () => setPlaying(!playing)

  // HOOK - PLAY AUDIO
  useEffect(() => {
        try {
            playing ? audio.play()?.catch((err) => console.log(err)) : 
                audio.pause()?.catch((err) => console.log(err))
        } catch (err) {
            console.log(err)
        }
    }, [playing, audio])

  // HOOK - AUDIO EVENT LISTENERS
  useEffect(() => {
    try {
        audio.addEventListener('ended', () => setPlaying(false))
        return () => {
            audio.removeEventListener('ended', () => setPlaying(false))
        }
    } catch (err) {
        console.log(err)
    }
  })

  return [toggle]
}

// SORT FUNCTION
const sortFn = (a, b) => {
    if (a.card.sortPriority > b.card.sortPriority) {
        return 1
    } else if (b.card.sortPriority > a.card.sortPriority) {
        return -1
    } else if (a.card.name > b.card.name) {
        return 1
    } else if (b.card.name > a.card.name) {
        return -1
    } else {
        return false
    }
}

// DRAFT LOBBY
export const DraftLobby = () => {
    const [draft, setDraft] = useState({})
    const [participants, setParticipants] = useState([])
    const [entry, setEntry] = useState({})
    const [inventory, setInventory] = useState([])
    const [pack, setPack] = useState({})
    const [card, setCard] = useState({})
    const [selection, setSelection] = useState(null)
    const [timer, setTimer] = useState(null)
    const [onTheClock, setOnTheClock] = useState(false)
    // const [toggleDraw] = useAudio('/assets/sounds/draw.mp3')
    const [toggleChime] = useAudio('/assets/sounds/chime.mp3')
    const [toggleHorn] = useAudio('/assets/sounds/horn.mp3')
    const [socket] = useState(useSocket())
    // const [{id}] = useState(useParams())
    const { id } = useParams()
    const timerColor = JSON.parse(localStorage.getItem('theme')) === 'dark' ? '#00bca6' : '#334569'
    const logoUrl = draft?.type === 'cube' ? `https://cdn.formatlibrary.com/images/emojis/${draft?.cube?.logo || 'cube.png'}` :
        `https://cdn.formatlibrary.com/images/artworks/${draft?.set?.setCode || 'back'}.jpg`
    const logoWidth = draft?.type === 'cube' ? '128px' : '100px'

    // FETCH PARTICIPANTS
    const fetchParticipants = async (draftId) => {
        try {
            const {data} = await axios.get(`/api/drafts/participants/${draftId}`)
            setParticipants(data)
        } catch (err) {
            console.log(err)
        }
    }

    // JOIN
    const join = () => {     
        try {            
            if (!playerId) {
                alert('Must be logged in to join a Draft.')
            } else {
                const data = { playerId, draftId: draft.id }
                socket.emit('join draft', data, setEntry)   
            }
        } catch (err) {
            console.log(err)
        }
    }

    // LEAVE
    const leave = async () => {  
        try {
            const data = { playerId, draftId: draft.id }
            socket.emit('leave draft', data, setEntry)            
        } catch (err) {
            console.log(err)
        }
    }

    // START
    const start = async () => {          
        try {
            const data = { draftId: draft.id }
            socket.emit('start draft', data)            
        } catch (err) {
            console.log(err)
        }
    }

    // PROCESS SELCTION
    const processSelection = async (inv) => {
        try {
            setPack(pack.filter((p) => p.cardId !== inv.cardId))
            setOnTheClock(false)
            setSelection(inv.cardName)
            setInventory([...inventory, inv])
            // toggleDraw()
        } catch (err) {
            console.log(err)
        }
    }
    
    // SELECT CARD
    const selectCard = async (card) => {    
        try {
            const data = { draftId: draft.id, round: draft.round, pick: draft.pick, playerId: playerId, cardId: card.id }            
            socket.emit('select card', data, processSelection)            
        } catch (err) {
            console.log(err)
        }
    }

    // HOOK - CHECK IF PARTICIPANT
    useEffect(() => {
        for (let i = 0; i < participants.length; i++) {
            if (participants[i].playerId === playerId) {
                return setEntry(participants[i])
            }
        }
    }, [participants])

    // HOOK - GET INVENTORY
    useEffect(() => {
        const fetchData = async () => {
            if (entry.id) {
                const {data} = await axios.get(`/api/drafts/inventory?entryId=${entry.id}`)
                if (data.length > inventory.length) setInventory(data)
            }
        }

        fetchData()
    }, [entry.id, draft.pick, inventory.length])

    // HOOK - GET PACK
    useEffect(() => {
        const fetchData = async () => {
            if (entry.id && draft.state === 'underway') {
                const {data} = await axios.get(`/api/drafts/pack?entryId=${entry.id}`)
                setPack(data)
            }
        }

        fetchData()
    }, [draft.state, draft.pick, entry.id])

    // HOOK - FETCH PARTICIPANTS
    useEffect(() => {
        if (draft.id) fetchParticipants(draft.id)
    }, [draft.id])

    // HOOK - SET CLOCK AND TIMER
    useEffect(() => {
        const lastUpdated = new Date(draft.updatedAt)
        const lastUpdatedTimeStamp = lastUpdated.getTime()
        const timeExpiresAt = lastUpdatedTimeStamp + ((draft.timer || 60) * 1000)
        const today = new Date()
        const nowTimeStamp = today.getTime()
        const timeRemaining = timeExpiresAt - nowTimeStamp
        
        if (timeRemaining > 0 && draft.pick > inventory.length) {
            setOnTheClock(true)
            setTimer(timeRemaining / 1000)
        }
    }, [draft, inventory.length])

    // HOOK - SOCKET.IO
    useEffect(() => {
        socket.on('connect', () => {
            console.log('connected socket:', socket.id)
        })

        socket.on("connect_error", () => {
            console.log('socket connect_error')
        })

        socket.on('new entry', (data) => {
            console.log(`${data.playerName} joined Draft Lobby.`)
            fetchParticipants(data.draftId)
        })

        socket.on('removed entry', (data) => {
            console.log(`${data.playerName} exited Draft Lobby.`)
            fetchParticipants(data.draftId)
        })

        socket.on('draft begins', (data) => {
            console.log(`Draft has begun!`)
            setTimer(data.timer)
            setOnTheClock(true)
            setDraft(data)
            alert('The Draft is Starting Now!')
            toggleHorn()
        })

        socket.on('next pick', (data) => {
            console.log(`Next pick!`)
            setSelection(null)
            setDraft(data)
            setOnTheClock(true)
            setTimer(draft.timer)
            toggleChime()
        })

        socket.on('draft complete', (data) => {
            console.log(`Draft complete!`)
            setOnTheClock(false)
            setSelection(null)
            setDraft(data)
        })

        socket.on('disconnect', (reason, details) => {
            console.log('reason:', reason)
            console.log('details:', details)
        })
    }, [])

    // HOOK - FETCH INITIAL DRAFT DATA
    useEffect(() => {
        const fetchData = async () => {
            const {data} = await axios.get(`/api/drafts/${id}`)
            setDraft(data)
        }
        
        fetchData()
    }, [])

    useEffect(() => {
        return () => {
            console.log('disconnectSocket()')
            socket.disconnect()
        }
    }, [])

    return (
        <SocketProvider value={websocket}>
        <div className="cube-portal">
            {
                draft.state === 'pending' ? (
                    <>
                        <Helmet>
                            <title>{`Yu-Gi-Oh! Draft Lobby - Format Library`}</title>
                            <meta name="og:title" content={`Yu-Gi-Oh! Draft Lobby - Format Library`}/>
                            <meta name="description" content={`Click here to join the next draft for ${draft?.cubeName || draft?.setName}.`}/>
                            <meta name="og:description" content={`Click here to join the next draft for ${draft?.cubeName || draft?.setName}.`}/>
                        </Helmet>
                        <div className="card-database-flexbox">
                            <img className="desktop-only" style={{ width:logoWidth}} src={logoUrl} alt="draft-logo"/>
                            <div>
                                <h1>Upcoming Draft!</h1>
                                <h2>{draft?.cubeName || draft?.setName}</h2>
                            </div>
                            <img className="desktop-only" style={{ width:logoWidth}} src={logoUrl} alt="draft-logo"/>
                        </div>
                        <br/>

                        <div className="slideshow">
                        {
                            draft.cubeId ? (
                                <div className="mover" style={{background: `url(https://cdn.formatlibrary.com/images/cubes/slideshows/${draft.cubeId?.toString() || '1'}.png)`}}></div>
                            ) : (
                                <div className="mover" style={{background: `url(https://cdn.formatlibrary.com/images/sets/slideshows/${draft.set?.setCode || 'MRD'}.png)`}}></div>
                            )
                        }
                        </div>
                        
                        <br/>
                        <h3>Hosted by {draft.hostName}</h3>
                        <div className="participants-flexbox">
                            {
                                participants.map((p) => (
                                    <img 
                                        className="draft-participant-pfp" 
                                        src={`https://cdn.formatlibrary.com/images/pfps/${p.player?.discordId || p.player?.name}.png`}
                                        onError={(e) => {
                                                e.target.onerror = null
                                                e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                                            }
                                        }
                                        alt={p.player?.discordName || p.player?.name}
                                    />
                                ))
                            }
                        </div>
                        {
                            !entry.id ? (
                                <div
                                    className="draft-button"
                                    type="submit"
                                    onClick={() => join()}
                                >
                                    Join
                                </div>
                            ) : entry.id && playerId !== draft.hostId ? (
                                <div
                                    className="draft-button"
                                    type="submit"
                                    onClick={() => leave()}
                                >
                                    Leave
                                </div>
                            ) : entry.id && playerId === draft.hostId ? (
                                <div
                                    className="draft-button"
                                    type="submit"
                                    onClick={() => start()}
                                >
                                    Start
                                </div>
                            ) : ''
                        }
                    </>
                ) : (
                    <>
                        <Helmet>
                            <title>{`Yu-Gi-Oh! Draft Lobby - Format Library`}</title>
                            <meta name="og:title" content={`Yu-Gi-Oh! Draft Lobby - Format Library`}/>
                            <meta name="description" content={`Click here to join the next draft for ${draft.cubeName || draft.setName}.`}/>
                            <meta name="og:description" content={`Click here to join the next draft for ${draft.cubeName || draft.setName}.`}/>
                        </Helmet>
                        <div className="space-between">
                            {
                                draft?.state === 'underway' && timer >= 0 && timer <= draft.timer ? (
                                    <ReactCountdownClock 
                                        color={timerColor}
                                        seconds={timer}
                                        alpha={0.9}
                                        size={96}
                                        onComplete={() => setOnTheClock(false)}
                                    />
                                ) : <div className="empty-clock"/>
                            }
                            
                            <div className="card-database-flexbox">
                                <img className="desktop-only" style={{ width:logoWidth}} src={logoUrl} alt="draft-logo"/>
                                <div>
                                    <h1>{draft.state === 'underway' ? 'Live Draft!' : draft.state === 'complete' ? 'Draft Complete!' : ''}</h1>
                                    <h2>{draft.state === 'underway' ? `Round ${draft.round} • Pick ${draft.pick}` : ''}</h2>
                                </div>
                                <img className="desktop-only" style={{ width:logoWidth}} src={logoUrl} alt="draft-logo"/>
                            </div>
                            <div className="empty-clock desktop-only"/>
                        </div>
                        <div className="last-selection"><i>{selection ? `You selected: ${selection}!` : ''}</i></div>
                        <div className="space-between-aligned">
                            <FocalCard className="desktop-only" card={card}/>
                            <div className="draft-interface">
                                {
                                    draft.state === 'underway' && pack?.length ? (
                                        <>
                                            <h3 className="draft-info">Pack:</h3>
                                            <div className="pack-flexbox">
                                                {
                                                    pack.map((p) => (   
                                                        <CardImage  
                                                            key={p.card.id} 
                                                            card={p.card} 
                                                            disableLink={!onTheClock} 
                                                            selectCard={selectCard}
                                                            setCard={setCard}
                                                            isDraft={true}
                                                            width="72px"
                                                            margin="0.5px"
                                                            padding="0.5px"
                                                        />
                                                    ))
                                                }
                                            </div>
                                            <br/>
                                        </>
                                    ) : ''
                                }
                                
                                {
                                    inventory?.length ? (
                                        <>
                                            <h3 className="draft-info">Inventory:</h3>  
                                            <div className="pack-flexbox">
                                                {
                                                    inventory.map((inv) => (   
                                                        <CardImage  
                                                            key={inv.id} 
                                                            card={inv.card}
                                                            disableLink={true} 
                                                            setCard={setCard}
                                                            width="72px"
                                                            margin="0.5px"
                                                            padding="0.5px"
                                                        />
                                                    ))
                                                }
                                            </div> 
                                            <br/>
                                        </>
                                    ) : '' 
                                }

                                {
                                    inventory?.length ? (
                                        <div className="space-evenly">
                                            <div
                                                className="show-cursor"
                                                onClick={() => setInventory([...inventory.sort(sortFn)])}
                                            >                                                                 
                                                <div 
                                                    className="inventory-button"
                                                >
                                                    <b style={{padding: '0px 6px'}}>Sort Inventory</b>
                                                    <img 
                                                        style={{width:'28px'}} 
                                                        src={`https://cdn.formatlibrary.com/images/emojis/sort.png`}
                                                        alt="sort"
                                                    />
                                                </div>
                                            </div>
                                            <a
                                                className="show-cursor"
                                                href={`/api/drafts/download?entryId=${entry.id}`} 
                                                download={`${entry.playerName}_Draft_Inventory_${(new Date()).toISOString().slice(0, 10)}.ydk`}
                                            >                                    
                                                <div
                                                    className="inventory-button"
                                                >
                                                    <b style={{padding: '0px 6px'}}>Download Inventory</b>
                                                    <img 
                                                        style={{width:'28px'}} 
                                                        src={`https://cdn.formatlibrary.com/images/emojis/download.png`}
                                                        alt="download"
                                                    />
                                                </div>
                                            </a>
                                        </div>
                                    ) : ''
                                }
                            </div>
                        </div>
                        <br/>
                    </>
                )
            }
        </div>
        </SocketProvider>
    )
}
