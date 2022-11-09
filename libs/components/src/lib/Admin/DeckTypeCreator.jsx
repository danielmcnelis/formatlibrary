import { useState, useEffect } from 'react'
import axios from 'axios'

export const DeckTypeCreator = () => {
    const [name, setName] = useState(null)
    const [leftCards, setLeftCards] = useState([])
    const [centerCards, setCenterCards] = useState([])
    const [rightCards, setRightCards] = useState([])
    const [category, setCategory] = useState(null)
    const [formats, setFormats] = useState([])
    const [format, setFormat] = useState(null)
    const [leftCard, setLeftCard] = useState(null)
    const [centerCard, setCenterCard] = useState(null)
    const [rightCard, setRightCard] = useState(null)

    const reset = async () => {
        setName(null)  
        setCategory(null)  
        setFormat(null)  
        setLeftCard(null)  
        setCenterCard(null)  
        setRightCard(null)  

        document.getElementById('name').value = null
        document.getElementById('category').value = null
        document.getElementById('format').value = null
        document.getElementById('left-card').value = null
        document.getElementById('center-card').value = null
        document.getElementById('right-card').value = null
    }

    const create = async () => {
        if (!name) return alert('Please provide a Name.')
        if (!category) return alert('Please select a Category.')
        if (!format) return alert('Please select a Format.')
        if (!leftCard) return alert('Please assign a Card for the Left Thumbnail Image.')
        if (!centerCard) return alert('Please assign a Card for the Center Thumbnail Image.')
        if (!rightCard) return alert('Please assign a Card for the Right Thumbnail Image.')
        
        try {
            const { data } = await axios.post('/api/decktypes/create', {
                name: name,
                category: category,
                formatName: format.name,
                formatId: format.id,
                leftCardName: leftCard.name,
                leftCardYpdId: leftCard.ypdId,
                centerCardName: centerCard.name,
                centerCardYpdId: centerCard.ypdId,
                rightCardName: rightCard.name,
                rightCardYpdId: rightCard.ypdId,
            })

            alert(`Success! New DeckType: ${data.name}`)
            return reset()
        } catch (err) {
            console.log(err)
        }
    }

    // FIND CARDS
    const findCards = async (query, location) => {
        const {data} = await axios.get(`/api/cards/query/${query}`)
        if (location === 'left') {
            setLeftCards(data)
            setLeftCard(data[0])
        } else if (location === 'center') {
            setCenterCards(data)
            setCenterCard(data[0])
        } else if (location === 'right') {
            setRightCards(data)
            setRightCard(data[0])
        }
    }

    // GET CARD
    const getCard = async (name, location) => {
        if (location === 'left') {
            const elem = leftCards.filter((e) => e.name === name)[0]
            setLeftCard(elem)
        } else if (location === 'center') {
            const elem = centerCards.filter((e) => e.name === name)[0]
            setCenterCard(elem)
        } else if (location === 'right') {
            const elem = rightCards.filter((e) => e.name === name)[0]
            setRightCard(elem)
        }
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
        <div className="admin-portal">

            <label>Name:
                <input
                    id="name"
                    className="login"
                    type="text"
                    onChange={(e) => setName(e.target.value)}
                />
            </label>

            <label>
                Category:
                <select
                    id="category"
                    className="login"
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value={null}></option>
                    <option value="Aggro">Aggro</option>
                    <option value="Combo">Combo</option>
                    <option value="Control">Control</option>
                    <option value="Lockdown">Lockdown</option>
                </select>
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

            <label>Left Card:
                <input
                    id="left-card"
                    className="login"
                    type="search"
                    onKeyDown={(e) => { if (e.key === 'Enter') findCards(e.target.value, 'left')}}
                />
                <select
                    id="left-card-select"
                    className="login"
                    onChange={(e) => getCard(e.target.value, 'left')}
                >
                {
                    leftCards.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>

            
            <label>Center Card:
                <input
                    id="center-card"
                    className="login"
                    type="search"
                    onKeyDown={(e) => { if (e.key === 'Enter') findCards(e.target.value, 'center')}}
                />
                <select
                    id="center-card-select"
                    className="login"
                    onChange={(e) => getCard(e.target.value, 'center')}
                >
                {
                    centerCards.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>

            <label>Right Card:
                <input
                    id="right-card"
                    className="login"
                    type="search"
                    onKeyDown={(e) => { if (e.key === 'Enter') findCards(e.target.value, 'right')}}
                />
                <select
                    id="right-card-select"
                    className="login"
                    onChange={(e) => getCard(e.target.value, 'right')}
                >
                {
                    rightCards.map((e) => <option value={e.name}>{e.name}</option>)
                }
                </select>
            </label>

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
