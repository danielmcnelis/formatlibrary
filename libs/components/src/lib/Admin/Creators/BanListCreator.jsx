
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
    const [previous, setPreviousStatus] = useState(null)
    const [restriction, setRestriction] = useState(null)
    const [cards, setCards] = useState([])

    let currentYear = new Date().getFullYear()
    const years = []
    while (currentYear >= 1999) {
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
        setBanlists([])  
        setCard(null)  
        setPreviousStatus(null)  
        setRestriction(null) 
        setCards([])   

        document.getElementById('card').value = ""
        document.getElementById('restriction').value = ""
        document.getElementById('year').value = ""
        document.getElementById('month').value = ""
        document.getElementById('day').value = ""
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

        if (data) setPreviousStatus(data.restriction)
    }

    // ADD CHANGE
    const addChange = async () => {
        const change = {
            name: card,
            previous: previous,
            restriction: restriction
        }

        setChanges([...changes, change])
        setCard(null)
        setCards([])
        setPreviousStatus(null)
        setRestriction(null)
    }

    // DELETE CHANGE
    const deleteChange = async (index) => {
        changes.splice(index, 1)
        setChanges([...changes])
        setCards([])
    }

    // USE EFFECT
    useEffect(() => {
        const fetchBanlists = async () => {
            const {data} = await axios.get(`/api/banlists/all?category=${category}`)
            setBanlists(data)
        }
        
        fetchBanlists()
    }, [category])

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
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
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
                    onChange={(e) =>  setPreviousBanlist(e.target.value || null)}
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
                            <td>{c.previous ? capitalize(c.previous) : 'N/A'}</td>
                            <td>{capitalize(c.restriction)}</td>
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
                        
                        <td className="align-top">{previous ? capitalize(previous) : 'N/A'}</td>
                        
                        <td>
                            <select
                                id="restriction"
                                defaultValue=""
                                onChange={(e) => setRestriction(e.target.value || null)}
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
