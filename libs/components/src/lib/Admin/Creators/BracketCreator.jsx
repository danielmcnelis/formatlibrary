
import { useState } from 'react'
import axios from 'axios'

// BRACKET CREATOR
export const BracketCreator = () => {
    const [name, setName] = useState(null)
    const [abbreviation, setAbbreviation] = useState(null)
    const [useStandings, setUseStandings] = useState(true)
    const [participants, setParticipants] = useState([])
    const [useNewLogic, setUseNewLogic] = useState(true)
    const newLogic = [[32, 1], [2, 31], [17, 16], [18, 15], [25, 8], [26, 7], [9, 24], [10, 23], [29, 4], [30, 3], [13, 20], [19, 14], [28, 5], [27, 6], [12, 21], [11, 22]].flat()
    const oldLogic = [[1, 32], [16, 17], [8, 25], [9, 24], [4, 29], [13, 20], [5, 28], [12, 21], [2, 31], [15, 18], [7, 26], [10, 23], [3, 30], [14, 19], [6, 27], [11, 22]].flat()
         
    // RESET
    const reset = async () => {
        setName(null) 
        setAbbreviation(null) 
        setParticipants([])

        document.getElementById('name').value = null
        document.getElementById('abbreviation').value = null
        document.getElementById('participants').value = null
    }

    // CREATE
    const create = async () => {
        if (!name) return alert('Please enter a Tournament Name.')
        if (!abbreviation) return alert('Please enter a Tournament Abbreviation.')
        if (!participants || !participants.length) return alert('Please add some participants.')
        
        try {
            const { data } = await axios.post('/api/tournaments/mock-bracket', { name, abbreviation, participants })
            alert(`Success! Created new bracket: https://challonge.com/${data.url}`)
            return reset()
        } catch (err) {
            console.log(err)
        }
    }

    // REVERSE ENGINEER PARTICIPANTS
    const reverseEngineerParticipants = (raw) => {
        const logic = useNewLogic ? newLogic : oldLogic
        const keys = Array.from(logic.keys()).sort((a, b) => logic[a] - logic[b])
        const pairings = raw.replace(/[0-9\t]/g, '').split('\n').map((e) => e.split('vs.')).flat().map((e) => {
            if (e.includes(',')) {
                const [surname, forename] = e.split(',')
                return `${forename} ${surname}`.trim()
              } else {
                return e.trim()
              }
        })

        const mappedParticipants = keys.map(i => pairings[i])
        return setParticipants(mappedParticipants)
    }

    // PROCESS PARTICIPANTS
    const processParticipants = (data) => {
        const processedParticipants = data.split('\n').map((e) => {
            if (e.includes(',')) {
              const [surname, forename] = e.replace(/[0-9\t)]/g, '').split(',')
              return `${forename} ${surname}`.trim()
            } else {
              return e.replace(/[0-9\t)]/g, '').trim()
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

            <label>Tournament Abbreviation:
                <input
                    id="abbreviation"
                    value={abbreviation || ''}
                    type="text"
                    onChange={(e) => setAbbreviation(e.target.value)}
                />
            </label>

            <div className="option-toggle-flexbox">
                <div id={`option-toggle-${useStandings ? 'on' : 'off'}`} onClick={() => setUseStandings(!useStandings)}>
                    <div id={`option-toggle-inner-circle-${useStandings ? 'on' : 'off'}`}></div>
                </div>
                <div>{useStandings ? 'Final Standings:' : 'Top 32 Pairings:'}</div>
            </div>

            {
                !useStandings ? (
                    <label>Use New Bracket Logic:
                        <input
                            id="logic"
                            checked={!!useNewLogic}
                            type="checkbox"
                            onChange={() => setUseNewLogic(!useNewLogic)}
                        />
                    </label>

                ) : ''
            }


            {
                useStandings ? (
                    <textarea
                        id="participants"
                        onChange={(e) => processParticipants(e.target.value)}
                    />
                ) : (
                    <textarea
                        id="top32-pairings"
                        onChange={(e) => reverseEngineerParticipants(e.target.value)}
                    />
                )
            }

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
