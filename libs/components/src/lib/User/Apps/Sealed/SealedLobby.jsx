
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { CardImage } from '../../../Cards/CardImage'
import { FocalCard } from '../Builders/FocalCard'
import { getCookie } from '@fl/utils'
import ReactCountdownClock from 'react-countdown-clock'
import { Helmet } from 'react-helmet'
import {useSocket} from '@fl/hooks'
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
            playing ? audio.play().catch((err) => console.log(err)) : 
                audio.pause().catch((err) => console.log(err))
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
    if (a.sortPriority > b.sortPriority) {
        return 1
    } else if (b.sortPriority > a.sortPriority) {
        return -1
    } else if (a.name > b.name) {
        return 1
    } else if (b.name > a.name) {
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
    const socket = useSocket()
    const { id } = useParams()
    const timerColor = JSON.parse(localStorage.getItem('theme')) === 'dark' ? '#00bca6' : '#334569'

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
            const data = { playerId, draftId: draft.id }
            socket.emit('join draft', data, setEntry)            
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
    const processSelection = async (card) => {
        try {
            setPack(pack.filter((p) => p.cardId !== card.id))
            setOnTheClock(false)
            setSelection(card.name)
            setInventory([...inventory, card])
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
    }, [entry.id, draft.pick])

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
        fetchParticipants(draft.id)
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
    }, [draft.pick, draft.updatedAt, inventory.length])

    // HOOK - SOCKET.IO
    useEffect(() => {
        socket.on('new entry', (data) => {
            console.log(`${data.playerName} joined Draft Lobby.`)
            fetchParticipants(data.draftId)
        });

        socket.on('removed entry', (data) => {
            console.log(`${data.playerName} exited Draft Lobby.`)
            fetchParticipants(data.draftId)
        });

        socket.on('draft begins', (data) => {
            console.log(`Draft has begun!`)
            setDraft(data)
            alert('The Draft is Starting Now!')
            toggleHorn()
        });

        socket.on('next pick', (data) => {
            console.log(`Next pick!`)
            setSelection(null)
            setDraft(data)
            toggleChime()
        });

        socket.on('draft complete', (data) => {
            console.log(`Draft complete!`)
            setSelection(null)
            setDraft(data)
        });
    }, [])

    // HOOK - FETCH INITIAL DRAFT DATA
    useEffect(() => {
        const fetchData = async () => {
            const {data} = await axios.get(`/api/drafts/${id}`)
            setDraft(data)
        }
        
        fetchData()
    }, [])

    return (
        <div className="cube-portal">
            {
                draft.state === 'pending' ? (
                    <>
                        <Helmet>
                            <title>{`Yu-Gi-Oh! Draft Lobby - Format Library`}</title>
                            <meta name="og:title" content={`Yu-Gi-Oh! Draft Lobby - Format Library`}/>
                            <meta name="description" content={`Click here to join the next draft for ${draft.cubeName}.`}/>
                            <meta name="og:description" content={`Click here to join the next draft for ${draft.cubeName}.`}/>
                        </Helmet>
                        <div className="card-database-flexbox">
                            <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/emojis/${draft.cube?.logo || 'cube.png'}`} alt="cube-logo"/>
                            <div>
                                <h1>Upcoming Draft!</h1>
                                <h2>{draft.cubeName}</h2>
                            </div>
                            <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/emojis/${draft.cube?.logo || 'cube.png'}`} alt="cube-logo"/>
                        </div>
                        <br/>
                        <div className="slideshow">
                            <div className="mover"></div>
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
                                    className="cube-button"
                                    type="submit"
                                    onClick={() => join()}
                                >
                                    Join
                                </div>
                            ) : entry.id && playerId !== draft.hostId ? (
                                <div
                                    className="cube-button"
                                    type="submit"
                                    onClick={() => leave()}
                                >
                                    Leave
                                </div>
                            ) : entry.id && playerId === draft.hostId ? (
                                <div
                                    className="cube-button"
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
                            <meta name="description" content={`Click here to join the next draft for ${draft.cubeName}.`}/>
                            <meta name="og:description" content={`Click here to join the next draft for ${draft.cubeName}.`}/>
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
                                <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/emojis/${draft.cube?.logo || 'cube.png'}`} alt="cube-logo"/>
                                <div>
                                    <h1>{draft.state === 'underway' ? 'Live Draft!' : draft.state === 'complete' ? 'Draft Complete!' : ''}</h1>
                                    <h2>{draft.state === 'underway' ? `Round ${draft.round} • Pick ${draft.pick}` : ''}</h2>
                                </div>
                                <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/emojis/${draft.cube?.logo || 'cube.png'}`} alt="cube-logo"/>
                            </div>
                            <div className="empty-clock"/>
                        </div>
                        <div className="last-selection"><i>{selection ? `You selected: ${selection}!` : ''}</i></div>
                        <div className="space-between-aligned">
                            <FocalCard card={card}/>
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
                                                    inventory.map((card) => (   
                                                        <CardImage  
                                                            key={card.id} 
                                                            card={card}
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
                                                    style={{width: '170px'}}
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
                                                    style={{width: '220px'}}
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
    )
}