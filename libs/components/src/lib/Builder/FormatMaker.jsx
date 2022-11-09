
import { useState, useEffect, useLayoutEffect } from 'react'
import {CardImage} from '../Cards/CardImage'
import {EmptySlot} from './EmptySlot'
import {SearchPanel} from './SearchPanel'
import axios from 'axios'
import {Button, Form, Modal} from 'react-bootstrap'

export const FormatMaker = () => {
    const [cardPool, setCardPool] = useState([])
    const [format, setFormat] = useState({})
    const [name, setName] = useState('New Card Pool')
    const [customFormats, setCustomFormats] = useState([])
    const [formats, setFormats] = useState([])
    const [edited, setEdited] = useState(false)
    const [showOpenModal, setShowOpenModal] = useState(false)
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)

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

    // SORT CARD POOL
    const sortCardPool = () => {
        setCardPool(cardPool.sort(sortFn))
        setEdited(true)
    }

    // COPY CARD POOL
    const copyCardPool = async () => {
        if (edited || !cardPool.id) return alert('Save Deck before copying.')
        setName(name + ' (copy)')
        setFormat({})
        setEdited(true)
    }

    // SAVE CARD POOL
    const saveCardPool = async () => {
        const main = cardPool.main.map((card) => card.konamiCode)
        const ydk = ['created by...', '#main', ...main, ''].join('\n')

        if (format.id) {
            try {
                await axios.put(`/api/formats/save-cardpool?id=${format.id}`, {
                    ydk: ydk
                })

                setEdited(false)
                alert('Saved Card Pool!')
            } catch (err) {
                console.log(err)
                alert('Error saving Card Pool.')
            }
        } else {
            alert(`Please select a Format.`)
        }

        setShowSaveModal(false)
    }

    // READ YDK
    const readYDK = (file) => {
        const reader = new FileReader()
        reader.readAsBinaryString(file)
        reader.onloadend = async () => {
            const { data } = await axios.put(`/api/formats/read-ydk`, {
                name: file.name.slice(0, -4),
                ydk: reader.result
            })

            setCardPool(data)
            setShowUploadModal(false)
        }
    }

    // CLEAR CARD POOL
    const clearCardPool = () => {
        setCardPool([])
        setEdited(true)
    }

    // NEW CARD POOL
    const newCardPool = () => {
        setCardPool([])
        setName('New Card Pool')
        setEdited(false)
    }

    // ADD CARD
    const addCard = async (e, card) => {
        try {
            if (e.type === 'contextmenu') {
                const cardIds = cardPool.map((card) => card.id)
                if (cardIds.includes(card.id)) {
                    return
                } else {
                    setCardPool([...cardPool, card])
                    setEdited(true)
                }
            }
        } catch (err) {
            console.log(err)
        }
    }

    // REMOVE CARD
    const removeCard = async (e, index) => {
        try {
            if (e.type === 'contextmenu') {
                cardPool.splice(index, 1)
                setCardPool(cardPool)
                setEdited(true)
            }
        } catch (err) {
            console.log(err)
        }
    }

    // UPDATE FORMAT
    const updateFormat = async (formatName) => {
        const {data} = await axios.get(`/api/formats/${formatName}`) 
        setFormat(data.format)
    }

  // USE LAYOUT EFFECT
  useLayoutEffect(() => window.scrollTo(0, 0), [])

  // USE EFFECT SET DECK
  useEffect(() => {
    const fetchData = async () => {
        try {
          const {data} = await axios.get(`/api/formats`)
          setFormats(data)
        } catch (err) {
          console.log(err)
        }
    }

    const fetchData2 = async () => {
        try {
          const {data} = await axios.get(`/api/formats?category=Custom`)
          setCustomFormats(data)
        } catch (err) {
          console.log(err)
        }
    }

    fetchData()
    fetchData2()
  }, [])

  return (
    <>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css" integrity="sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2" crossOrigin="anonymous"/>
    <link rel="stylesheet" href="/style.css" />
    <div className="body" style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
        <Modal show={showOpenModal} onHide={() => {setShowOpenModal(false); setControlPanelFormat(null)}}>
            <Modal.Header closeButton>
            <Modal.Title>Open Format:</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                            <Form.Label>Format:</Form.Label>
                            <Form.Select id="format-selector" style={{width: '200px'}} aria-label="Format:" onChange={(e) => {updateFormat(e.target.value); setShowOpenModal(false)}}>
                            {
                                customFormats.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)
                            }
                            </Form.Select>
                    </Form.Group>
                </Form>
            </Modal.Body>
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

        <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)}>
            <Modal.Header closeButton style={{width: '560px'}}>
            <Modal.Title>{format.id ? 'Select Format:' : 'Save Deck:'}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{width: '560px'}}>
                <Form style={{width: '560px'}}>
                    <Form.Group className="mb-3">
                        <Form.Label>Format:</Form.Label>
                        <Form.Select 
                            aria-label="Format:" 
                            style={{width: '180px'}}
                            defaultValue={format.name || ''}
                            onChange={(e) => updateFormat(e.target.value)}
                        >
                        <option key={format.name} value={format.name}>{format.name}</option>
                        {
                            formats.filter((f) => !!f.banlist).map((f) => <option key={f.name} value={f.name}>{f.name}</option>)
                        }
                        </Form.Select>
                    </Form.Group>
                </Form>
            </Modal.Body>
        </Modal>        

    <div style={{display: 'flex', justifyContent: 'center', margin: '0px 5px 0px 15px'}}>
        <div className="builder-control-panel">
            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => newCardPool()}
            >                                    
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/new-file.png`} alt="new file"/></div> 
                <div className="control-panel-text"><b>New Card Pool</b></div> 
            </div>
            
            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => setShowOpenModal(true)}
            >                                    
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/open-file.png`} alt="open file"/></div> 
                <div className="control-panel-text"><b>Open Card Pool</b></div> 
            </div> 

            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => setShowUploadModal(true)}
            >                                    
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/upload.png`} alt="upload"/></div> 
                <div className="control-panel-text"><b>Upload Card Pool</b></div> 
            </div>

            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => clearCardPool()}
            >                                    
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/erase.png`} alt="clear"/></div> 
                <div className="control-panel-text"><b>Clear Card Pool</b></div>
            </div> 

            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => copyCardPool()}
            >                  
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/copy.png`} alt="copy"/></div> 
                <div className="control-panel-text"><b>Copy Card Pool</b></div> 
            </div> 

            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => updateFormat(format.name)}
            >                  
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/revert.png`} alt="revert"/></div> 
                <div className="control-panel-text"><b>Revert Card Pool</b></div> 
            </div> 

            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => sortCardPool()}
            >                         
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/sort.png`} alt="sort"/></div> 
                <div className="control-panel-text"><b>Sort Card Pool</b></div> 
            </div>

            <div 
                className={"show-cursor control-panel-button"}
                onClick={() => format.id ? saveCardPool() : setShowSaveModal(true)}
            >                  
                <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/save.png`} alt="save"/></div> 
                <div className="control-panel-text"><b>Save Card Pool</b></div> 
            </div> 
        </div>

        <div>
            <div className="single-deck-title-flexbox">
                <div style={{width: '80px'}}/>
                <div className="single-deck-title">{format.name + ' Card Pool' || 'New Card Pool'} <img style={{width:'32px', margin: '10px 20px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon || 'master'}.png`} alt={format.icon || 'millennium-puzzle'}/></div>
                <div style={{width: '80px', color: '#CBC5C3', margin: '0px', alignSelf: 'center'}}>{edited ? <i>Edited</i> : ''}</div>
            </div>

            <div id="main" className="deck-bubble">
                <div id="main" className="deck-flexbox">
                {
                    cardPool.map((card, index) => {
                        if (!card) {
                            return <EmptySlot className="card-image" width='72px' height='107px' padding='1px' margin='0px' key={`main-${index}`}/>
                        } else {
                            return <CardImage removeCard={removeCard} locale="main" index={index} width='72px' height='107px' padding='1px' margin='0px' key={`main-${index}`} card={card}/>
                        }
                    })
                }
                {
                    cardPool.length < 40 ? [...Array(40 - cardPool.length)].map((x, i) => <EmptySlot className="card-image" width='72px' height='107px' padding='1px' margin='0px' key={`main-${i}`}/>) :
                    cardPool.length % 10 ? [...Array(10 -  cardPool.length % 10)].map((x, i) => <EmptySlot className="card-image" width='72px' height='107px' padding='1px' margin='0px' key={`main-${i}`}/>) :
                    ''
                }
                </div>
            </div>
            
                {
                    format.id ? (
                        <div className="builder-bottom-panel">                     
                            <div>
                                <a
                                    className="link"
                                    href={`/api/formats/download/${format.id}`} 
                                    download={`${format.name}-cardpool.ydk`}
                                >                                    
                                    <div className="deck-button">
                                        <b style={{padding: '0px 6px'}}>Download</b>
                                        <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/download.png`} alt="download"/>
                                    </div> 
                                </a>
                            </div>   
                        </div>
                    ) : ''
                }
            </div>
        </div>
        <SearchPanel addCard={addCard} formats={formats}/>
    </div>
    </>
  )
}