
import { useState, useEffect } from 'react'
import axios from 'axios'
import { shouldDisplay } from '@fl/utils'

export const DeckCreator = () => {
    const [communityName, setCommunityName] = useState(null)
    const [communities, setCommunities] = useState([])
    console.log('communities', communities)
    const [deckType, setDeckType] = useState(null)
    const [deckTypes, setDeckTypes] = useState([])
    const [display, setDisplay] = useState(true)
    const [event, setEvent] = useState(null)
    const [events, setEvents] = useState([])
    const [placement, setPlacement] = useState(1)
    const [player, setPlayer] = useState(null)
    const [players, setPlayers] = useState([])
    const [ydk, setYDK] = useState(null)
    console.log('ydk', ydk)
    
    const placementArr = event ? Array.from({length: event.size}, (_, i) => i + 1) : []

    const reset = async () => {
        setCommunityName(null)
        setDeckType(null)
        setDisplay(true)
        setEvent(null)
        setEvents([])
        setPlacement(1)
        setPlayer(null) 
        setPlayers([])
        setYDK(null)  

        document.getElementById('builder-name').value = ''
        document.getElementById('deck-type').value = null
        document.getElementById('display').value = true
        document.getElementById('community-name').value = null
        document.getElementById('event-name').value = null
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
                builderName: player.name,
                builderId: player.id,
                deckTypeName: deckType.name,
                deckTypeId: deckType.id,
                category: deckType.category,
                formatName: event.formatName,
                ydk: ydk,
                eventAbbreviation: event.abbreviation,
                eventId: event.id,
                publishDate: event.startedAt,
                placement: placement,
                origin: 'event',
                communityName: communityName,
                display: display
            })

            alert(`Success! New Deck: https://formatlibrary.com/decks/${data.id}`)
            return reset()
        } catch (err) {
            console.log(err)
        }
    }
  
    const readYDKe = async (ydke) => {
        console.log('readYDKe()')
        const {data: ydk} = await axios.put(`/api/decks/convert-ydke-to-ydk`, { ydke: ydke })
        setYDK(ydk)
    }
        
    const readYDK = (file) => {
        const reader = new FileReader()
        reader.readAsBinaryString(file)
        reader.onloadend = () => {
            const arr = reader.result?.split('\n').map((e) => {
                while (/^\d/.test(e) && e.trim().length < 8) e = '0' + e
                return e
            })

            setYDK(arr.join('\n'))
        }
    }

    const findPlayers = async (query) => {
        const {data} = await axios.get(`/api/players/partial-name/${query}`)
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
        const fetchData = async () => {
            const {data: communityData} = await axios.get(`/api/events/communities`)
            setCommunities(communityData)  

            const {data: deckTypeData} = await axios.get(`/api/decktypes/`)
            setDeckTypes(deckTypeData)
        }
        
        fetchData()
    }, [])

    // USE EFFECT
    useEffect(() => {
        const fetchEvents= async () => {
            const {data} = await axios.get(`/api/events/community/${communityName}`)
            setEvents(data)
        }

        fetchEvents()
    }, [communityName])

    return (
        <div className="admin-portal">
            <label>Builder:
                <input
                    id="builder-name"
                    type="search"
                    onKeyDown={(e) => { if (e.key === 'Enter') findPlayers(e.target.value)}}
                />
                <select
                    id="builder-select"
                    onChange={(e) => getPlayer(e.target.value)}
                >
                {
                    players.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>
            
            <label>Deck Type:
                <select
                    id="deck-type"
                    onChange={(e) => getDeckType(e.target.value || null)}
                >
                <option value=""></option>
                {
                    deckTypes.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>

            <label>
                Community:
                <select
                    id="community"
                    defaultValue="All Communities"
                    className="filter"
                    onChange={(e) => {setCommunityName(e.target.value || null)}}
                >
                {
                    communities.map((c) => <option key={c} value={c}>{c}</option>)
                }
                </select>
                
            </label>

            <label>Event:
                <select
                    id="event-name"
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
                    onChange={(e) => setDisplay(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>

            <label>YDK:
                <input
                    id="ydk"
                    type="file"
                    accept=".ydk"
                    onChange={(e) => readYDK(e.target.files[0])}
                />
            </label>

            <label>YDKe:
                <input
                    id="ydke"
                    type="text"
                    onChange={(e) => readYDKe(e.target.value)}
                />
            </label>

            <div
                className="admin-button"
                type="submit"
                onClick={() => createDeck()}
            >
                Submit
            </div>
        </div>
    )
}
