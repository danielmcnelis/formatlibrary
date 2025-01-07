
import { useState, useEffect } from 'react'
import axios from 'axios'
import { getCookie } from '@fl/utils'
import { Helmet } from 'react-helmet'
import './DraftLauncher.css' 

// DRAFT LAUNCHER
export const DraftLauncher = () => {
    const [type, setType] = useState('cube')
    const [boosters, setBoosters] = useState([])
    const [booster, setBooster] = useState({})
    const [cubes, setCubes] = useState([])
    const [cube, setCube] = useState({})
    const [packSize, setPackSize] = useState(12)
    const [packsPerPlayer, setPacksPerPlayer] = useState(4)
    const [timer, setTimer] = useState(60)
    const [draftLink, setDraftLink] = useState(null)
    const playerId = getCookie('playerId')
    const logoName = type === 'cube' ? `https://cdn.formatlibrary.com/images/emojis/${cube?.logo || 'cube.png'}` :
        `https://cdn.formatlibrary.com/images/artworks/${booster?.setCode || 'back'}.jpg`
        
    const logoWidth = type === 'cube' ? '128px' : '100px'

    const packSizeOptions = []
    if (type === 'cube') {
        let upperLimit = (cube.size / packsPerPlayer) < 20 ? cube.size / packsPerPlayer : 20
        for (let i = upperLimit; i >= 4; i--) packSizeOptions.push(i) 
    } else {
        if (booster.id) {
            packSizeOptions.push(booster.packSize)
        } else {
            packSizeOptions.push(packSize)
        }
    }

    // LAUNCH
    const launch = async () => {
        if (!cube.id && !booster.id) return alert(`Please Select a ${type === 'cube' ? 'Cube' : 'Booster'}.`)
        if (!playerId) return alert('Please Log-in to Start a Draft.')
        
        try {
            const { data } = await axios.post('/api/drafts/launch', {
                type: type,
                cubeId: cube.id,
                boosterId: booster.id,
                hostId: playerId,
                packSize: packSize,
                packsPerPlayer: packsPerPlayer,
                timer: timer
            })
            
            setDraftLink(data)
        } catch (err) {
            console.log(err)
        }
    }

    // USE EFFECT
    useEffect(() => {
        if (booster.id) setPackSize(booster.packSize)
    }, [booster])

    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            const {data: cubeData} = await axios.get(`/api/cubes`)
            setCubes(cubeData)

            const {data: boosterData} = await axios.get(`/api/sets/draftable`)
            setBoosters(boosterData)
        }
        
        fetchData()
    }, [])

    return (
        <>
            <Helmet>
                <title>{`Start a Yu-Gi-Oh! Draft - Format Library`}</title>
                <meta name="og:title" content={`Start a Yu-Gi-Oh! Draft - Format Library`}/>
                <meta name="description" content={`Draft cards from any cube or booster set with your friends. ${cubes?.slice(0, 3)?.map((c) => `${c.name} by ${c.builder}`).join('•')}`}/>
                <meta name="og:description" content={`Draft cards from any cube or booster set with your friends. ${cubes?.slice(0, 3)?.map((c) => `${c.name} by ${c.builder}`).join('•')}`}/>
            </Helmet>
            <div className="draft-portal">
                <div className="card-database-flexbox">
                    <img style={{ width:logoWidth }} src={logoName} alt="draft-logo"/>
                <div>
                        <h1>Start a New Draft!</h1>
                    </div>
                    <img style={{ width:logoWidth }} src={logoName} alt="draft-logo"/>
                </div>

                <br/>

                <div className="slideshow">
                {
                    type === 'cube' ? (
                        <div className="mover" style={{background: `url(https://cdn.formatlibrary.com/images/cubes/slideshows/${cube.id?.toString() || '1'}.png)`}}></div>
                    ) : (
                        <div className="mover" style={{background: `url(https://cdn.formatlibrary.com/images/sets/slideshows/${booster?.setCode || 'MRD'}.png)`}}></div>
                    )
                }
                </div>

                <br/>

                <label>Draft Type:
                    <select
                        id="pack-number"
                        defaultValue="cube"
                        onChange={(e) => {setType(e.target.value)}}
                    >
                        <option value="cube">Cube</option>)
                        <option value="booster">Booster</option>)
                    </select>
                </label>

                <label>{type === 'cube' ? 'Cube' : 'Booster'}:
                    <select
                        id="cube"
                        onChange={(e) => {
                            if (type === 'cube') {
                                setCube(cubes[e.target.value])
                            } else {
                                setBooster(boosters[e.target.value])
                            }
                        }}
                    >
                    <option value="">{`Select ${type === 'cube' ? 'Cube': 'Booster'}:`}</option>
                    {
                        type === 'cube' ? (
                            cubes.map((c, index) => <option value={index}>{c.name} by {c.builderName}</option>)
                        ) : (
                            boosters.map((b, index) => <option value={index}>{b.name}</option>)
                        )
                    }
                    </select>
                </label>

                <label>Pack Size:
                    <select
                        id="pack-size"
                        defaultValue="12"
                        onChange={(e) => {setPackSize(e.target.value)}}
                    >
                    {
                        packSizeOptions.map((size) => <option value={size}>{size} Cards / Pack</option>)
                    }
                    </select>
                </label>

                <label>Pack Number:
                    <select
                        id="pack-number"
                        defaultValue="4"
                        onChange={(e) => {setPacksPerPlayer(e.target.value)}}
                    >
                        <option value="6">6 Packs / Player</option>)
                        <option value="5">5 Packs / Player</option>)
                        <option value="4">4 Packs / Player</option>)
                        <option value="3">3 Packs / Player</option>)
                        <option value="2">2 Packs / Player</option>)
                    </select>
                </label>

                <label>Timer:
                    <select
                        id="pack-number"
                        defaultValue="60"
                        onChange={(e) => {setTimer(e.target.value)}}
                    >
                        <option value="90">90 Seconds / Pick</option>)
                        <option value="75">75 Seconds / Pick</option>)
                        <option value="60">60 Seconds / Pick</option>)
                        <option value="45">45 Seconds / Pick</option>)
                        <option value="30">30 Seconds / Pick</option>)
                    </select>
                </label>

                {
                    type === 'cube' && cube.id ? (
                        <div className="settings-note">
                            <i>These settings support up to {Math.floor(cube.size / (packsPerPlayer * packSize))} players.</i>
                        </div>
                    ) : ''
                }

                <div
                    className="draft-button"
                    type="submit"
                    onClick={() => launch()}
                >
                    Launch
                </div>

                {
                    draftLink ? (
                        <div className="lobby-link">
                            Draft Lobby: <a href={draftLink}>{draftLink}</a>
                        </div>
                    ) : ''
                }
            </div>
        </>
    )
}
