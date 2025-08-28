
import { useState } from 'react'
import { countries } from '@fl/utils'
import axios from 'axios'

export const PlayerCreator = () => {
    const [firstName, setFirstName] = useState(null)
    const [lastName, setLastName] = useState(null)
    const [country, setCountry] = useState(null)
    const [pfp, setPfp] = useState(null)
    const [discordName, setDiscordName] = useState(null)

    //RESET
    const reset = async () => {
        setFirstName(null)
        setLastName(null)
        setCountry(null)
        setPfp(null)
        setDiscordName(null)
        document.getElementById('firstName').value = null
        document.getElementById('lastName').value = null
        document.getElementById('country-select').value = null
        document.getElementById('pfp').value = null
        document.getElementById('discordName').value = null
    }

    //CREATE IMAGE
    const createPlayer = async () => {
        if ((!firstName || !lastName) && !discordName) return alert('Please provide either a First & Last Name or a Discord Name.')
        try {
            const {data} = await axios.post('/api/players/create', {
                name: discordName || `${firstName} ${lastName}`,
                firstName: firstName,
                lastName: lastName,
                country: country,
                pfp: pfp,
                discordName: discordName,
            })

            if (data.name) {
                alert(`Success! New Player: ${data.name}`)
            } else {
                alert(`Failure! This player already exists.`)
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

    return (
        <div className="admin-portal">
            <label>First Name:
                <input
                    id="firstName"
                    value={firstName || ''}
                    type="text"
                    onChange={(e) => setFirstName(e.target.value?.trim())}
                />
            </label>
            <label>Last Name:
                <input
                    id="lastName"
                    value={lastName || ''}
                    type="text"
                    onChange={(e) => setLastName(e.target.value?.trim())}
                />
            </label>
            <label>PFP:
                <input
                    id="pfp"
                    type="file"
                    accept=".png"
                    onChange={(e) => readPfp(e.target.files[0])}
                />
            </label>

            <label>
                Country:
                <select id="country-select" onChange={(e) => setCountry(e.target.value)}>
                    <option value={null}>Unknown</option>
                    {
                        Object.keys(countries).map((c) => <option value={c}>{c}</option>)
                    }
                </select>
            </label>
            
            <label>Discord Name:
                <input
                    id="discordName"
                    value={discordName || ''}
                    type="text"
                    onChange={(e) => setDiscordName(e.target.value?.trim())}
                />
            </label>
            <div
                className="admin-button"
                type="submit"
                onClick={() => createPlayer()}
            >
                Submit
            </div>
        </div>
    )
}