
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { getCookie } from '@fl/utils'
import './DraftLobby.css' 

//GET RANDOM ELEMENT
const getRandomElement = (arr) => {
    const index = Math.floor((arr.length) * Math.random())
    return arr[index]
}

export const DraftLobby = () => {
    const [draft, setDraft] = useState({})
    const [packs, setPacks] = useState([])
    const [pack, setPack] = useState({})
    const [pick, setPick] = useState(null)
    const [round, setRound] = useState(null)
    const [inventory, setInventory] = useState([])
    const [participants, setParticipants] = useState([])
    const [isParticipant, setIsPartipant] = useState(false)
    const altPlayerId = getRandomElement([
        'UeyvnNBD6CD53gsqRQsxCY', 'Cc2FhYrRPctZ4y72Y79gKp',
        'ruStGFXbGiM7mwog5Jd4Jt', 'zF1wim2pNCk2gWDunfozgL',
        'bo7HSv1LpfrGMra8auc69k', 'iTkrXF8eLxJKUia4rbxuTw',
        'zYJ9nZFqGPC47RAHRBn5ki', 'zhLjqncZ7Erxh2zDAYEfqL',
        'M51s4imwKi3nTd3KK4qYAu'
    ])

    const playerId = getCookie('playerId') || altPlayerId
    console.log('playerId', playerId)

    const { id } = useParams()
    console.log('draft', draft)
    console.log('packs', packs)
    console.log('pack', pack)
    console.log('pick', pick)
    console.log('round', round)
    console.log('inventory', inventory)
    console.log('participants', participants)
    console.log('isParticipant', isParticipant)

    // JOIN
    const join = async () => {        
        try {
            const { data } = await axios.post(`/api/drafts/join/${draft.id}`, {
                playerId: playerId
            })

            if (data.id) setIsPartipant(true)
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
        if (isParticipant) return

        for (let i = 0; i < participants.length; i++) {
            if (participants.playerId === playerId) {
                setIsPartipant(true)
                break
            }
        }

    }, [isParticipant, playerId, participants])

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
            if (isParticipant) {
                const {data} = await axios.get(`/api/drafts/pack/${draft.id}`, {
                    round: round,
                    pick: pick,
                    playerId: playerId
                })

                setPack(data)
            }
        }

        fetchData()
    }, [draft, round, pick, playerId, isParticipant])

    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            const {data} = await axios.get(`/api/drafts/${id}`)
            setDraft(data.draft)
            setParticipants(data.participants)
            setPacks(data.packContents)
            setPick(data.pick)
            setRound(data.round)
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
                    </>
                ) : ''
            }

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
                ) : ''
            }

            {
                playerId === draft.hostId ? (
                    <div
                        className="cube-button"
                        type="submit"
                        onClick={() => start()}
                    >
                        Start
                    </div>
                ) : ''
            }
        </div>
    )
}
