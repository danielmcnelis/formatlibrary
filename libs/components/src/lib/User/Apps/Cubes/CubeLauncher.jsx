
import { useState, useEffect } from 'react'
import axios from 'axios'
import { getCookie } from '@fl/utils'
import './CubeLauncher.css' 

export const CubeLauncher = () => {
    const [cubes, setCubes] = useState([])
    const [cube, setCube] = useState({})
    const [packSize, setPackSize] = useState(12)
    const [packsPerPlayer, setPacksPerPlayer] = useState(4)
    const [timer, setTimer] = useState(60)
    const [cubeLink, setCubeLink] = useState(null)
    const playerId = getCookie('playerId')

    const packSizeOptions = []
    let upperLimit = (cube.cardPool?.length / packsPerPlayer) < 20 ? cube.cardPool?.length / packsPerPlayer : 20
    for (let i = upperLimit; i >= 4; i--) packSizeOptions.push(i) 

    // LAUNCH
    const launch = async () => {
        if (!cube.id) return alert('Please Select a Cube.')
        if (!playerId) return alert('Please Log-in to Start a Cube Draft.')
        
        try {
            const { data } = await axios.post('/api/cubes/launch', {
                cubeId: cube.id,
                hostId: playerId,
                packSize: packSize,
                packsPerPlayer: packsPerPlayer,
                timer: timer
            })
            
            setCubeLink(data)
        } catch (err) {
            console.log(err)
        }
    }

    // FETCH CUBE
    const fetchCube = async (cubeId) => {
        const {data} = await axios.get(`/api/cubes/${cubeId}`)
        setCube(data)
    }

    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            const {data} = await axios.get(`/api/cubes`)
            setCubes(data)
        }
        
        fetchData()
    }, [])

    return (
        <div className="cube-portal">
            <div className="card-database-flexbox">
                <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/emojis/${cube.logo || 'cube.png'}`} alt="cube-logo"/>
                <div>
                    <h1>Start Cube Draft!</h1>
                </div>
                <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/emojis/${cube.logo || 'cube.png'}`} alt="cube-logo"/>
            </div>
            <br/>

            <div className="slideshow">
                <div className="mover"></div>
            </div>

            <br/>
            <label>Cube:
                <select
                    id="cube"
                    onChange={(e) => fetchCube(e.target.value)}
                >
                <option value="">Select Cube:</option>
                {
                    cubes.map((c) => <option value={c.id}>{c.name} by {c.builder}</option>)
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
                cube.id ? (
                    <div className="settings-note">
                        <i>These settings support up to {Math.floor(cube.cardPool?.length / (packsPerPlayer * packSize))} players.</i>
                    </div>
                ) : ''
            }

            <div
                className="cube-button"
                type="submit"
                onClick={() => launch()}
            >
                Launch
            </div>

            {
                cubeLink ? (
                    <div className="lobby-link">
                        Draft Lobby: <a href={cubeLink}>{cubeLink}</a>
                    </div>
                ) : ''
            }
        </div>
    )
}
