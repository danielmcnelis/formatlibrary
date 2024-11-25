
import { useState, useEffect } from 'react'
import axios from 'axios'
import { getCookie } from '@fl/utils'
import { Helmet } from 'react-helmet'
import './SealedLauncher.css' 

// SEALED LAUNCHER
export const SealedLauncher = () => {
    const [boosters, setBoosters] = useState([])
    const [booster, setBooster] = useState({})
    const [selectedPacks, setSelectedPacks] = useState([])
    const [packQuants, setPackQuants] = useState([])
    const [quantity, setQuantity] = useState(10)
    const [sealedLink, setSealedLink] = useState(null)
    const packIds = selectedPacks.map((p) => p.id)
    const playerId = getCookie('playerId')

    // LAUNCH
    const launch = async () => {
        if (!selectedPacks.length) return alert('Please Select Pack(s).')
        if (!playerId) return alert('Please Log-in to play Sealed.')
        
        try {
            const { data } = await axios.post('/api/sealed/launch', {
                packIds: packIds,
                packQuants: packQuants,
                hostId: playerId
            })
            
            setSealedLink(data)
        } catch (err) {
            console.log(err)
        }
    }

    // RESET
    const reset = () => {
        setSelectedPacks([])
        setPackQuants([])
        setBooster({})
        setQuantity(10)
        document.getElementById('booster-selector').value = ''
        document.getElementById('quantity-selector').value = '10'
    }

    // ADD PACKS
    const addPacks = () => {
        if (!booster.id) return alert('Please Select Booster.')
        setSelectedPacks([...selectedPacks, booster])
        setPackQuants([...packQuants, quantity])
        setBooster({})
        document.getElementById('booster-selector').value = ''
    }

    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            const {data: boosterData} = await axios.get(`/api/sets/draftable`)
            setBoosters(boosterData)
        }
        
        fetchData()
    }, [])

    return (
        <>
            <Helmet>
                <title>{`Play Sealed Yu-Gi-Oh! - Format Library`}</title>
                <meta name="og:title" content={`Play Sealed Yu-Gi-Oh! - Format Library`}/>
                <meta name="description" content={`Click here to play Sealed Yu-Gi-Oh!`}/>
                <meta name="og:description" content={`Click here to play Sealed Yu-Gi-Oh!`}/>
            </Helmet>
            <div className="sealed-portal">
                <div className="card-database-flexbox">
                    <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/artworks/${booster.setCode || selectedPacks[selectedPacks.length-1]?.setCode || 'back'}.jpg`} alt="sealed-logo"/>
                    <div>
                        <h1>Sealed App</h1>
                    </div>
                    <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/artworks/${booster.setCode || selectedPacks[selectedPacks.length-1]?.setCode || 'back'}.jpg`} alt="sealed-logo"/>
                </div>
                <br/>

                <div className="slideshow">
                    <div className="mover" style={{background: `url(https://cdn.formatlibrary.com/images/sets/slideshows/${booster?.setCode || selectedPacks[0]?.setCode}.png)`}}></div>
                </div>
                <br/>

                <label>Booster:
                    <select
                        id="booster-selector"
                        defaultValue=""
                        onChange={(e) => setBooster(boosters.filter((b) => !packIds.includes(b.id))[e.target.value])}
                    >
                    <option value="">Select Booster:</option>
                    {
                        boosters.filter((b) => !packIds.includes(b.id)).map((b, index) => <option value={index}>{b.name}</option>)
                    }
                    </select>
                </label>

                <label>Quantity:
                    <select
                        id="quantity-selector"
                        defaultValue="10"
                        onChange={(e) => {setQuantity(e.target.value)}}
                    >
                        {
                            Array.from({length: 24}, (_, i) => i + 1).map((num) => <option value={num}>{num}</option>)
                        }
                    </select>
                </label>

                {
                    selectedPacks.map((p, index) => {
                       return <li className="selected-packs">{packQuants[index]} Packs of {p.name}</li>
                    })
                }

                <div className="flex-buttons">
                    <div
                        className="sealed-button"
                        type="submit"
                        onClick={() => addPacks()}
                    >
                        Add Packs
                    </div>

                    <div
                        className="sealed-button"
                        type="submit"
                        onClick={() => reset()}
                    >
                        Reset
                    </div>

                    <div
                        className="sealed-button"
                        type="submit"
                        onClick={() => launch()}
                    >
                        Launch
                    </div>
                </div>

                {
                    sealedLink ? (
                        <div className="lobby-link">
                            Sealed Lobby: <a href={sealedLink}>{sealedLink}</a>
                        </div>
                    ) : ''
                }
            </div>
        </>
    )
}
