
import { useState, useEffect } from 'react'
import axios from 'axios'
import { shouldDisplay } from '@fl/utils'

export const DeckCreator = () => {
    const [community, setCommunity] = useState(null)
    const [deckType, setDeckType] = useState(null)
    const [deckTypes, setDeckTypes] = useState([])
    const [display, setDisplay] = useState(true)
    const [event, setEvent] = useState(null)
    const [events, setEvents] = useState([])
    const [placement, setPlacement] = useState(1)
    const [player, setPlayer] = useState(null)
    const [players, setPlayers] = useState([])
    const [ydk, setYDK] = useState(null)
    
    const placementArr = event ? Array.from({length: event.size}, (_, i) => i + 1) : []

    const reset = async () => {
        setCommunity(null)
        setDeckType(null)
        setDisplay(true)
        setEvent(null)
        setEvents([])
        setPlacement(1)
        setPlayer(null) 
        setPlayers([])
        setYDK(null)  

        document.getElementById('builder').value = ''
        document.getElementById('deckType').value = null
        document.getElementById('display').value = true
        document.getElementById('community').value = null
        document.getElementById('event').value = null
        document.getElementById('ydk').value = null
    }

    const createDeck = async () => {
        if (!player) return alert('No Player found.')
        if (!event) return alert('No Event found.')
        if (!ydk) return alert('Missing YDK file.')
        if (!deckType) return alert('Please select a Deck Type.')
        if (!placement) return alert('Please select a Placement.')
        
        try {
            const { data } = await axios.post('/api/decks/create', {
                builder: player.name,
                playerId: player.id,
                type: deckType.name,
                deckTypeId: deckType.id,
                category: deckType.category,
                format: event.formatName,
                ydk: ydk,
                eventName: event.abbreviation,
                eventId: event.id,
                publishDate: event.startDate,
                placement: placement,
                community: community,
                display: display
            })

            alert(`Success! New Event: https://formatlibrary.com/decks/${data.id}`)
            return reset()
        } catch (err) {
            console.log(err)
        }
    }

    const readYDK = (file) => {
        const reader = new FileReader()
        reader.readAsBinaryString(file)
        reader.onloadend = () => setYDK(reader.result)
    }

    const findPlayers = async (query) => {
        const {data} = await axios.get(`/api/players/query/${query}`)
        setPlayers(data)
        setPlayer(data[0])
    }

    const getPlayer = async (name) => {
        const elem = players.filter((e) => e.name === name)[0]
        return setPlayer(elem)
    }

    const getDeckType = async (name) => {
        const elem = deckTypes.filter((e) => e.name === name)[0]
        return setDeckType(elem)
    }

    const getEvent = async (name) => {
        const elem = events.filter((e) => e.name === name)[0]
        return setEvent(elem)
    }

    // USE EFFECT
    useEffect(() => {
        const fetchDeckTypes = async () => {
            const {data} = await axios.get(`/api/decktypes/`)
            setDeckTypes(data)
        }
        
        fetchDeckTypes()
    }, [])

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
            <label>Builder:
                <input
                    id="builder"
                    className="login"
                    type="search"
                    onKeyDown={(e) => { if (e.key === 'Enter') findPlayers(e.target.value)}}
                />
                <select
                    id="builder-select"
                    className="login"
                    onChange={(e) => getPlayer(e.target.value)}
                >
                {
                    players.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>
            <label>Deck Type:
                <select
                    id="deckType"
                    className="login"
                    onChange={(e) => getDeckType(e.target.value)}
                >
                <option value={null}></option>
                {
                    deckTypes.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>
            <label>
                Community:
                <select
                    id="community"
                    className="login"
                    onChange={(e) => setCommunity(e.target.value)}
                >
                    <option value={null}></option>
                    <option value="EdisonFormat.com">EdisonFormat.com</option>
                    <option value="Format Library">Format Library</option>
                    <option value="GoatFormat.com">GoatFormat.com</option>
                    <option value="Goat Community Italia">Goat Community Italia</option>
                    <option value="Goat Format Europe">Goat Format Europe</option>
                    <option value="HATFormat.com">HATFormat.com</option>
                    <option value="Konami">Konami</option>
                    <option value="Reaper Format">Reaper Format</option>
                    <option value="Tengu Plant Town">Tengu Plant Town</option>
                    <option value="The Dice Jar">The Dice Jar</option>
                    <option value="The H.A.T. Alliance">The H.A.T. Alliance</option>
                    <option value="Upper Deck Entertainment">Upper Deck Entertainment</option>
                    <option value="Yugi-Kaibaland">Yugi-Kaibaland</option>
                    <option value="Yu-Gi-Oh! Legacy">Yu-Gi-Oh! Legacy</option>
                </select>
            </label>
            <label>Event:
                <select
                    id="event"
                    className="login"
                    onChange={(e) => getEvent(e.target.value)}
                >
                <option value={null}></option>
                {
                    events.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>
            <label>Placement:
                <select
                    id="placement"
                    className="login"
                    onChange={(e) => {
                        setDisplay(shouldDisplay(e.target.value, event.size))
                        setPlacement(e.target.value)}
                    }
                >
                {
                    placementArr.map((e) => <option value={e}>{e}</option>)
                }
                </select>
            </label>
            <label>Display:
                <select
                    id="display"
                    value={display}
                    className="login"
                    onChange={(e) => setDisplay(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>YDK:
                <input
                    id="ydk"
                    className="login"
                    type="file"
                    accept=".ydk"
                    onChange={(e) => readYDK(e.target.files[0])}
                />
            </label>
            <a
                className="admin-button"
                type="submit"
                onClick={() => createDeck()}
            >
                Submit
            </a>
        </div>
    )
}
