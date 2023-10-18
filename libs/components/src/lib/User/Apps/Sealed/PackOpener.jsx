
import { useState, useEffect } from 'react'
import axios from 'axios'
import { CardImage } from '../../../Cards/CardImage'
import { FocalCard } from '../Builder/FocalCard'
import './PackOpener.css' 

export const PackOpener = () => {
    const [boosters, setBoosters] = useState([])
    const [booster, setBooster] = useState({})
    const [count, setCount] = useState(1)
    const [packs, setPacks] = useState([])
    const [card, setCard] = useState({})

    const packNumberOptions = []
    for (let i = 1; i <= 24; i++) packNumberOptions.push(i) 

    // OPEN PACKS
    const openPacks = async () => {
        const {data} = await axios.get(`/api/sets/open-packs/${booster?.setCode}?count=${count}`)
        setPacks(data)
    }

    // FETCH PACK
    const fetchBooster = async (id) => {
        const {data} = await axios.get(`/api/sets/${id}`)
        setBooster(data)
    }

    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            const {data} = await axios.get(`/api/sets/boosters`)
            setBoosters(data)
        }
        
        fetchData()
    }, [])

    return (
        <div className="pack-portal">
            <div className="card-database-flexbox">
                <img style={{ height:'128px'}} src={`https://cdn.formatlibrary.com/images/artworks/${booster.setCode || 'back'}.jpg`} alt="pack art"/>
                <div>
                    <h1>Pack Opener</h1>
                </div>
                <img style={{ height:'128px'}} src={`https://cdn.formatlibrary.com/images/artworks/${booster.setCode || 'back'}.jpg`} alt="pack art"/>
            </div>
            <br/>

            <div className="slideshow">
                <div className="mover"></div>
            </div>

            <label>Booster Set:
                <select
                    id="pack"
                    onChange={(e) => fetchBooster(e.target.value)}
                >
                <option value="">Select Pack:</option>
                {
                    boosters.map((b) => <option value={b.id}>{b.setName}</option>)
                }
                </select>
            </label>

            <label>Number of Packs:
                <select
                    id="pack-size"
                    defaultValue="1"
                    onChange={(e) => {setCount(e.target.value)}}
                >
                {
                    packNumberOptions.map((num) => <option value={num}>{num}</option>)
                }
                </select>
            </label>

            {
                booster.id ? (
                    <div
                        className="pack-button"
                        type="submit"
                        onClick={() => openPacks()}
                    >
                        Open
                    </div>
                ) : ''
            } 

            <div className="space-between-aligned">
                <FocalCard card={card}/>
                <div className="pack-interface">
                    {
                        packs?.length ? (
                            <>
                                {
                                    packs.map((pack) => (
                                        <div className="pack-flexbox">
                                            {
                                                pack.map((print) => (   
                                                    <CardImage  
                                                        key={print.cardId} 
                                                        card={print.card} 
                                                        setCard={setCard}
                                                        rarity={print.rarity}
                                                        isPackOpener={true}
                                                        width="84px"
                                                        margin="1px"
                                                        padding="1px"
                                                    />
                                                ))
                                            }
                                        </div>
                                    ))
                                }
                            </>
                        ) : ''
                    }
                    </div>
            </div>
        </div>
    )
}
