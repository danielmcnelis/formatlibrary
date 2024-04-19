
import { useState } from 'react'
import axios from 'axios'

export const BracketCreator = () => {
    const [name, setName] = useState(null)
    const [participants, setParticipants] = useState([])

    // RESET
    const reset = async () => {
        setName(null) 
        setParticipants([])   

        document.getElementById('name').value = null
        document.getElementById('participants').value = null
    }

    // CREATE
    const create = async () => {
        if (!name) return alert('Please enter a Tournament Name.')
        if (!participants || !participants.length) return alert('Please add some participants.')
        
        try {
            const { data } = await axios.post('/api/tournaments/mock-bracket', { name, participants })
            alert(`Success! Created new bracket: https://challonge.com/${data.url}`)
            return reset()
        } catch (err) {
            console.log(err)
        }
    }

    // PROCESS PARTICIPANTS
    const processParticipants = (data) => {
        const processedParticipants = data.split('\n').map((e) => {
            if (e.includes(',')) {
              const [surname, forename] = e.replace(/[0-9\t.)]/g, '').split(',')
              return `${forename} ${surname}`.trim()
            } else {
              return e.replace(/[0-9\t.)]/g, '').trim()
            }
        })

        setParticipants(processedParticipants)
    }

    return (
        <div className="admin-portal">
            <label>Tournament Name:
                <input
                    id="name"
                    value={name || ''}
                    type="text"
                    onChange={(e) => setName(e.target.value)}
                />
            </label>

            <label>Participants:</label>
            <textarea
                id="participants"
                onChange={(e) => processParticipants(e.target.value)}
            />

            <div
                className="admin-button"
                type="submit"
                onClick={() => create()}
            >
                Submit
            </div>
        </div>
    )
}
