
import { useState, useEffect } from 'react'
import axios from 'axios'
import { CardImage } from '../../../Cards/CardImage'
import { FocalCard } from '../Builder/FocalCard'
import { Helmet } from 'react-helmet'
import './PackSimulator.css' 

export const PackSimulator = () => {
    const [boosters, setBoosters] = useState([])
    const [booster, setBooster] = useState({})
    const [count, setCount] = useState(1)
    const [packs, setPacks] = useState([])
    const [card, setCard] = useState({})
    console.log('packs', packs)

    const packNumberOptions = []
    for (let i = 1; i <= 24; i++) packNumberOptions.push(i) 

    // OPEN PACKS
    const openPacks = async () => {
        const {data} = await axios.get(`/api/sets/open-packs/${booster?.setCode}?count=${count}`)
        console.log('data', data)
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
        <>
            <Helmet>
                <title>{`Yu-Gi-Oh! Pack Simulator - Yu-Gi-Oh! Format Library`}</title>
                <meta name="description" content={`Open free, virtual packs (or a box) of your favorite Yu-Gi-Oh! booster sets. Enjoy realistic pull rates and rarities for maximum nostalgia. ;)`}/>
            </Helmet>
            <div className="pack-portal">
                <div className="pack-opener-title-flexbox">
                    <img style={{ width:'100px'}} src={`https://cdn.formatlibrary.com/images/artworks/${booster.setCode || 'back'}.jpg`} alt="pack art"/>
                    <div style={{ width:'96%'}}>
                        <h1 style={{ padding: '0px 0px 8px'}}>Pack Simulator</h1>
                        <div className="slideshow">
                            <div className="mover" style={{background: `url(https://cdn.formatlibrary.com/images/sets/slideshows/${booster?.setCode}.png)`}}></div>
                        </div>
                    </div>
                    <img style={{ width:'100px'}} src={`https://cdn.formatlibrary.com/images/artworks/${booster.setCode || 'back'}.jpg`} alt="pack art"/>
                </div>
                <br/>

                <div className="pack-opener-options-flexbox">
                    <label className="pack-opener-label">Booster Set:
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

                    <label className="pack-opener-label">Packs:
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
                                Purchase
                            </div>
                        ) : null
                    } 
                </div>

                <div className="space-between-aligned">
                    <FocalCard card={card}/>
                    <div className="pack-interface">
                        {
                            packs?.length ? (
                                <>
                                    {
                                        packs.map((pack) => {
                                            console.log('pack', pack)
                                            return (
                                            <div className="pack-flexbox">
                                                {
                                                    pack.map((print) => (   
                                                        <CardImage  
                                                            key={print.cardId} 
                                                            card={print.card} 
                                                            setCard={setCard}
                                                            rarity={print.rarity}
                                                            isPackSimulator={true}
                                                            width="84px"
                                                            margin="1px"
                                                            padding="1px"
                                                        />
                                                    ))
                                                }
                                            </div>
                                        )})
                                    }
                                </>
                            ) : ''
                        }
                        </div>
                </div>
            </div>
        </>
    )
}
