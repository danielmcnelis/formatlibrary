
import { useState, useEffect, useLayoutEffect } from 'react'
import {CardImage} from '../Cards/CardImage'
import {EmptySlot} from './EmptySlot'
import {SearchPanel} from './SearchPanel'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import {Button, Form, Modal} from 'react-bootstrap'
import { getCookie } from '@fl/utils'

export const Builder = () => {
    const [decks, setDecks] = useState([])
    const [deck, setDeck] = useState({
        name: 'New Deck',
        main: [],
        side: [],
        extra: []
    })

    const myFormats = [...new Set(decks.map((d) => d.formatName))]
    const myDeckTypes = [...new Set(decks.map((d) => d.type))]
    const [format, setFormat] = useState({})
    const [controlPanelDeckType, setControlPanelDeckType] = useState(null)
    const [controlPanelFormat, setControlPanelFormat] = useState(null)
    const [formats, setFormats] = useState([])
    const [deckTypes, setDeckTypes] = useState([])
    const [banlist, setBanlist] = useState({})
    const [edited, setEdited] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showOpenModal, setShowOpenModal] = useState(false)
    const [showPublishModal, setShowPublishModal] = useState(false)
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const location = useLocation()

    // SORT FUNCTION
    const sortFn = (a, b) => {
        if (a.sortPriority > b.sortPriority) {
            return 1
        } else if (b.sortPriority > a.sortPriority) {
            return -1
        } else if (a.name > b.name) {
            return 1
        } else if (b.name > a.name) {
            return -1
        } else {
            return false
        }
    }

    // GET DECKS
    const getDecks = async () => {
        try {
            const {data} = await axios.get(`/api/decks/my-decks?id=${getCookie('playerId')}`)
            setDecks(data)
        } catch (err) {
            console.log(err)
        }
    }

    // SORT DECK
    const sortDeck = () => {
        const data = {
            ...deck,
            main: deck.main.sort(sortFn),
            side: deck.side.sort(sortFn),
            extra: deck.extra.sort(sortFn)
        }

        setDeck(data)
        setEdited(true)
    }

    // SHARE DECK
    const shareDeck = async () => {
        try {
            setShowShareModal(false)
            const expiresIn = parseInt(document.getElementById('link-expiration').value)
            const linkExpiration = new Date(Date.now() + expiresIn)
            const { data } = await axios.put(`/api/decks/share/${deck.id}`, {
                linkExpiration: linkExpiration
            })

            const shareLink = data.shareLink
            setDeck({ ...deck, shareLink, linkExpiration })            
            window.open(`/decks/${shareLink}`, "_blank")
        } catch (err) {
            console.log(err)
        }
    }

    // HANDLE OTHER DECKTYPE INPUT
    const handleOtherDeckTypeInput = (e) => {
        document.getElementById('deck-type').value = "Other"
        setDeck({
            ...deck,
            type: 'Other',
            deckTypeId: 124,
            suggestedType: e.target.value
        })

        setEdited(true)
    }

    // COPY DECK
    const copyDeck = async () => {
        if (edited || !deck.id) return alert('Save Deck before copying.')

        setDeck({
            ...deck,
            name: deck.name + ' (copy)',
            id: null
        })

        setEdited(true)
    }

    // SAVE DECK
    const saveDeck = async () => {
        const name = document.getElementById('save-as-name') ? document.getElementById('save-as-name').value : deck.name
        const main = deck.main.map((card) => card.konamiCode)
        const side = deck.side.map((card) => card.konamiCode)
        const extra = deck.extra.map((card) => card.konamiCode)
        const ydk = ['created by...', '#main', ...main, '#extra', ...extra, '!side', ...side, ''].join('\n')

        if (deck.id) {
            try {
                await axios.put(`/api/decks/update/${deck.id}`, {
                    name: name,
                    type: deck.type,
                    deckTypeId: deck.deckTypeId,
                    category: deck.category,
                    suggestedType: deck.suggestedType,
                    formatName: format.name,
                    formatDate: format.date,
                    formatBanlist: format.banlist,
                    formatId: format.id,
                    ydk: ydk
                })

                setEdited(false)
                alert('Saved Deck!')
            } catch (err) {
                console.log(err)
                if (err.response.status === 409) {
                    alert(`Deck is not legal for ${format.name} Format.`)
                } else if (err.response.status === 400) {
                    alert('Name is already in use.')
                } else {
                    alert('Error Saving Deck.')
                }
            }
        } else {
            try {
                const { data } = await axios.post(`/api/decks/create`, {
                    name: name,
                    playerId: getCookie('playerId'),
                    type: deck.type,
                    deckTypeId: deck.deckTypeId,
                    category: deck.category,
                    suggestedType: deck.suggestedType,
                    formatName: format.name,
                    formatDate: format.date,
                    formatBanlist: format.banlist,
                    formatId: format.id,
                    ydk: ydk,
                    display: false
                })

                setDeck({
                    ...deck,
                    name: name,
                    formatName: format.name,
                    formatId: format.id,
                    id: data.id
                })

                setEdited(false)
                alert('Saved Deck!')
                getDecks()
            } catch (err) {
                console.log(err)
                if (err.response.status === 409) {
                    alert(`Deck is not legal for ${format.name} Format.`)
                } else {
                    alert('Error Saving Deck.')
                }
            }
        }


        setShowSaveModal(false)
    }

    // PUBLISH DECK 
    const publishDeck = async () => {
        const { status } = await axios.put(`/api/decks/publish/${deck.id}`)
        if (status === 200) setDeck({...deck, display: true})
        setShowPublishModal(false)
    }

    // UNPUBLISH DECK 
    const unpublishDeck = async () => {
        const { status } = await axios.put(`/api/decks/unpublish/${deck.id}`)
        if (status === 200) setDeck({...deck, display: false})
        setShowPublishModal(false)
    }

    // READ YDK
    const readYDK = (file) => {
        const reader = new FileReader()
        reader.readAsBinaryString(file)
        reader.onloadend = async () => {
            const { data } = await axios.put(`/api/decks/read-ydk`, {
                name: file.name.slice(0, -4),
                ydk: reader.result
            })

            setDeck(data)
            setShowUploadModal(false)
        }
    }

    // CLEAR DECK
    const clearDeck = () => {
        setDeck({
            ...deck,
            main: [],
            side: [],
            extra: []
        })

        setEdited(true)
    }

    // NEW DECK
    const newDeck = () => {
        setDeck({
            name: 'New Deck',
            main: [],
            side: [],
            extra: []
        })

        setEdited(false)
    }

    // ADD CARD
    const addCard = async (e, card, locale) => {
        try {
            if (e.type === 'contextmenu') {
                const limit = banlist[card.id] === 'forbidden' ? 0 :
                    banlist[card.id] === 'limited' ? 1 :
                    banlist[card.id] === 'semi-limited' ? 2 :
                    3

                const count = [...deck.main, ...deck.side, ...deck.extra].reduce((accum, val) => { 
                    if (val && val.id === card.id) {
                        return accum + 1
                    } else {
                        return accum
                    }
                }, 1)

                if (count > limit) return

                if (card.extraDeck) {
                    if (format.date > '2008-08-05' && deck.extra.length >= 15) return
                    const extra = [...deck.extra, card].sort((a, b) => {if (b === null) return -1}).filter((e, index) => !!e || index <= 14)
                    setDeck({...deck, extra})
                    setEdited(true)
                } else if (locale === 'main') {
                    if (format.date > '2008-08-05' && deck.main.length >= 60) return
                    const main = [...deck.main, card].sort((a, b) => {if (b === null) return -1}).filter((e, index) => !!e || index <= 39)
                    setDeck({...deck, main})
                    setEdited(true)
                } else if (locale === 'side') {
                    if (deck.side.length >= 15) return
                    const side = [...deck.side, card].sort((a, b) => {if (b === null) return -1}).filter((e, index) => !!e || index <= 14)
                    setDeck({...deck, side})
                    setEdited(true)
                }
            }
        } catch (err) {
            console.log(err)
        }
    }

    // REMOVE CARD
    const removeCard = async (e, locale, index) => {
        try {
            if (e.type === 'contextmenu') {
                deck[locale].splice(index, 1)
                setDeck({ ...deck })
                setEdited(true)
            }
        } catch (err) {
            console.log(err)
        }
    }

    // GET DECK
    const getDeck = async (id) => {
        try {
            const {data} = await axios.get(`/api/decks/builder/${id}`)
            setDeck(data)
            setFormat(data.format)
            setShowOpenModal(false)
            setEdited(false)
        } catch (err) {
            console.log(err)
        }
    }

    // DELETE DECK
    const deleteDeck = async () => {
        try {
            const {status} = await axios.delete(`/api/decks/delete/${deck.id}`)
            if (status === 200) {
                setDeck({
                    ...deck,
                    id: null,
                    format: null,
                    formatName: null,
                    formatId: null,
                    name: 'New Deck',
                    main: [],
                    side: [],
                    extra: []
                })
            }

            getDecks()
            setShowDeleteModal(false)
        } catch (err) {
            console.log(err)
        }
    }

    // HANDLE DECK TYPE SELECT
    const handleDeckTypeSelect = async (e) => {
        try {
            const { data } = await axios.get(`/api/deckTypes/${e.target.value}`)

            setDeck({
                ...deck,
                type: data.name,
                deckTypeId: data.id,
                category: data.category,
                suggestedType: null
            })

            setEdited(true)
        } catch (err) {
            console.log(err)
        }
    
        document.getElementById('other-deck-type').value = ""
    }

    // UPDATE FORMAT
    const updateFormat = async (e) => {
        if (e.target.value && e.target.value.length) {
            const {data} = await axios.get(`/api/formats/${e.target.value}`) 
            setFormat(data.format)
            setDeck({
                ...deck,
                format: data.format,
                formatName: data.format.name,
                formatId: data.format.id
            })
        } else {
            setFormat({})
        }
    }

  // USE LAYOUT EFFECT
  useLayoutEffect(() => window.scrollTo(0, 0), [])

  // USE EFFECT SET DECK
  useEffect(() => {
    const fetchData = async () => {
      try {
        const {data} = await axios.get(`/api/decks/my-decks?id=${getCookie('playerId')}`)
        setDecks(data)
      } catch (err) {
        console.log(err)
      }
    }

    const fetchData1 = async () => {
        try {
          const {data} = await axios.get(`/api/decktypes/`)
          setDeckTypes(data)
        } catch (err) {
          console.log(err)
        }
    }

    const fetchData2 = async () => {
        try {
          const {data} = await axios.get(`/api/formats`)
          setFormats(data)
        } catch (err) {
          console.log(err)
        }
    }

    const fetchData3 = async () => {
        try {
          const {data} = await axios.get(`/api/formats/current`)
          setFormat(data.format)
        } catch (err) {
          console.log(err)
        }
    }

    const fetchData4 = async () => {
        try {
            const { builder, ydk, name, type } = location.state.deck

            const { data } = await axios.put(`/api/decks/read-ydk`, {
                name: name,
                ydk: ydk
            })
            
            setDeck({
                ...data,
                id: null,
                name: `${builder}-${type || name}`,
                format: format
            })

            setFormat(location.state.deck.format)
        } catch (err) {
            console.log(err)
        }
    }

    fetchData()
    fetchData1()
    fetchData2()

    if (location && location.state && location.state.deck) {
        fetchData4()
    } else {
        fetchData3()
    }
  }, [])

  // USE EFFECT SET DECK
  useEffect(() => {
    if (!format.banlist) return
    const fetchData = async () => {
      try {
        const {data} = await axios.get(`/api/banlists/simple/${format.banlist}`)
        setBanlist(data)
      } catch (err) {
        console.log(err)
      }
    }

    fetchData()
  }, [format])

  return (
    <>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css" integrity="sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2" crossOrigin="anonymous"/>
    <link rel="stylesheet" href="/assets/css/styles.css" />
    <div className="body" style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
        <Modal show={showOpenModal} onHide={() => {setShowOpenModal(false); setControlPanelFormat(null)}}>
            <Modal.Header closeButton>
            <Modal.Title>Open Deck:</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                            <Form.Label>Format:</Form.Label>
                            <Form.Select id="format-selector" style={{width: '200px'}} aria-label="Format:" onChange={(e) => setControlPanelFormat(e.target.value !== 'All Formats' ? e.target.value : null)}>
                                <option key="all-formats" value={null}>All Formats</option>
                            {
                                formats.filter((f) => f.banlist && myFormats.includes(f.name)).map((f) => <option key={f.name} value={f.name}>{f.name}</option>)
                            }
                            </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                            <Form.Label>Deck-Type:</Form.Label>
                            <Form.Select id="format-selector" style={{width: '200px'}} aria-label="Format:" onChange={(e) => setControlPanelDeckType(e.target.value !== 'All Deck-Types' ? e.target.value : null)}>
                                <option key="all-formats" value={null}>All Deck-Types</option>
                            {
                                deckTypes.filter((dt) => myDeckTypes.includes(dt.name)).map((dt) => <option key={dt.id} value={dt.name}>{dt.name}</option>)
                            }
                            </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Deck:</Form.Label>
                        <Form.Select
                            aria-label="deck-name" 
                            id="deck-name"
                            defaultValue={null}
                            className="filter"
                            onChange={(e) => {getDeck(e.target.value); setControlPanelFormat(null); setControlPanelDeckType(null)}}
                        >
                        {
                            decks.filter((d) => (!controlPanelFormat && !controlPanelDeckType) || (!controlPanelFormat || d.formatName === controlPanelFormat) && (!controlPanelDeckType || d.type === controlPanelDeckType)).map((d) => <option key={d.id} value={d.id}>{d.id === deck.id ? deck.name : d.name}</option>)
                        }
                        </Form.Select>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={() => {getDeck(document.getElementById('deck-name').value); setControlPanelFormat(null)}}>Open</Button>
                <Button variant="secondary" onClick={() => {setShowOpenModal(false); setControlPanelFormat(null)}}>Cancel</Button>
            </Modal.Footer>
        </Modal>
        
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
            <Modal.Header closeButton> 
                <Modal.Title>Delete Deck:</Modal.Title> 
            </Modal.Header>
            <Modal.Body>Are you sure you want to delete {deck.name}?</Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={() => deleteDeck()}> Delete </Button>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            </Modal.Footer>
        </Modal>
        
        <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
            <Modal.Header closeButton> 
                <Modal.Title>Import YDK:</Modal.Title> 
            </Modal.Header>
            <Modal.Body>
                <label>YDK:
                    <input
                        id="ydk"
                        className="login"
                        type="file"
                        accept=".ydk"
                        onChange={(e) => readYDK(e.target.files[0])}
                    />
                </label>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={() => readYDK(document.getElementById('ydk').files[0])}>Upload</Button>
                <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    
        <Modal show={showPublishModal} onHide={() => setShowPublishModal(false)}>
            <Modal.Header closeButton> 
                <Modal.Title>{deck.display ? 'Unpublish Deck' : 'Publish Deck'}</Modal.Title> 
            </Modal.Header>
            <Modal.Body>Are you sure you want make {deck.name} {deck.display ? 'private' : 'public'}?</Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={() => deck.display ? unpublishDeck() : publishDeck()}>{deck.display ? 'Unpublish' : 'Publish'}</Button>
                <Button variant="secondary" onClick={() => setShowPublishModal(false)}>Cancel</Button>
            </Modal.Footer>
        </Modal>

        <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)}>
            <Modal.Header closeButton style={{width: '560px'}}>
            <Modal.Title>{deck.id ? 'Edit Labels:' : 'Save Deck:'}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{width: '560px'}}>
                <Form style={{width: '560px'}}>
                    <Form.Group className="mb-3">
                        <Form.Label>Name:</Form.Label>
                        <Form.Control
                            type="name"
                            id="save-as-name"
                            defaultValue={deck.name}
                            autoFocus
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Format:</Form.Label>
                        <Form.Select 
                            aria-label="Format:" 
                            style={{width: '180px'}}
                            defaultValue={deck.format ? deck.format.name : ''}
                            onChange={(e) => updateFormat(e)}
                        >
                        <option key={format.name} value={format.name}>{format.name}</option>
                        {
                            formats.filter((f) => !!f.banlist).map((f) => <option key={f.name} value={f.name}>{f.name}</option>)
                        }
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Deck-Type:</Form.Label>
                        <Form.Select 
                            id="deck-type" 
                            aria-label="Deck Type:" 
                            defaultValue={deck.type}
                            onChange={(e) => handleDeckTypeSelect(e)}
                        >
                        <option key="None" value={null}>None</option>
                        {
                            deckTypes.map((dt) => <option key={dt.id} value={dt.name}>{dt.name}</option>)
                        }
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Deck-Type (Not Listed):</Form.Label>
                        <Form.Control
                            type="other-deck-type"
                            id="other-deck-type"
                            defaultValue={deck.suggestedType}
                            onChange={(e) => handleOtherDeckTypeInput(e)}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer style={{width: '560px'}}>
            <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
                Cancel
            </Button>
            <Button variant="primary" onClick={() => saveDeck()}>
                Save
            </Button>
            </Modal.Footer>
        </Modal>        

        <Modal show={showShareModal} onHide={() => setShowShareModal(false)}>
            <Modal.Header closeButton> 
                <Modal.Title>Share Deck</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group className="mb-3">
                    <Form.Label>Link Expires After:</Form.Label>
                    <Form.Select id="link-expiration" aria-label="Link Expires:">
                        <option key="1 hour" value={60 * 60 * 1000}>1 hour</option>
                        <option key="24 hours" value={24 * 60 * 60 * 1000}>24 hours</option>
                        <option key="7 days" value={7 * 24 * 60 * 60 * 1000}>7 days</option>
                        <option key="30 days" value={30 * 24 * 60 * 60 * 1000}>30 days</option>
                        <option key="never" value={null}>Never</option>
                    </Form.Select>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={() => shareDeck()}>Share</Button>
                <Button variant="secondary" onClick={() => setShowShareModal(false)}>Cancel</Button>
            </Modal.Footer>
        </Modal>       

    <div style={{display: 'flex', justifyContent: 'center', margin: '0px 5px 0px 15px'}}>
        <div className="builder-control-panel">
            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => newDeck()}
            >                                    
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/new-file.png`} alt="new-file"/></div> 
                <div className="control-panel-text"><b>New Deck</b></div> 
            </div> 
            
            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => {
                    setShowOpenModal(true)
                }}
            >                                    
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/open-file.png`} alt="open-file"/></div> 
                <div className="control-panel-text"><b>Open Deck</b></div> 
            </div> 

            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => setShowUploadModal(true)}
            >                                    
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/upload.png`}/></div> 
                <div className="control-panel-text"><b>Upload Deck</b></div> 
            </div>

            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => setShowSaveModal(true)}
            >                                   
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/edit.png`}/></div> 
                <div className="control-panel-text"><b>Edit Labels</b></div> 
            </div>

            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => clearDeck()}
            >                                    
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/erase.png`}/></div> 
                <div className="control-panel-text"><b>Clear Deck</b></div> 
            </div> 

            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => copyDeck()}
            >                  
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/copy.png`}/></div> 
                <div className="control-panel-text"><b>Copy Deck</b></div> 
            </div> 

            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => getDeck(deck.id)}
            >                  
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/revert.png`}/></div> 
                <div className="control-panel-text"><b>Revert Deck</b></div> 
            </div> 

            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => sortDeck()}
            >                         
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/sort.png`}/></div> 
                <div className="control-panel-text"><b>Sort Deck</b></div> 
            </div>

            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => deck.id ? saveDeck() : setShowSaveModal(true)}
            >                  
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/save.png`}/></div> 
                <div className="control-panel-text"><b>Save Deck</b></div> 
            </div> 
        </div>

        <div>
            <div className="single-deck-title-flexbox">
                <div style={{width: '80px'}}/>
                <div className="single-deck-title">{deck.name || 'New Deck'} <img style={{width:'32px', margin: '10px 20px'}} src={`https://cdn.formatlibrary.com/images/emojis/${deck.format ? format.icon : 'master'}.png`}/></div>
                <div style={{width: '80px', color: '#CBC5C3', margin: '0px', alignSelf: 'center'}}>{edited ? <i>Edited</i> : ''}</div>
            </div>

            <div id="main" className="deck-bubble">
                <div id="main" className="deck-flexbox">
                {
                    deck.main.map((card, index) => {
                        if (!card) {
                            return <EmptySlot className="card-image" width='72px' height='107px' padding='1px' margin='0px' key={`main-${index}`}/>
                        } else {
                            return <CardImage removeCard={removeCard} locale="main" index={index} width='72px' height='107px' padding='1px' margin='0px' key={`main-${index}`} card={card} status={banlist[card.id]}/>
                        }
                    })
                }
                {
                    deck.main.length < 40 ? [...Array(40 - deck.main.length)].map((x, i) => <EmptySlot className="card-image" width='72px' height='107px' padding='1px' margin='0px' key={`main-${i}`}/>) :
                    deck.main.length % 10 ? [...Array(10 -  deck.main.length % 10)].map((x, i) => <EmptySlot className="card-image" width='72px' height='107px' padding='1px' margin='0px' key={`main-${i}`}/>) :
                    ''
                }
                </div>
            </div>
            
                <div id="side" className="deck-bubble">
                    <div id="side" className="deck-flexbox">
                    {
                        deck.side.map((card, index) => {
                            if (!card) {
                                return <EmptySlot className="card-image" width='48px' height='71px' padding='0.5px' margin='0px' key={`side-${index}`}/>
                            } else {
                                return <CardImage className="card-image" removeCard={removeCard} locale="side" index={index} width='48px' height='71px' padding='0.5px' margin='0px' key={`side-${index}`} card={card} status={banlist[card.id]}/>
                            }
                        })              
                    }
                    {
                        [...Array(15 - deck.side.length)].map((x, i) => <EmptySlot className="card-image" width='48px' height='71px' padding='0.5px' margin='0px' key={`side-${i}`}/>)
                    }
                    </div>
                </div>
        
                <div id="extra" className="deck-bubble">
                    <div id="extra" className="deck-flexbox">
                    {
                        deck.extra.map((card, index) => {
                            if (!card) {
                                return <EmptySlot className="card-image" width='48px' height='71px' padding='0.5px' margin='0px' key={`extra-${index}`}/>
                            } else {
                                return <CardImage className="card-image" removeCard={removeCard} locale="extra" index={index} onContextMenu={() => removeCard('extra', index)} width='48px' height='71px' padding='0.5px' margin='0px' key={`extra-${index}`} card={card} status={banlist[card.id]}/>
                            }
                        })
                    }
                    {
                        deck.extra.length < 15 ? [...Array(15 - deck.extra.length)].map((x, i) => <EmptySlot className="card-image" width='48px' height='71px' padding='0.5px' margin='0px' key={`extra-${i}`}/>) :
                        deck.extra.length % 15 ? [...Array(15 -  deck.extra.length % 15)].map((x, i) => <EmptySlot className="card-image" width='48px' height='71px' padding='0.5px' margin='0px' key={`extra-${i}`}/>) :
                        ''
                    }
                    </div>
                </div>
                {
                    deck.id ? (
                        <div className="builder-bottom-panel">                     
                            <div 
                                className="show-cursor deck-button" 
                                onClick={() => setShowDeleteModal(true)}
                            >
                                <b style={{padding: '0px 6px'}}>Delete</b>
                                <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/delete.png`}/>
                            </div>   
                                
                            <div>
                                <a
                                    className="link"
                                    href={`/api/decks/download/${deck.id}?playerId=${deck.playerId}`} 
                                    download={`${deck.builder}-${deck.name || deck.type}.ydk`}
                                >                                    
                                    <div className="deck-button">
                                        <b style={{padding: '0px 6px'}}>Download</b>
                                        <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/download.png`}/>
                                    </div> 
                                </a>
                            </div>   
                            
                            <div>
                                <div 
                                    className="show-cursor deck-button"
                                    onClick={() => {
                                        if (deck.display) {
                                            window.open(`/decks/${deck.id}`, "_blank")
                                        } else if (deck.shareLink && new Date() < deck.linkExpiration) {
                                            window.open(`/decks/${deck.shareLink}`, "_blank")
                                        } else {
                                            setShowShareModal(true)
                                        }
                                    }}
                                >
                                    <b style={{padding: '0px 6px'}}>Share</b>
                                    <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/share.png`}/>
                                </div>
                            </div>
                                
                            <div 
                                className="show-cursor deck-button"
                                onClick={() => setShowPublishModal(true)}
                            >
                                {
                                    deck.display ? (
                                        <div className="deck-button">
                                            <b style={{padding: '0px 6px'}}>Unpublish</b>
                                            <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/hide.png`}/>
                                        </div> 
                                    ) : (
                                        <div className="deck-button">
                                            <b style={{padding: '0px 6px'}}>Publish</b>
                                            <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/globe.png`}/>
                                        </div> 
                                    )
                                }
                            </div>
                        </div>
                    ) : ''
                }
            </div>
        </div>
        <SearchPanel addCard={addCard} format={format} formats={formats} setFormat={setFormat}/>
    </div>
    </>
  )
}