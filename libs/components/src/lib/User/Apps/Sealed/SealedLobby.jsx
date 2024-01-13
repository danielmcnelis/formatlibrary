
import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { CardImage } from '../../../Cards/CardImage'
import { FocalCard } from '../Builders/FocalCard'
import { getCookie } from '@fl/utils'
import { Helmet } from 'react-helmet'
// import {useSocket} from '@fl/hooks'
import './SealedLobby.css' 

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

// SEALED LOBBY
export const SealedLobby = () => {
    const [draft, setDraft] = useState({})
    const [participants, setParticipants] = useState([])
    const [entry, setEntry] = useState({})
    const [packs, setPacks] = useState([])
    const [card, setCard] = useState({})
    const [toggleHorn] = useAudio('/assets/sounds/horn.mp3')
    // const socket = useSocket()
    const { id } = useParams()

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
                alert('Must be logged in to play Sealed.')
            } else {
                const data = { playerId, draftId: draft.id }
                // socket.emit('join draft', data, setEntry)  
            }          
        } catch (err) {
            console.log(err)
        }
    }

    // LEAVE
    const leave = async () => {    
        try {
            const data = { playerId, draftId: draft.id }
            // socket.emit('leave draft', data, setEntry)            
        } catch (err) {
            console.log(err)
        }
    }

    // START
    const start = async () => {   
        try {
            const data = { draftId: draft.id }
            // socket.emit('start sealed', data)            
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

    // HOOK - GET PACKS
    useEffect(() => {
        const fetchData = async () => {
            if (entry.id && (draft.state === 'underway' || draft.state === 'complete')) {
                const {data} = await axios.get(`/api/sealed/packs?entryId=${entry.id}`)
                setPacks(data)
            }
        }

        fetchData()
    }, [draft.state, entry.id])

    // HOOK - FETCH PARTICIPANTS
    useEffect(() => {
        fetchParticipants(draft.id)
    }, [draft.id])

    // HOOK - SOCKET.IO
    useEffect(() => {
        // socket.on('new entry', (data) => {
        //     console.log(`${data.playerName} joined Sealed Lobby.`)
        //     fetchParticipants(data.draftId)
        // });

        // socket.on('removed entry', (data) => {
        //     console.log(`${data.playerName} exited Sealed Lobby.`)
        //     fetchParticipants(data.draftId)
        // });

        // socket.on('sealed begins', (data) => {
        //     console.log(`Sealed has begun!`)
        //     setDraft(data)
        //     alert('Sealed is Starting Now!')
        //     toggleHorn()
        // });
    }, [])

    // HOOK - FETCH INITIAL DRAFT DATA
    useEffect(() => {
        console.log('Fetch initial draft data useEffect()') 
        const fetchData = async () => {
            const {data} = await axios.get(`/api/drafts/${id}`)
            setDraft(data)
        }
        
        fetchData()
    }, [id])

    return (
        <div className="sealed-portal">
            {
                draft.state === 'pending' ? (
                    <>
                        <Helmet>
                            <title>{`Yu-Gi-Oh! Sealed Lobby - Format Library`}</title>
                            <meta name="og:title" content={`Yu-Gi-Oh! Sealed Lobby - Format Library`}/>
                            <meta name="description" content={`Click here to play Sealed Yu-Gi-Oh!`}/>
                            <meta name="og:description" content={`Click here to play Sealed Yu-Gi-Oh!`}/>
                        </Helmet>
                        <div className="card-database-flexbox">
                            <img style={{ width:'100px'}} src={`https://cdn.formatlibrary.com/images/emojis/${draft.cube?.logo || 'cube.png'}`} alt="sealed-logo"/>
                            <div>
                                <h1>Upcoming Sealed!</h1>
                            </div>
                            <img style={{ width:'100px'}} src={`https://cdn.formatlibrary.com/images/emojis/${draft.cube?.logo || 'cube.png'}`} alt="sealed-logo"/>
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
                                        className="sealed-participant-pfp" 
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
                                    className="sealed-button"
                                    type="submit"
                                    onClick={() => join()}
                                >
                                    Join
                                </div>
                            ) : entry.id && playerId !== draft.hostId ? (
                                <div
                                    className="sealed-button"
                                    type="submit"
                                    onClick={() => leave()}
                                >
                                    Leave
                                </div>
                            ) : entry.id && playerId === draft.hostId ? (
                                <div
                                    className="sealed-button"
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
                            <title>{`Yu-Gi-Oh! Sealed Lobby - Format Library`}</title>
                            <meta name="og:title" content={`Yu-Gi-Oh! Sealed Lobby - Format Library`}/>
                            <meta name="description" content={`Click here to play Sealed Yu-Gi-Oh!`}/>
                            <meta name="og:description" content={`Click here to play Sealed Yu-Gi-Oh!`}/>
                        </Helmet>
                        <div className="card-database-flexbox">
                            <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/emojis/${draft.cube?.logo || 'cube.png'}`} alt="sealed-logo"/>
                            <div>
                                <h1>{'Sealed Complete!'}</h1>
                            </div>
                            <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/emojis/${draft.cube?.logo || 'cube.png'}`} alt="sealed-logo"/>
                        </div>
                        
            <div className="single-deck-title-flexbox">
                <a
                    className="show-cursor"
                    href={`/api/sealed/download?entryId=${entry.id}`} 
                    download={`${entry.playerName}_Sealed_Inventory_${(new Date()).toISOString().slice(0, 10)}.ydk`}
                >                                    
                    <div className="deck-button">
                        <b style={{padding: '0px 6px'}}>Download</b>
                        <img 
                            style={{width:'28px'}} 
                            src={`https://cdn.formatlibrary.com/images/emojis/download.png`}
                            alt="download"
                        />
                    </div>
                </a>
                <Link to="/sealed-builder" state={{ packs: packs }} className="desktop-only">                                    
                    <div className="deck-button">
                        <b style={{padding: '0px 6px'}}>Deck Builder</b>
                        <img 
                            style={{width:'28px'}} 
                            src={`https://cdn.formatlibrary.com/images/emojis/open-file.png`}
                            alt="open"
                        />
                    </div>
                </Link>
            </div>

                        <div className="space-between-aligned">
                            <FocalCard card={card}/>
                            <div className="sealed-interface">
                                {
                                    packs?.length ? (
                                        <>
                                            <h3 className="sealed-info">Inventory:</h3>  
                                            <div className="pack-flexbox">
                                                {
                                                    packs.map((pack, index) => (pack.map((print) => (   
                                                        <CardImage  
                                                            key={`${index}-${print.id}`} 
                                                            card={print.card}
                                                            rarity={print.rarity}
                                                            setCard={setCard}
                                                            width="72px"
                                                            margin="0.5px"
                                                            padding="0.5px"
                                                        />
                                                    ))))
                                                }
                                            </div> 
                                            <br/>
                                        </>
                                    ) : '' 
                                }

                                {
                                    packs?.length ? (
                                        <div className="space-evenly">
                                            <div
                                                className="show-cursor"
                                                onClick={() => sortInventory()}
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
                                                href={`/api/sealed/download?entryId=${entry.id}`} 
                                                download={`${entry.playerName}_Sealed_Inventory_${(new Date()).toISOString().slice(0, 10)}.ydk`}
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
