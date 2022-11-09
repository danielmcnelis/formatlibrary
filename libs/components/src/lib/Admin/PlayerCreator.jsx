
import { useState } from 'react'
import axios from 'axios'

export const PlayerCreator = () => {
    const [firstName, setFirstName] = useState(null)
    const [lastName, setLastName] = useState(null)
    const [pfp, setPfp] = useState(null)
    const [discordName, setDiscordName] = useState(null)
    const [discriminator, setDiscriminator] = useState(null)

    //RESET
    const reset = async () => {
        setFirstName(null)
        setLastName(null)
        setPfp(null)
        setDiscordName(null)
        setDiscriminator(null)
        document.getElementById('firstName').value = null
        document.getElementById('lastName').value = null
        document.getElementById('pfp').value = null
        document.getElementById('discordName').value = null
        document.getElementById('discriminator').value = null
    }

    //CREATE IMAGE
    const createPlayer = async () => {
        if ((!firstName || !lastName) && (!discordName || !discriminator)) return alert('Please provide either a First & Last Name or a Discord Name & Discriminator.')
        try {
            const {data} = await axios.post('/api/players/create', {
                name: discordName || `${firstName} ${lastName}`,
                firstName: firstName,
                lastName: lastName,
                pfp: pfp,
                discordName: discordName,
                discriminator: discriminator
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
                    className="login"
                    value={firstName || ''}
                    type="text"
                    onChange={(e) => setFirstName(e.target.value)}
                />
            </label>
            <label>Last Name:
                <input
                    id="lastName"
                    className="login"
                    value={lastName || ''}
                    type="text"
                    onChange={(e) => setLastName(e.target.value)}
                />
            </label>
            <label>PFP:
                <input
                    id="pfp"
                    className="login"
                    type="file"
                    accept=".png"
                    onChange={(e) => readPfp(e.target.files[0])}
                />
            </label>
            <label>Discord Name:
                <input
                    id="discordName"
                    className="login"
                    value={discordName || ''}
                    type="text"
                    onChange={(e) => setDiscordName(e.target.value)}
                />
            </label>
            <label>Discord Discriminator:
                <input
                    id="discriminator"
                    className="login"
                    value={discriminator || ''}
                    type="text"
                    onChange={(e) => setDiscriminator(e.target.value)}
                />
            </label>
            <a
                className="admin-button"
                type="submit"
                onClick={() => createPlayer()}
            >
                Submit
            </a>
        </div>
    )
}