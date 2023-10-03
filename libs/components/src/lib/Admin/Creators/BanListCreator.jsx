
import { useState, useEffect } from 'react'
import axios from 'axios'
import { capitalize } from '@fl/utils'

export const BanListCreator = () => {
	const [month, setMonth] = useState(null)
    const [year, setYear] = useState(null)
    const [previous, setPrevious] = useState(null)
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
        setYear(null)  
        setPrevious(null)  
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
        if (!year) return alert('Please select a Year.')
        if (!previous) return alert('Please select a Previous Ban List.')
        if (!changes || !changes.length) return alert('Please add some changes.')
        
        try {
            const { data } = await axios.post('/api/banlists/create', { month, year, category, changes, previous })
            alert(`Success! Added ${data} Cards to the ${month}${year} Ban List`)
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
                banlist: previous
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
                    <option value="jan">January</option>
                    <option value="feb">February</option>
                    <option value="mar">March</option>
                    <option value="apr">April</option>
                    <option value="may">May</option>
                    <option value="jun">June</option>
                    <option value="jul">July</option>
                    <option value="aug">August</option>
                    <option value="sep">September</option>
                    <option value="oct">October</option>
                    <option value="nov">November</option>
                    <option value="dec">December</option>
                </select>
            </label>

            <label>Year:
                <select
                    id="year"
                    onChange={(e) => setYear(e.target.value || null)}
                >
                    <option value=""></option>
                    {
                        years.map((year) => <option value={year.toString().slice(-2)}>{year}</option>)
                    }
                </select>
            </label>

            <label>Previous List:
                <select
                    id="previous"
                    onChange={(e) => setPrevious(e.target.value || null)}
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
                                <option value="unlimited">Unlimited</option>
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
