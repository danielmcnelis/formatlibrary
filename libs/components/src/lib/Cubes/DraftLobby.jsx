
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { CardImage } from '../Cards/CardImage'
import { getCookie } from '@fl/utils'
import './DraftLobby.css' 

//GET RANDOM ELEMENT
const getRandomElement = (arr) => {
    const index = Math.floor((arr.length) * Math.random())
    return arr[index]
}

const altPlayerId = getRandomElement([
    'UeyvnNBD6CD53gsqRQsxCY', 'Cc2FhYrRPctZ4y72Y79gKp',
    'ruStGFXbGiM7mwog5Jd4Jt', 'zF1wim2pNCk2gWDunfozgL',
    'bo7HSv1LpfrGMra8auc69k', 'iTkrXF8eLxJKUia4rbxuTw',
    'zYJ9nZFqGPC47RAHRBn5ki', 'zhLjqncZ7Erxh2zDAYEfqL',
    'M51s4imwKi3nTd3KK4qYAu'
])

const playerId = getCookie('playerId') || altPlayerId

export const DraftLobby = () => {
    const [draft, setDraft] = useState({})
    const [pack, setPack] = useState({})
    const [player, setPlayer] = useState({})
    const [timer, setTimer] = useState(null)
    const [packNumber, setPackNumber] = useState(null)
    const [inventory, setInventory] = useState([])
    const [participants, setParticipants] = useState([])
    const [isParticipant, setIsParticipant] = useState(false)

    const { id } = useParams()
    console.log('timer', timer)
    console.log('draft', draft)
    console.log('pack', pack)
    console.log('packNumber', packNumber)
    console.log('player', player)
    console.log('inventory', inventory)
    console.log('participants', participants)
    console.log('isParticipant', isParticipant)

    // JOIN
    const join = async () => {        
        try {
            const { status } = await axios.post(`/api/drafts/join/${draft.id}`, {
                playerId: playerId
            })

            console.log('status', status)
            if (status === 200) setIsParticipant(true)
        } catch (err) {
            console.log(err)
        }
    }

    // LEAVE
    const leave = async () => {        
        try {
            const { status } = await axios.post(`/api/drafts/leave/${draft.id}`, {
                playerId: playerId
            })

            console.log('status', status)
            if (status === 200) setIsParticipant(false)
        } catch (err) {
            console.log(err)
        }
    }

    // START
    const start = async () => {        
        try {
            const { data } = await axios.post(`/api/drafts/start/${draft.id}`)
            setDraft(data)
        } catch (err) {
            console.log(err)
        }
    }

    // USE EFFECT CHECK IF PARTICIPANT
    useEffect(() => {
        for (let i = 0; i < participants.length; i++) {
            if (participants[i].playerId === playerId) {
                setPlayer(participants[i].player)
                return setIsParticipant(true)
            }
        }

        setIsParticipant(false)
    }, [isParticipant, participants])

    // USE EFFECT GET INVENTORY
    useEffect(() => {
        const fetchData = async () => {
            if (isParticipant) {
                const {data} = await axios.get(`/api/drafts/inventory/${draft.id}`, {
                    playerId: playerId
                })

                setInventory(data)
            }
        }

        fetchData()
    }, [draft, playerId, isParticipant])

    // USE EFFECT GET PACK
    useEffect(() => {
        const fetchData = async () => {
            if (isParticipant && draft.state === 'underway') {
                const {data} = await axios.get(`/api/drafts/pack?draftId=${draft.id}&playerId=${playerId}`)
                setPack(data.contents)
                setPackNumber(data.packNumber)
            }
        }

        fetchData()
    }, [draft.id, draft.state, isParticipant])

    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            const {data} = await axios.get(`/api/drafts/participants/${draft.id}`)
            setParticipants(data)
        }
        
        fetchData()
    }, [draft.id, isParticipant])

    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            const {data} = await axios.get(`/api/drafts/${id}`)
            const timeExpiresAt = (new Date(data.updatedAt)).now() + ((data.timer * 1000) || (60 * 1000))
            console.log('timeExpiresAt', timeExpiresAt)
            console.log('(new Date()).now() ', (new Date()).now() )
            const timeRemaining = timeExpiresAt - (new Date()).now()
            console.log('timeRemaining', timeRemaining)
            setDraft(data)
            setTimer(timeRemaining)
        }
        
        fetchData()
    }, [id])

    return (
        <div className="cube-portal">
            {
                draft.state === 'pending' ? (
                    <>
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
                                        src={`https://cdn.formatlibrary.com/images/pfps/${p.player.discordId || p.player.name}.png`}
                                        onError={(e) => {
                                                e.target.onerror = null
                                                e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                                            }
                                        }
                                        alt={p.discordName || p.name}
                                    />
                                ))
                            }
                        </div>
                        {
                            !isParticipant ? (
                                <div
                                    className="cube-button"
                                    type="submit"
                                    onClick={() => join()}
                                >
                                    Join
                                </div>
                            ) : isParticipant && playerId !== draft.hostId ? (
                                <div
                                    className="cube-button"
                                    type="submit"
                                    onClick={() => leave()}
                                >
                                    Leave
                                </div>
                            ) : isParticipant && playerId === draft.hostId ? (
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
                        <div className="card-database-flexbox">
                            <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/emojis/${draft.cube?.logo || 'cube.png'}`} alt="cube-logo"/>
                            <div>
                                <h1>Live Draft!</h1>
                                <h2>{draft.cubeName}</h2>
                            </div>
                            <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/emojis/${draft.cube?.logo || 'cube.png'}`} alt="cube-logo"/>
                        </div>
                        <h3>Round {draft.round} - Pick {draft.pick}</h3>
                        <br/>
                        <div className="pack-flexbox">
                            {
                                pack.length ? (
                                    pack.map((p) => (   
                                        <CardImage  
                                            key={p.card.id} 
                                            card={p.card} 
                                            width="72px"
                                            margin="2px"
                                            padding="2px"
                                        />
                                    ))
                                ) : ''
                            }
                        </div>
                        <br/>
                        <h3>{player?.name}'s Inventory:</h3>
                        <div className="pack-flexbox">
                            {
                                inventory?.length ? (
                                    inventory.map((card) => (   
                                        <CardImage  
                                            key={card.id} 
                                            card={card} 
                                            width="72px"
                                            margin="4px"
                                            padding="2px"
                                        />
                                    ))
                                ) : ''
                            }
                        </div>
                        <br/>
                    </>
                )
            }

        </div>
    )
}
