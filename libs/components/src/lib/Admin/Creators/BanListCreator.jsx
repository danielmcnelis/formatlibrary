
import { useState, useEffect } from 'react'
import axios from 'axios'
import { capitalize } from '@fl/utils'

export const BanListCreator = () => {
	const [month, setMonth] = useState(null)
	const [day, setDay] = useState(null)
    const [year, setYear] = useState(null)
    const [previousBanlist, setPreviousBanlist] = useState(null)
    const [category, setCategory] = useState('TCG')
    const [changes, setChanges] = useState([])
    const [banlists, setBanlists] = useState([])
    const [card, setCard] = useState(null)
    const [prevStatus, setPrevStatus] = useState(null)
    const [newStatus, setNewStatus] = useState(null)
    const [cards, setCards] = useState([])

    let currentYear = new Date().getFullYear()
    const years = []
    while (currentYear >= 2002) {
        years.push(currentYear)
        currentYear--
    }

    // RESET
    const reset = async () => {
        setMonth(null)  
        setDay(null)  
        setYear(null)  
        setPreviousBanlist(null)  
        setChanges([])  
        setCard(null)  
        setPrevStatus(null)  
        setNewStatus(null) 
        setCards([])   

        document.getElementById('card').value = null
        document.getElementById('new-status').value = null
    }

    // CREATE
    const create = async () => {
        if (!month) return alert('Please select a Month.')
        if (!day) return alert('Please select a Day.')
        if (!year) return alert('Please select a Year.')
        if (!previousBanlist) return alert('Please select a Previous Ban List.')
        if (!changes || !changes.length) return alert('Please add some changes.')
        
        try {
            const { data } = await axios.post('/api/banlists/create', { month, day, year, category, changes, previousBanlist })
            alert(`Success! Added ${data} Cards to the ${month} ${year} Ban List`)
            return reset()
        } catch (err) {
            console.log(err)
        }
    }

    // FIND CARDS
    const findCards = async (query) => {
        const {data} = await axios.get(`/api/cards/query/${query}`) 
        setCards(data)
        if (data[0]) {  
            setCard(data[0].name)
            getStatus(data[0].name)
        }
    }

    // GET STATUS
    const getStatus = async (name) => {
        const {data} = await axios.get(`/api/statuses/query`, {
            headers: {
                name: name,
                category: category,
                banlist: previousBanlist
            }
        })

        if (data) setPrevStatus(data.restriction)
    }

    // ADD CHANGE
    const addChange = async () => {
        const change = {
            name: card,
            prevStatus: prevStatus,
            newStatus: newStatus
        }

        setChanges([...changes, change])
        document.getElementById('card').value = null
        document.getElementById('new-status').value = null
        document.getElementById('prev-status').value = null
        setCard(null)
        setCards([])
        setPrevStatus(null)
        setNewStatus(null)
    }

    // DELETE CHANGE
    const deleteChange = async (index) => {
        changes.splice(index, 1)
        setChanges([...changes])
    }

    // USE EFFECT
    useEffect(() => {
        const fetchBanlists = async () => {
            const {data} = await axios.get(`/api/banlists/all?category=${category}`)
            setBanlists(data)
        }
        
        fetchBanlists()
    }, [])

    return (
        <div className="admin-portal">
            <label>Category:
                <select
                    id="category"
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="TCG">TCG</option>
                    <option value="OCG">OCG</option>
                    <option value="Speed">Speed</option>
                </select>
            </label>
            
            <label>Month:
                <select
                    id="month"
                    onChange={(e) => setMonth(e.target.value || null)}
                >
                    <option value=""></option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                </select>
            </label>

            <label>Day:
                <select
                    id="day"
                    onChange={(e) => setDay(e.target.value || null)}
                >
                    <option value=""></option>
                    {
                        Array(31).fill(0).map((e, index) => <option value={`${('0' + (index + 1)).slice(-2)}`}>{index+1}</option>)
                    }
                </select>
            </label>

            <label>Year:
                <select
                    id="year"
                    onChange={(e) => setYear(e.target.value || null)}
                >
                    <option value=""></option>
                    {
                        years.map((year) => <option value={year.toString()}>{year}</option>)
                    }
                </select>
            </label>

            <label>Previous List:
                <select
                    id="previous-banlist"
                    onChange={(e) => setPreviousBanlist(e.target.value || null)}
                >
                <option value=""></option>
                {
                    banlists.map((e) => <option value={e}>{e}</option>)
                }
                </select>
            </label>

            <table>
                <thead>
                    <tr>
                        <th>Card</th>
                        <th>Old Status</th>
                        <th>New Status</th>
                    </tr>
                </thead>
                <tbody>
                {
                    changes.map((c, index) => (
                        <tr>
                            <td>{c.name}</td>
                            <td>{c.prevStatus ? capitalize(c.prevStatus) : 'N/A'}</td>
                            <td>{capitalize(c.newStatus)}</td>
                            <td><div onClick={() => deleteChange(index)}>Delete</div></td>
                        </tr>
                    ))
                }
                    <tr>
                        <td>
                            <input
                                id="card"
                                defaultValue=""
                                type="search"
                                onKeyDown={(e) => { if (e.key === 'Enter') findCards(e.target.value || null, null)}}
                            />

                            <select
                                onChange={(e) => {
                                    setCard(e.target.value)
                                    getStatus(e.target.value)}
                                }
                            >
                            {
                                cards.map((e) => <option value={e.name}>{e.name}</option>)
                            }
                            </select>
                        </td>
                        
                        <td className="align-top">{prevStatus ? capitalize(prevStatus) : 'N/A'}</td>
                        
                        <td>
                            <select
                                id="new-status"
                                defaultValue=""
                                onChange={(e) => setNewStatus(e.target.value || null)}
                            >
                                <option value=""></option>
                                <option value="forbidden">Forbidden</option>
                                <option value="limited">Limited</option>
                                <option value="semi-limited">Semi-Limited</option>
                                <option value="no longer on list">Unlimited</option>
                            </select>
                        </td>
                        <td onClick={() => addChange()}>Add</td>
                    </tr>
                </tbody>
            </table>

            <a
                className="admin-button"
                type="submit"
                onClick={() => create()}
            >
                Submit
            </a>
        </div>
    )
}
