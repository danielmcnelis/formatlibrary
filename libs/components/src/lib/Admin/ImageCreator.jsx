
import { useEffect, useState } from 'react'
import axios from 'axios'

export const ImageCreator = () => {
    const [abbreviation, setAbbreviation] = useState(null)
    const [bracket, setBracket] = useState(null)
    const [challongeName, setChallongeName] = useState(null)
    const [community, setCommunity] = useState(null)
    const [endDate, setEndDate] = useState(null)
    const [formats, setFormats] = useState([])
    const [format, setFormat] = useState(null)
    const [fullName, setFullName] = useState(null)
    const [isSeries, setIsSeries] = useState(true)
    const [player, setPlayer] = useState(null)
    const [players, setPlayers] = useState([])
    const [referenceUrl, setReferenceUrl] = useState(null)
    const [size, setSize] = useState(null)
    const [startDate, setStartDate] = useState(null)
    const [tournamentId, setTournamentId] = useState(null)
    const [tournamentType, setTournamentType] = useState(true)
    const [url, setUrl] = useState(null)
    
    const slice = startDate ? startDate.slice(0, 10) : null

    // RESET
    const reset = async () => {
        setAbbreviation(null)
        setBracket(null)
        setChallongeName(null)
        setCommunity(null)
        setEndDate(null)
        setFormat(null)
        setFullName(null)
        setIsSeries(true)
        setPlayer(null) 
        setPlayers([])          
        setReferenceUrl(null)
        setSize(null)
        setStartDate(null)
        setTournamentId(null)
        setTournamentType(true)
        setUrl(null)

        document.getElementById('abbreviation').value = null
        document.getElementById('bracket').value = null
        document.getElementById('community').value = null
        document.getElementById('format').value = null
        document.getElementById('url').value = ''
        document.getElementById('full-name').value = ''
        document.getElementById('abbreviation').value = ''
        document.getElementById('size').value = ''
        document.getElementById('format').value = null
        document.getElementById('series').value = true
        document.getElementById('start-date').value = "mm/dd/yyyy"
        document.getElementById('type').value = null
        document.getElementById('winner').value = ''
    }

    // CREATE EVENT
    const createEvent = async () => {
        if (!community) return alert('Please Select a Community.')
        if (!referenceUrl) return alert('No URL Found.')
        if (!fullName) return alert('Please provide a Full Name.')
        if (!abbreviation) return alert('Please provide an Abbreviation.')
        if (!format) return alert('Please select a Format.')
        if (!size) return alert('Please specify the Tournament Size.')
        if (!tournamentType) return f('Please select a Tournament Type.')
        if (!bracket) return alert('Please upload a Bracket PNG file.')
        if (!tournamentId && url.includes('challonge')) return alert('Tournament not found on Challonge.')
        if (!player) return alert('No Winner Found.')
        if (!startDate) return alert('Please select a Start Date.')
        
        try {
            const { data } = await axios.post('/api/events/create', {
                id: tournamentId,
                community: community,
                url: url,
                referenceUrl: referenceUrl,
                fullName: fullName,
                challongeName: challongeName,
                abbreviation: abbreviation,
                format: format,
                size: size,
                series: isSeries,
                type: tournamentType,
                winner: player.name,
                playerId: player.id,
                startDate: startDate,
                endDate: endDate,
                bracket: bracket
            })

            alert(`Success! New Event: https://formatlibrary.com/events/${data.abbreviation}`)
            return reset()
        } catch (err) {
            console.log(err)
        }
    }

    // GET TOURNAMENT
    const getTournament = async (url) => {
        setReferenceUrl(url)
        let name = url.slice(url.indexOf('challonge.com/') + 14)
        if (url.includes('formatlibrary.challonge')) name = 'formatlibrary-' + name
        setUrl(name)

        if (url.includes('challonge')) {
            try {
                const {data} = await axios.get(`/api/tournaments/challonge/${name}`, {
                    headers: {
                        community: community || 'Format Library'
                    }
                })
                
                setChallongeName(data.name)
                setSize(data.participants_count)
                setStartDate(data.started_at)
                setEndDate(data.completed_at)
                setTournamentId(data.id.toString())
            } catch (err) {
                console.log(err)
            }
        }
    }

    // READ BRACKET
    const readBracket = (file) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onloadend = () => setBracket(reader.result)
    }

    // FIND PLAYERS
    const findPlayers = async (query) => {
        const {data} = await axios.get(`/api/players/query/${query}`)
        setPlayers(data)
        setPlayer(data[0])/logos/nba/1610612765/primary/L/logo.svg
    }

    // GET PLAYER
    const getPlayer = async (name) => {
        const elem = players.filter((e) => e.name === name)[0]
        return setPlayer(elem)
    }

    // USE EFFECT
    useEffect(() => {
        const fetchFormats = async () => {
            const {data} = await axios.get(`/api/formats`)
            setFormats(data)
        }
        
        fetchFormats()
    }, [])

    return (
        <div className='admin-portal'>
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
            <label>URL:
                <input
                    id="url"
                    className="login"
                    type="text"
                    onChange={(e) => getTournament(e.target.value)}
                />
            </label>
            <label>Full Name:
                <input
                    id="full-name"
                    className="login"
                    type="text"
                    onChange={(e) => setFullName(e.target.value)}
                />
            </label>
            <label>Abbbreviation:
                <input
                    id="short-name"
                    className="login"
                    type="text"
                    onChange={(e) => setAbbreviation(e.target.value)}
                />
            </label>
            <label>Format:
                <select
                    id="format"
                    className="login"
                    onChange={(e) => setFormat(formats[e.target.value])}
                >
                <option value={null}></option>
                {
                    formats.map((e, index) => <option value={index}>{e.name}</option>)
                }
                </select>
            </label>
            <label>Size:
                <input
                    id="size"
                    value={size || ''}
                    className="size"
                    type="text"
                    onChange={(e) => setSize(e.target.value)}
                />
            </label>
            <label>
                Type:
                <select
                    id="type"
                    className="login"
                    onChange={(e) => setTournamentType(e.target.value)}
                >
                    <option value={null}></option>
                    <option value="Double Elimination">Double Elimination</option>
                    <option value="Single Elimination">Single Elimination</option>
                    <option value="Swiss">Swiss</option>
                    <option value="Round Robin">Round Robin</option>
                </select>
            </label>
            <label>Series:
                <select
                    id="series"
                    className="login"
                    onChange={(e) => setIsSeries(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Bracket:
                <input
                    id="bracket"
                    className="login"
                    type="file"
                    accept=".png"
                    onChange={(e) => readBracket(e.target.files[0])}
                />
            </label>
            <label>Winner:
                <input
                    id="winner"
                    className="login"
                    type="search"
                    onKeyDown={(e) => { if (e.key === 'Enter') findPlayers(e.target.value)}}
                />
                <select
                    id="winner-select"
                    className="login"
                    onChange={(e) => getPlayer(e.target.value)}
                >
                {
                    players.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>
            <label>Start Date:
                <input
                    id="startDate"
                    value={slice || 'mm-dd-yyyy'}
                    className="login"
                    type="date"
                    onChange={(e) => {
                            setEndDate(e.target.value + ' 00:00:00+00')
                            setStartDate(e.target.value + ' 00:00:00+00')
                        }
                    }
                />
            </label>
            <a
                className="admin-button"
                type="submit"
                onClick={() => createEvent()}
            >
                Submit
            </a>
        </div>
    )
}
