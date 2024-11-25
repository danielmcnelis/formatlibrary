
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { getCookie } from '@fl/utils'
import { Helmet } from 'react-helmet'
// import { useSocket } from '@fl/hooks'
import { PairingRow } from './PairingRow'
import { PoolRow } from './PoolRow'
import { MiniDeck } from '../../../Decks/MiniDeck'
import {Button, Form, Modal} from 'react-bootstrap'
import './RatedLobby.css'
import { useSocket } from '@fl/hooks'
const playerId = getCookie('playerId')
const colors = ['#32a852', '#585ad6', '#db3b86', '#de822c', '#ed5440', '#2bcc8e', '#58aaed', '#ae5fd9']
const colorRng =  Math.floor(Math.random() * 8)
const silhouetteRng =  Math.floor(Math.random() * 10)


// RATED LOBBY
export const RatedLobby = () => {
    const [deck, setDeck] = useState({})
    const [decks, setDecks] = useState([])
    const [format, setFormat] = useState({})
    const [formats, setFormats] = useState([])
    const [newDeckName, setNewDeckName] = useState('Unnamed Deck')
    const [pairings, setPairings] = useState([])
    const [pools, setPools] = useState([])
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showJoinModal, setShowJoinModal] = useState(false)
    const [showNewDeckModal, setShowNewDeckModal] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)
    // const [socket] = useState(useSocket())

    // JOIN
    const join = async () => {
        setShowJoinModal(false)
        const deck = JSON.parse(document.getElementById('select-deck').value)
        
        const accessToken = getCookie('access')
        const { data } = await axios.post(`/bot/rated/join?formatId=${format.id}&deckId=${deck.id}`, {
            headers: {
                ...(accessToken && {authorization: `Bearer ${accessToken}`})
            },
            playerId: playerId
        })

        if (data?.pool) {
            setPools([data.pool, ...pools])
        }

        if (data?.pairing) {
            setPairings([data.pairing, ...pairings])
        }

        return
    }

    // CANCEL
    const cancel = async () => {
        setDeck({})
        setFormat(formats[0] || {})
        setShowJoinModal(false)
    }

    // ASK FOR NEW DECK
    const askForNewDeck = async () => {
        setShowJoinModal(false)
        setShowNewDeckModal(true)
    }

    // GET REPLACE CONFIRMATION
    const getReplaceConfirmation = async (deck) => {
        if (deck) {
            setDeck(deck)
            setShowJoinModal(false)
            setShowUploadModal(true)
        }
    }

    // GET DELETE CONFIRMATION
    const getDeleteConfirmation = async (deck) => {
        if (deck) {
            setDeck(deck)
            setShowJoinModal(false)
            setShowDeleteModal(true)
        }
    }

    // READ AND REPLACE YDK
    const readAndReplaceYDK = (file) => {
        const reader = new FileReader()
        reader.readAsBinaryString(file)
        reader.onloadend = async () => {
            const { status } = await axios.put(`/api/decks/update/${deck.id}`, {
                formatName: format.name,
                formatBanlist: format.banlist,
                formatDate: format.date,
                formatCategory: format.category,
                ydk: reader.result
            })

            if (status === 200) {
                setDeck({ ...deck, ydk: reader.result })
                setDecks([... decks.filter((d) => d.id !== deck.id), { ...deck, ydk: reader.result }])
                setShowUploadModal(false)
                setShowJoinModal(true)
            }
        }
    }

    // READ YDK AND CREATE NEW DECK
    const readYDKAndCreateNewDeck = (file) => {
        const reader = new FileReader()
        reader.readAsBinaryString(file)
        reader.onloadend = async () => {
            const { status, data } = await axios.post(`/api/decks/create`, {
                name: newDeckName,
                formatName: format.name,
                builderId: playerId,
                ydk: reader.result,
                origin: 'user'
            })

            if (status === 200) {
                setDeck(data)
                setDecks([ data, ...decks ])
                setShowNewDeckModal(false)
                setShowJoinModal(true)
            }
        }
    }

    // CONVERT YDKe AND CREATE NEW DECK
    const convertYDKeAndCreateNewDeck = async (ydke) => {
        const {data: ydk} = await axios.put(`api/decks/convert-ydke-to-ydk`, {
            ydke: ydke
        })

        const { status, data } = await axios.post(`/api/decks/create`, {
            formatName: format.name,
            deckName: newDeckName,
            builderId: playerId,
            ydk: ydk,
            origin: 'user'
        })

        if (status === 200) {
            setDeck(data)
            setDecks([ data, ...decks ])
            setShowNewDeckModal(false)
            setShowJoinModal(true)
        }
    }

    // CONVERT AND REPLACE YDKe
    const convertAndReplaceYDKe = async (ydke) => {
        const {data: ydk} = await axios.put(`api/decks/convert-ydke-to-ydk`, {
            ydke: ydke
        })

        const { status } = await axios.put(`/api/decks/update/${deck.id}`, {
            formatName: format.name,
            formatBanlist: format.banlist,
            formatDate: format.date,
            formatCategory: format.category,
            ydk: ydk
        })

        if (status === 200) {
            setDeck({ ...deck, ydk })
            setDecks([... decks.filter((d) => d.id !== deck.id), { ...deck, ydk }])
            setShowUploadModal(false)
            setShowJoinModal(true)
        }
    }

    // DELETE DECK
    const deleteDeck = async (id) => {
        try {
            const {status} = await axios.delete(`/api/decks/delete/${id}`)
            if (status === 200) {
                setDeck({})
                setDecks(decks.filter((d) => d.id !== id))
            }

            setShowDeleteModal(false)
            setShowJoinModal(true)
        } catch (err) {
            console.log(err)
        }
    }

    // HOOK - SOCKET.IO
    // useEffect(() => {
    //     socket.on('?', (data) => {
    //         console.log(`${data.playerName} joined Rated Lobby.`)
    //         fetch(data.ratedId)
    //     });
    // }, [])

    // USE EFFECT - FETCH ACTIVE POOLS
    useEffect(() => {
        const fetchPools = async () => {
            const { data: pairingData } = await axios.get(`/api/rated/pairings/active`)
            setPairings(pairingData)

            const { data: poolData } = await axios.get(`/api/rated/pools/active`)
            setPools(poolData)

            const {data: formatData} = await axios.get(`/api/formats`)
            setFormats(formatData)
            setFormat(formatData[0] || {})

            const accessToken = getCookie('access')
            const { data: deckData } = await axios.get(`/api/rated/my-decks`, {
                headers: {
                    ...(accessToken && {authorization: `Bearer ${accessToken}`})
                }
            })

            setDecks(deckData)
        }

        fetchPools()
    }, [])


    return (
        <div className="rated-lobby">
            <Helmet>
                <title>{`Yu-Gi-Oh! Rated Lobby - Format Library`}</title>
                <meta name="og:title" content={`Yu-Gi-Oh! Rated Lobby - Format Library`}/>
                <meta name="description" content={`Click here to join the rated lobby for any format.`}/>
                <meta name="og:description" content={`Click here to join the rated lobby for any format.`}/>
            </Helmet>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css" integrity="sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2" crossOrigin="anonymous"/>
            <link rel="stylesheet" href="/assets/css/styles.css" />
            
            <Modal show={showJoinModal} onHide={() => cancel()}>
                <Modal.Header closeButton>
                <Modal.Title>Join Rated Lobby:</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                                <Form.Label>Format:</Form.Label>
                                <Form.Select 
                                    id="format-selector" 
                                    defaultValue={JSON.stringify(format)}
                                    onChange={(e) => setFormat(JSON.parse(e.target.value))}
                                >
                                    {
                                        formats.map((f) => <option key={f.name} value={JSON.stringify(f)}>{f.name}</option>)
                                    }
                                </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Deck:</Form.Label>
                            <Form.Select
                                id="select-deck"
                                defaultValue={deck.id ? JSON.stringify(deck) : 'N/A'}
                                onChange={(e) => setDeck(JSON.parse(e.target.value))}
                            >
                            {
                                decks.filter((d) => d.formatId === format.id).length ? (
                                    decks.filter((d) => d.formatId === format.id).map((d) => <option key={'deck-' + d.id} value={JSON.stringify(d)}>{d.name}</option>)
                                ) : <option key={'deck-na'} value="N/A">N/A</option>
                            }
                            </Form.Select>
                        </Form.Group>       
                        {
                            deck.id ? (
                                <>
                                    <MiniDeck deck={deck}/>
                                    <div className="modal-buttons-flexbox">              
                                        <div 
                                            className="show-cursor deck-button" 
                                            onClick={() => askForNewDeck()}
                                        >
                                            <b style={{padding: '0px 6px'}}>New</b>
                                            <img 
                                                style={{width:'28px'}} 
                                                src={`https://cdn.formatlibrary.com/images/emojis/new-file.png`} 
                                                alt="new-file"
                                            />
                                        </div>   
                                        <div 
                                            className={"show-cursor deck-button"}
                                            onClick={() => getReplaceConfirmation(deck)}
                                        >                  
                                            <b style={{padding: '0px 6px'}}>Replace</b>
                                            <img
                                                style={{width:'28px'}} 
                                                src={`https://cdn.formatlibrary.com/images/emojis/upload.png`} 
                                                alt="upload"
                                            />              
                                        </div>
                                        <Link to="/deck-builder" state={{ deck: deck, format: format, origin: 'user' }}>                                    
                                            <div className="show-cursor deck-button">
                                                <b style={{padding: '0px 6px'}}>Edit</b>
                                                <img 
                                                    style={{width:'28px'}} 
                                                    src={`https://cdn.formatlibrary.com/images/emojis/open-file.png`}
                                                    alt="open"
                                                />
                                            </div>
                                        </Link>                
                                        <div 
                                            className="show-cursor deck-button" 
                                            onClick={() => getDeleteConfirmation(deck)}
                                        >
                                            <b style={{padding: '0px 6px'}}>Delete</b>
                                            <img 
                                                style={{width:'28px'}} 
                                                src={`https://cdn.formatlibrary.com/images/emojis/delete.png`} 
                                                alt="trash"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : decks.filter((d) => d.formatId === format.id).length ? (
                                <>
                                    <MiniDeck deck={decks.filter((d) => d.formatId === format.id)[0]}/>
                                    <div className="modal-buttons-flexbox">              
                                        <div 
                                            className="show-cursor deck-button" 
                                            onClick={() => askForNewDeck()}
                                        >
                                            <b style={{padding: '0px 6px'}}>New</b>
                                            <img 
                                                style={{width:'28px'}} 
                                                src={`https://cdn.formatlibrary.com/images/emojis/new-file.png`} 
                                                alt="new-file"
                                            />
                                        </div>   
                                        <div 
                                            className={"show-cursor deck-button"}
                                            onClick={() => getReplaceConfirmation(decks.filter((d) => d.formatId === format.id)[0])}
                                        >                  
                                            <b style={{padding: '0px 6px'}}>Replace</b>    
                                            <img
                                                style={{width:'28px'}} 
                                                src={`https://cdn.formatlibrary.com/images/emojis/upload.png`} 
                                                alt="upload"
                                            />              
                                        </div>
                                        <Link to="/deck-builder" state={{ deck: decks.filter((d) => d.formatId === format.id)[0], format: format, origin: 'user' }}>                                    
                                            <div className="deck-button">
                                                <b style={{padding: '0px 6px'}}>Edit</b>
                                                <img
                                                    style={{width:'28px'}} 
                                                    src={`https://cdn.formatlibrary.com/images/emojis/open-file.png`}
                                                    alt="open"
                                                />
                                            </div>
                                        </Link>            
                                        <div 
                                            className="show-cursor deck-button" 
                                            onClick={() => getDeleteConfirmation(decks.filter((d) => d.formatId === format.id)[0])}
                                        >
                                            <b style={{padding: '0px 6px'}}>Delete</b>
                                            <img 
                                                style={{width:'28px'}} 
                                                src={`https://cdn.formatlibrary.com/images/emojis/delete.png`} 
                                                alt="trash"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="modal-buttons-flexbox">
                                    <div 
                                        className="show-cursor deck-button" 
                                        onClick={() => askForNewDeck()}
                                    >
                                        <b style={{padding: '0px 6px'}}>New Deck</b>
                                        <img 
                                            style={{width:'28px'}} 
                                            src={`https://cdn.formatlibrary.com/images/emojis/new-file.png`} 
                                            alt="new-file"
                                        />
                                    </div>
                                </div>      
                            )   
                        }
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => join()}>Join</Button>
                    <Button variant="secondary" onClick={() => cancel()}>Cancel</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showNewDeckModal} onHide={() => setShowNewDeckModal(false)}>
                <Modal.Header closeButton> 
                    <Modal.Title>Create New Deck:</Modal.Title> 
                </Modal.Header>
                <Modal.Body>
                    <label>YDK File (option 1):
                        <input
                            id="new-ydk"
                            type="file"
                            accept=".ydk"
                            onSub={(e) => readYDKAndCreateNewDeck(e.target.files[0])}
                        />
                    </label>

                    <label>YDK Code (option 2):
                        <input
                            id="new-ydke"
                            type="text"
                            onChange={(e) => convertYDKeAndCreateNewDeck(e.target.value)}
                        />
                    </label>

                    <label>Deck Name:
                        <input
                            id="ydk"
                            type="text"
                            onChange={(e) => setNewDeckName(e.target.value)}
                        />
                    </label>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => readYDKAndCreateNewDeck(document.getElementById('new-ydk').files[0])}>Upload</Button>
                    <Button variant="secondary" onClick={() => setShowNewDeckModal(false)}>Cancel</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
                <Modal.Header closeButton> 
                    <Modal.Title>Import YDK:</Modal.Title> 
                </Modal.Header>
                <Modal.Body>
                    <label>YDK File:
                        <input
                            id="ydk"
                            type="file"
                            accept=".ydk"
                            onChange={(e) => readAndReplaceYDK(e.target.files[0])}
                        />
                    </label>

                    <label>YDK Code:
                        <input
                            id="ydke"
                            type="text"
                            onChange={(e) => convertAndReplaceYDKe(e.target.value)}
                        />
                    </label>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => readAndReplaceYDK(document.getElementById('ydk').files[0])}>Upload</Button>
                    <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton> 
                    <Modal.Title>Delete Deck:</Modal.Title> 
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete {deck.name}?</Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => deleteDeck(deck.id)}> Delete </Button>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                </Modal.Footer>
            </Modal>

            <div className="rated-lobby">
                <div className="pools">
                    <h2 className="pools-title">Rated Lobby</h2>
                    <div className="flex-pools">
                    {
                        pools.length ? (
                            pools.map((pool, index) => {
                                return (
                                    <PoolRow 
                                        key={'pool-' + pool.id}
                                        status={pool.status}
                                        format={pool.format}
                                        createdAt={pool.createdAt}
                                        color={colors[(colorRng + index) % 8]}
                                        silhouette={`https://cdn.formatlibrary.com/images/emojis/silhouette-${(silhouetteRng + index) % 10 + 1}.png`}
                                    />
                                )
                            })
                        ) : (
                            <div>
                                <img className="sanwitch" src="https://cdn.formatlibrary.com/images/emojis/sanwitch.png" alt="sanwitch"/>
                                <p className="center">The Rated Lobby is empty.</p>
                            </div>
                        )
                    }
                    </div>
                    <div
                        className="draft-button"
                        type="submit"
                        onClick={() => {
                            if (!playerId) {
                                alert('Must be logged in to join Rated Pool.')
                            } else {
                                setShowJoinModal(true)
                            }
                        }}
                    >
                        Join
                    </div>
                </div>

                <div className="pairings">
                    <h2 className="pairings-title">Active Matches</h2>
                    <div className="flex-pairings">
                    {
                        pairings.length ? (
                            pairings.map((pairing) => {
                                return (
                                    <PairingRow
                                        key={'pairing-' + pairing.id}
                                        status={pairing.status}
                                        format={pairing.format}
                                        playerA={pairing.playerA}
                                        playerB={pairing.playerB}
                                    />
                                )
                            })
                        ) : (
                            <div>
                                <img className="thousand-dragon" src="https://cdn.formatlibrary.com/images/emojis/thousand-dragon.png" alt="thousand-dragon"/>
                                <p className="center">There are no Active Matches.</p>
                            </div>
                        )
                    }
                    </div>
                </div>
            </div>
        </div>
    )
}
