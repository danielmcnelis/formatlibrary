
import { useState } from 'react'
import axios from 'axios'

// UPDATE PLAYER COMPONENT
export const UpdatePlayer = () => {
    const [player, setPlayer] = useState(null)
    const [players, setPlayers] = useState([])
    const [firstName, setFirstName] = useState(null)
    const [lastName, setLastName] = useState(null)
    const [pfp, setPfp] = useState(null)
    const [card, setCard] = useState(null)
    const [cards, setCards] = useState([])
    const [country, setCountry] = useState(null)

    //RESET
    const reset = async () => {
        setPlayer(null)
        setPlayers([])
        setFirstName(null)
        setLastName(null)
        setPfp(null)
        setCard(null)
        setCards([])
        setCountry(null)
        document.getElementById('player').value = ''
        document.getElementById('firstName').value = null
        document.getElementById('lastName').value = null
        document.getElementById('pfp').value = null
        document.getElementById('card').value = null
        document.getElementById('country').value = null
    }

    //UPDATE PLAYER
    const updatePlayer = async () => {
        if (!player) return alert('No Player found.')

        try {
            const {data} = await axios.post(`/api/players/update/id=${player?.id}`, {
                firstName: firstName,
                lastName: lastName,
                pfp: pfp,
                cardArtworkId: card.artworkId,
                country: country
            })

            if (data.name) {
                alert(`Success! Updated Player: ${data.name}`)
            } else {
                alert(`Failure! This player was not updated.`)
            }
            return reset()
        } catch (err) {
            console.log(err)
        }
    }

    // READ PFP
    const readPfp = (file) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onloadend = () => setPfp(reader.result)
    }

    // FIND PLAYERS
    const findPlayers = async (query) => {
        const {data} = await axios.get(`/api/players/partial-name/${query}`)
        setPlayers(data)
        setPlayer(data[0])
    }

    // GET PLAYER
    const getPlayer = async (name) => {
        const elem = players.filter((e) => e.name === name)[0]
        return setPlayer(elem)
    }

    // FIND CARDS
    const findCards = async (query) => {
        const {data} = await axios.get(`/api/cards/partial-name/${query}`)
        setCards(data)
        setCard(data[0])
    }

    // GET CARD
    const getCard = async (name) => {
        const elem = cards.filter((e) => e.name === name)[0]
        setCard(elem)
    }

    return (
        <div className="admin-portal">
            <label>Player:
                <input
                    id="player"
                    type="search"
                    onKeyDown={(e) => { if (e.key === 'Enter') findPlayers(e.target.value)}}
                />
                <select
                    id="player-select"
                    onChange={(e) => getPlayer(e.target.value)}
                >
                {
                    players.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>

            <label>First Name:
                <input
                    id="firstName"
                    value={firstName || ''}
                    type="text"
                    onChange={(e) => setFirstName(e.target.value)}
                />
            </label>
            <label>Last Name:
                <input
                    id="lastName"
                    value={lastName || ''}
                    type="text"
                    onChange={(e) => setLastName(e.target.value)}
                />
            </label>
            <label>PFP:
                <input
                    id="pfp"
                    type="file"
                    accept=".webp"
                    onChange={(e) => readPfp(e.target.files[0])}
                />
            </label>

            <label>Card:
                <input
                    id="card"
                    type="search"
                    onKeyDown={(e) => { if (e.key === 'Enter') findCards(e.target.value)}}
                />
                <select
                    id="card-select"
                    onChange={(e) => getCard(e.target.value)}
                >
                {
                    cards.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>

            <label>Country:
                <input
                    id="country"
                    value={country || ''}
                    type="text"
                    onChange={(e) => setCountry(e.target.value)}
                />
            </label>

            <a
                className="admin-button"
                type="submit"
                onClick={() => updatePlayer()}
            >
                Submit
            </a>
        </div>
    )
}