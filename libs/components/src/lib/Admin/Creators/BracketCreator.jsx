
import { useState } from 'react'
import axios from 'axios'

// BRACKET CREATOR
export const BracketCreator = () => {
    const [name, setName] = useState(null)
    const [abbreviation, setAbbreviation] = useState(null)
    const [useStandings, setUseStandings] = useState(true)
    const [participants, setParticipants] = useState([])
    const [useNewLogic, setUseNewLogic] = useState(true)
    const [useThirtyTwoLogic, setUseThirtyTwoLogic] = useState(true)
    const newLogic = useThirtyTwoLogic ? [[32, 1], [2, 31], [17, 16], [18, 15], [25, 8], [26, 7], [9, 24], [10, 23], [29, 4], [30, 3], [13, 20], [19, 14], [28, 5], [27, 6], [12, 21], [11, 22]].flat() :
        [[64, 1], [2, 63], [32, 33], [31, 34], [16, 49], [15, 50], [17, 48],[18, 47], [8, 57], [7, 58], [25, 40], [26, 39], [9, 56], [10, 55], [24, 41], [23, 42], [4, 61], [3, 62], [29, 36], [30, 35], [13, 52], [14, 51], [20, 45], [19, 46], [5, 60], [6, 59], [28, 37], [27, 38], [12, 53], [11, 54], [21, 44], [22, 43]].flat()
    const oldLogic = useThirtyTwoLogic ? [[1, 32], [16, 17], [8, 25], [9, 24], [4, 29], [13, 20], [5, 28], [12, 21], [2, 31], [15, 18], [7, 26], [10, 23], [3, 30], [14, 19], [6, 27], [11, 22]].flat() :
        [[1, 64], [32, 33], [16, 49], [17, 48], [8, 57], [25, 40], [9, 56], [24, 41], [4, 61], [29, 36], [13, 52], [20, 45], [5, 60], [28, 37], [12, 53], [21, 44], [2, 63], [31, 34], [15, 50], [18, 47], [7, 58], [26, 39], [10, 55], [23, 42], [3, 62], [30, 35], [14, 51], [19, 46], [6, 59], [27, 38], [11, 54], [22, 43]].flat()

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
        const pairings = raw.replace(/[0-9+\t]/g, '').split('\n').map((e) => e.split('vs.')).flat().map((e) => {
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
              const [surname, forename] = e.replace(/[0-9+\t)]/g, '').split(',')
              return `${forename} ${surname}`.trim()
            } else {
              return e.replace(/[0-9+\t)]/g, '').trim()
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
                <div>{useStandings ? 'Final Standings:' : 'Top X Pairings:'}</div>
            </div>

            {
                !useStandings ? (
                    <div className="option-toggle-flexbox">
                        <div id={`option-toggle-${useThirtyTwoLogic ? 'on' : 'off'}`} onClick={() => setUseThirtyTwoLogic(!useThirtyTwoLogic)}>
                            <div id={`option-toggle-inner-circle-${useThirtyTwoLogic ? 'on' : 'off'}`}></div>
                        </div>
                        <div>{useThirtyTwoLogic ? '32 Players' : '64 Players'}</div>
                    </div>
                ) : ''
            }

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
