
import { useState, useEffect } from 'react'
import axios from 'axios'
import { getCookie } from '@fl/utils'
import { Helmet } from 'react-helmet'
import './DraftLauncher.css' 

export const DraftLauncher = () => {
    const [packs, setPacks] = useState([])
    const [pack, setPack] = useState({})
    const [packsPerPlayer, setPacksPerPlayer] = useState(4)
    const [timer, setTimer] = useState(60)
    const [draftLink, setDraftLink] = useState(null)
    const playerId = getCookie('playerId')

    // LAUNCH
    const launch = async () => {
        if (!pack.id) return alert('Please Select a Pack.')
        if (!playerId) return alert('Please Log-in to Start a Draft.')
        
        try {
            const { data } = await axios.post('/api/drafts/launch', {
                setId: pack.id,
                hostId: playerId,
                packsPerPlayer: packsPerPlayer,
                timer: timer
            })
            
            setDraftLink(data)
        } catch (err) {
            console.log(err)
        }
    }

    // FETCH DRAFT
    const fetchDraft = async (draftId) => {
        const {data} = await axios.get(`/api/drafts/${draftId}`)
        setDraft(data)
    }

    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            const {data} = await axios.get(`/api/drafts`)
            setDrafts(data)
        }
        
        fetchData()
    }, [])

    return (
        <>
            <Helmet>
                <title>{`Yu-Gi-Oh! Booster Draft - Yu-Gi-Oh! Format Library`}</title>
                <meta name="description" content={`Open free, virtual packs (or a box) of your favorite Yu-Gi-Oh! booster sets. Enjoy realistic pull rates and rarities for maximum nostalgia. ;)`}/>
            </Helmet>
            <div className="draft-portal">
                <div className="card-database-flexbox">
                    <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/emojis/${pack.logo || 'pack.png'}`} alt="draft-logo"/>
                    <div>
                        <h1>Start Draft Draft!</h1>
                    </div>
                    <img style={{ width:'128px'}} src={`https://cdn.formatlibrary.com/images/emojis/${pack.logo || 'pack.png'}`} alt="draft-logo"/>
                </div>
                <br/>

                <div className="slideshow">
                    <div className="mover"></div>
                </div>

                <br/>
                <label>Draft:
                    <select
                        id="draft"
                        onChange={(e) => fetchDraft(e.target.value)}
                    >
                    <option value="">Select Draft:</option>
                    {
                        drafts.map((c) => <option value={c.id}>{c.name} by {c.builder}</option>)
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
                    pack.id ? (
                        <div className="settings-note">
                            <i>These settings support up to {Math.floor(pack.cardPool?.length / (packsPerPlayer * packSize))} players.</i>
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
