
import { useEffect, useState } from 'react'
import axios from 'axios'

export const TeamCreator = () => {
    const [name, setName] = useState(null)
    const [captain, setCaptain] = useState(null)
    const [captains, setCaptains] = useState([])
    const [playerA, setPlayerA] = useState(null)
    const [playerAs, setPlayerAs] = useState([])
    const [playerB, setPlayerB] = useState(null)
    const [playerBs, setPlayerBs] = useState([])
    const [playerC, setPlayerC] = useState(null)
    const [playerCs, setPlayerCs] = useState([])
    const [community, setCommunity] = useState(null)
    const [event, setEvent] = useState(null)
    const [events, setEvents] = useState([])
    const [placement, setPlacement] = useState(1)
    console.log('captain', captain)
    console.log('playerA', playerA)
    console.log('playerB', playerB)
    console.log('playerC', playerC)

    const placementArr = event ? Array.from({length: event.size}, (_, i) => i + 1) : []

    //CREATE TEAM
    const createTeam = async () => {
        if (!name) return alert('Please provide a Team Name.')
        if (!playerA || !playerB || !playerC) return alert('Please select 3 players.')
        if (!event) return alert('Please select an Event.')
        if (!placement) return alert('Please select a Placement.')

        try {
            const {data} = await axios.post('/api/teams/create', {
                name: name,
                captain: captain?.id,
                playerAId: playerA?.id,
                playerBId: playerB?.id,
                playerCId: playerC?.id,
                eventId: event?.id,
                placement: placement
            })

            if (data.name) {
                alert(`Success! New Team: ${data.name}`)
            } else {
                alert(`Failure! This team already exists.`)
            }
            return reset()
        } catch (err) {
            console.log(err)
        }
    }

    //RESET
    const reset = async () => {
        setName(null)
        setCaptain(null)
        setCaptains([])
        setPlayerA(null)
        setPlayerAs([])
        setPlayerB(null)
        setPlayerBs([])
        setPlayerC(null)
        setPlayerCs([])
        setCommunity(null)
        setEvent(null)
        setPlacement(1)
        document.getElementById('name').value = null
        document.getElementById('captain').value = null
        document.getElementById('playerA').value = null
        document.getElementById('playerB').value = null
        document.getElementById('playerC').value = null
        document.getElementById('community').value = null
        document.getElementById('event').value = null
        document.getElementById('placement').value = null
    }

    // FIND PLAYERS
    const findPlayers = async (query, slot) => {
        const {data} = await axios.get(`/api/players/query/${query}`)
        if (slot === 'captain') {
            setCaptains(data)
            setCaptain(data[0])
        } else if (slot === 'playerA') {
            setPlayerAs(data)
            setPlayerA(data[0])
        } else if (slot === 'playerB') {
            setPlayerBs(data)
            setPlayerB(data[0])
        } else if (slot === 'playerC') {
            setPlayerCs(data)
            setPlayerC(data[0])
        }
    }

    // GET PLAYER
    const getPlayer = async (name, slot) => {
        if (slot === 'captain') {
            const elem = captains.filter((e) => e.name === name)[0]
            setCaptain(elem)
        } else if (slot === 'playerA') {
            const elem = playerAs.filter((e) => e.name === name)[0]
            setPlayerA(elem)
        } else if (slot === 'playerB') {
            const elem = playerBs.filter((e) => e.name === name)[0]
            setPlayerB(elem)
        } else if (slot === 'playerC') {
            const elem = playerCs.filter((e) => e.name === name)[0]
            setPlayerC(elem)
        }
    }

    // GET EVENT
    const getEvent = async (name) => {
        const elem = events.filter((e) => e.name === name)[0]
        return setEvent(elem)
    }

    // USE EFFECT
    useEffect(() => {
        const fetchEvents= async () => {
            const {data} = await axios.get(`/api/events/community/${community}`)
            setEvents(data)
        }

        fetchEvents()
    }, [community])

    return (
        <div className="admin-portal">
            <label>Team Name:
                <input
                    id="firstName"
                    value={name || ''}
                    type="text"
                    onChange={(e) => setName(e.target.value)}
                />
            </label>

            <label>Captain:
                <input
                    id="captain"
                    type="search"
                    onKeyDown={(e) => { if (e.key === 'Enter') findPlayers(e.target.value, 'captain')}}
                />
                <select
                    id="captain-select"
                    onChange={(e) => getPlayer(e.target.value, 'captain')}
                >
                {
                    captains.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>

            <label>Player A:
                <input
                    id="playerA"
                    type="search"
                    onKeyDown={(e) => { if (e.key === 'Enter') findPlayers(e.target.value, 'playerA')}}
                />
                <select
                    id="playerA-select"
                    onChange={(e) => getPlayer(e.target.value, 'playerA')}
                >
                {
                    playerAs.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>

            <label>Player B:
                <input
                    id="playerB"
                    type="search"
                    onKeyDown={(e) => { if (e.key === 'Enter') findPlayers(e.target.value, 'playerB')}}
                />
                <select
                    id="playerB-select"
                    onChange={(e) => getPlayer(e.target.value, 'playerB')}
                >
                {
                    playerBs.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>

            <label>Player C:
                <input
                    id="playerC"
                    type="search"
                    onKeyDown={(e) => { if (e.key === 'Enter') findPlayers(e.target.value, 'playerC')}}
                />
                <select
                    id="playerC-select"
                    onChange={(e) => getPlayer(e.target.value, 'playerC')}
                >
                {
                    playerCs.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>
            
            <label>
                Community:
                <select
                    id="community"
                    onChange={(e) => setCommunity(e.target.value || null)}
                >
                    <option value=""></option>
                    <option value="Format Library">Format Library</option>
                    <option value="Androidland">Androidland</option>
                    <option value="Aureum's Army">Aureum's Army</option>
                    <option value="beastmode">Beastmode</option>
                    <option value="Big Boy Gaming">Big Boy Gaming</option>
                    <option value="Card Brawlers">Card Brawlers</option>
                    <option value="DuelistGroundz">DuelistGroundz</option>
                    <option value="EdisonFormat.com">EdisonFormat.com</option>
                    <option value="Fire-Water Format">Fire-Water Format</option>
                    <option value="GoatFormat.com">GoatFormat.com</option>
                    <option value="Goat Community Italia">Goat Community Italia</option>
                    <option value="Goat Format Europe">Goat Format Europe</option>
                    <option value="Goat Format War League">Goat Format War League</option>
                    <option value="HATformat.com">HATFormat.com</option>
                    <option value="Ishizu Tear Format">Ishizu Tear Format</option>
                    <option value="Konami">Konami</option>
                    <option value="Reaper Format">Reaper Format</option>
                    <option value="Shuffle Deck Gaming">Shuffle Deck Gaming</option>
                    <option value="Tengu Plant Town">Tengu Plant Town</option>
                    <option value="The Dice Jar">The Dice Jar</option>
                    <option value="The H.A.T. Alliance">The H.A.T. Alliance</option>
                    <option value="Upper Deck Entertainment">Upper Deck Entertainment</option>
                    <option value="Vegas Format">Vegas Format</option>
                    <option value="Wind-Up Factory">Wind-Up Factory</option>
                    <option value="YGOFrom0">YGOFrom0</option>
                    <option value="Yugi-Kaibaland">Yugi-Kaibaland</option>
                    <option value="Yu-Gi-Oh! Legacy">Yu-Gi-Oh! Legacy</option>
                </select>
            </label>

            <label>Event:
                <select
                    id="event"
                    onChange={(e) => getEvent(e.target.value || null)}
                >
                <option value=""></option>
                {
                    events.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>

            <label>Placement:
                <select
                    id="placement"
                    onChange={(e) => {
                        setPlacement(e.target.value)}
                    }
                >
                {
                    placementArr.map((e) => <option value={e}>{e}</option>)
                }
                </select>
            </label>
            
            <div
                className="admin-button"
                type="submit"
                onClick={() => createTeam()}
            >
                Submit
            </div>
        </div>
    )
}