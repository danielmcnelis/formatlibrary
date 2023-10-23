
import { useState, useEffect, useLayoutEffect } from 'react'
import {CardImage} from '../../../Cards/CardImage'
import {EmptySlot} from './EmptySlot'
import {FocalCard} from './FocalCard'
import {SearchPanel} from './SearchPanel'
import { getCookie } from '@fl/utils'
import axios from 'axios'
import {Button, Form, Modal} from 'react-bootstrap'
import {DndContext} from '@dnd-kit/core'
import {Draggable} from '../../../General/Draggable'
import {Droppable} from '../../../General/Droppable'
import { Helmet } from 'react-helmet'
import './Builder.css'
import './CubeMaker.css'

// CUBE MAKER
export const CubeMaker = () => {
    const [cube, setCube] = useState({
        name: 'New Cube',
        cardPool: []
    })

    const [cubes, setCubes] = useState([])
    const [card, setCard] = useState({})
    const [edited, setEdited] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showOpenModal, setShowOpenModal] = useState(false)
    const [showPublishModal, setShowPublishModal] = useState(false)
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)

    // CHANGE SLOT
    const changeSlot = async (locale, index1, index2) => {
        try {
            const card = cube?.cardPool[index1]
            index2 = index2 <= cube?.cardPool.length - 1 ? index2 : cube?.cardPool.length - 1
            cube?.cardPool.splice(index1, 1)
            cube?.cardPool.splice(index2, 0, card)
            setCube({ ...cube })
            setEdited(true)
        } catch (err) {
            console.log(err)
        }
    }

    // HANDLE DRAG END
    const handleDragEnd = (event) => {
        const card = event.active?.data?.current?.card
        const [, locale, index] = event.active?.id?.split('-') || []
        if (event.over && event.over.id?.includes('droppable')) {
            const [, , index2] = event.over?.id?.split('-') || []
            if (event.over.id.includes('main') && event.active.id.includes('search')) {
                addCard(card, 'main')
            } else if (event.over.id.includes('main') && event.active.id.includes('main')) {
                changeSlot(locale, index, index2)
            }
        } else {
            if (event.active.id.includes('main')) {
                removeCard(locale, index)
            }
        }
    }

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

    // SORT CUBE
    const sortCube = () => {
        const data = {
            ...cube,
            cardPool: cube?.cardPool.sort(sortFn)
        }

        setCube(data)
        setEdited(true)

    }

    // COPY CUBE
    const copyCube = async () => {
        if (edited || !cube?.id) return alert('Save Cube before copying.')
        setCube({
            ...cube,
            name: cube?.name + ' (copy)',
            id: null
        })

        setEdited(true)
    }

    // SAVE CUBE
    const saveCube = async () => {
        const name = document.getElementById('save-as-name') ? document.getElementById('save-as-name').value : cube?.name
        const main = cube?.cardPool.map((card) => card.konamiCode)
        const ydk = ['created by...', '#main', ...main, ''].join('\n')
        const playerId = getCookie('playerId')

        if (cube?.id) {
            try {
                await axios.put(`/api/cubes/update/${cube?.id}`, {
                    name: name,
                    ydk: ydk
                })

                setEdited(false)
                alert('Saved Cube!')
            } catch (err) {
                console.log(err)
                if (err.response.status === 400) {
                    alert('Name is already in use.')
                } else {
                    alert('Error Saving cube?.')
                }
            }
        } else {
            try {
                const { data } = await axios.post(`/api/cubes/create`, {
                    name: cube?.name,
                    playerId: playerId,
                    ydk: ydk,
                    display: false
                })

                setCube({
                    ...cube,
                    name: name,
                    id: data.id
                })

                setEdited(false)
                alert('Saved Cube!')
                getCubes()
            } catch (err) {
                console.log(err)
                alert('Error Saving cube?.')
            }
        }

        setShowSaveModal(false)
    }

    // PUBLISH CUBE 
    const publishCube = async () => {
        const { status } = await axios.put(`/api/cubes/publish/${cube.id}`)
        if (status === 200) setCube({...cube, display: true})
        setShowPublishModal(false)
    }

    // UNPUBLISH CUBE 
    const unpublishCube = async () => {
        const { status } = await axios.put(`/api/cubes/unpublish/${cube.id}`)
        if (status === 200) setCube({...cube, display: false})
        setShowPublishModal(false)
    }

    // DELETE CUBE
    const deleteCube = async () => {
        try {
            const {status} = await axios.delete(`/api/cubes/delete/${cube.id}`)
            if (status === 200) {
                setCube({
                    name: 'New Cube',
                    cardPool: []
                })
            }

            getCubes()
            setShowDeleteModal(false)
        } catch (err) {
            console.log(err)
        }
    }

    // READ YDK
    const readYDK = (file) => {
        const reader = new FileReader()
        reader.readAsBinaryString(file)
        reader.onloadend = async () => {
            const { data } = await axios.put(`/api/cubes/read-ydk`, {
                name: file?.name.slice(0, -4),
                ydk: reader.result
            })

            setCube(data)
            setShowUploadModal(false)
        }
    }

    // CLEAR CUBE
    const clearCube = () => {
        setCube({
            ...cube,
            cardPool: []
        })

        setEdited(true)
    }

    // NEW CUBE
    const newCube = () => {
        setCube({
            name: 'New Cube',
            cardPool: []
        })
        
        setEdited(false)
    }

    // ADD CARD
    const addCard = async (card) => {
        try {
            const cardIds = cube?.cardPool.map((card) => card.id)
            if (cardIds.includes(card.id)) {
                return
            } else {
                setCube({
                    ...cube,
                    cardPool: [...cube?.cardPool, card]  
                })

                setEdited(true)
            }
        } catch (err) {
            console.log(err)
        }
    }

    // REMOVE CARD
    const removeCard = async (locale, index) => {
        try {
            cube?.cardPool?.splice(index, 1)
            setCube({ ...cube })
            setEdited(true)
        } catch (err) {
            console.log(err)
        }
    }

  // USE LAYOUT EFFECT
  useLayoutEffect(() => window.scrollTo(0, 0), [])

    // UPDATE CUBE
    const updateCube = async (id) => {
        const {data} = await axios.get(`/api/cubes/${id}?view=editor`) 
        setCube(data)
    }


    // GET CUBES
    const getCubes = async () => {
        try {
            const accessToken = getCookie('access')
            if (accessToken) {
                const {data} = await axios.get(`/api/cubes/my-cubes`, {
                    headers: {
                        ...(accessToken && {authorization: `Bearer ${accessToken}`})
                    }
                })
                
                setCubes(data)
            }
        } catch (err) {
            console.log(err)
        }
    }

  // USE EFFECT GET CUBES
  useEffect(() => getCubes(), [])

  return (
    <>
        <Helmet>
            <title>{`Yu-Gi-Oh! Cube Maker - Format Library`}</title>
            <meta name="description" content={`Create your own Yu-Gi-Oh! cube. Use this app to edit the cards in your cube. Make your cube public for your friends and others to play!`}/>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css" integrity="sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2" crossOrigin="anonymous"/>
            {/* <link rel="stylesheet" href="/style.css" /> */}
        </Helmet>

        <Modal show={showOpenModal} onHide={() => {setShowOpenModal(false)}}>
            <Modal.Header closeButton>
            <Modal.Title>Open Cube:</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Cube:</Form.Label>
                        <Form.Select id="cube-selector" style={{width: '200px'}} aria-label="Cube:" onChange={(e) => {updateCube(e.target.value)}}>
                        {
                            cubes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                        }
                        </Form.Select>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={() => {updateCube(document.getElementById('cube-selector')?.value); setShowOpenModal(false)}}>Open</Button>
                <Button variant="secondary" onClick={() => {setShowOpenModal(false)}}>Cancel</Button>
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

        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
            <Modal.Header closeButton> 
                <Modal.Title>Delete Deck:</Modal.Title> 
            </Modal.Header>
            <Modal.Body>Are you sure you want to delete {cube.name}?</Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={() => deleteCube()}> Delete </Button>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            </Modal.Footer>
        </Modal>

        <Modal show={showPublishModal} onHide={() => setShowPublishModal(false)}>
            <Modal.Header closeButton> 
                <Modal.Title>{cube.display ? 'Unpublish Cube' : 'Publish Cube'}</Modal.Title> 
            </Modal.Header>
            <Modal.Body>Are you sure you want make {cube.name} {cube.display ? 'private' : 'public'}?</Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={() => cube.display ? unpublishCube() : publishCube()}>{cube.display ? 'Unpublish' : 'Publish'}</Button>
                <Button variant="secondary" onClick={() => setShowPublishModal(false)}>Cancel</Button>
            </Modal.Footer>
        </Modal>

        <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)}>
            <Modal.Header closeButton style={{width: '560px'}}>
            <Modal.Title>{cube?.id ? 'Edit Name:' : 'Save Cube:'}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{width: '560px'}}>
                <Form style={{width: '560px'}}>
                    <Form.Group className="mb-3">
                        <Form.Label>Name:</Form.Label>
                        <Form.Control
                            type="name"
                            id="save-as-name"
                            defaultValue={cube?.name}
                            autoFocus
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer style={{width: '560px'}}>
            <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
                Cancel
            </Button>
            <Button variant="primary" onClick={() => saveCube()}>
                Save
            </Button>
            </Modal.Footer>
        </Modal>   
        
        <div className="body"> 
            <DndContext onDragEnd={handleDragEnd}>
                <div className="cube-maker-interface">
                    <div className="builder-control-panel" style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', margin: '0px 5px 0px 15px'}}>
                        <div 
                            className={"show-cursor control-panel-button"}
                            onClick={() => newCube()}
                        >                                    
                            <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/new-file.png`} alt="new file"/></div> 
                            <div className="control-panel-text"><b>New Cube</b></div> 
                        </div>
                        
                        <div 
                            className={"show-cursor control-panel-button"}
                            onClick={() => setShowOpenModal(true)}
                        >                                    
                            <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/open-file.png`} alt="open file"/></div> 
                            <div className="control-panel-text"><b>Open Cube</b></div> 
                        </div> 

                        <div 
                            className={"show-cursor control-panel-button"}
                            onClick={() => setShowUploadModal(true)}
                        >                                    
                            <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/upload.png`} alt="upload"/></div> 
                            <div className="control-panel-text"><b>Upload Cube</b></div> 
                        </div>

                        <div 
                            className={"show-cursor control-panel-button"}
                            onClick={() => clearCube()}
                        >                                    
                            <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/erase.png`} alt="clear"/></div> 
                            <div className="control-panel-text"><b>Clear Cube</b></div>
                        </div> 

                        <div 
                            className={"show-cursor control-panel-button"}
                            onClick={() => copyCube()}
                        >                  
                            <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/copy.png`} alt="copy"/></div> 
                            <div className="control-panel-text"><b>Copy Cube</b></div> 
                        </div> 

                        <div 
                            className={"show-cursor control-panel-button"}
                            onClick={() => updateCube(cube?.id)}
                        >                  
                            <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/revert.png`} alt="revert"/></div> 
                            <div className="control-panel-text"><b>Revert Cube</b></div> 
                        </div> 

                        <div 
                            className={"show-cursor control-panel-button"}
                            onClick={() => sortCube()}
                        >                         
                            <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/sort.png`} alt="sort"/></div> 
                            <div className="control-panel-text"><b>Sort Cube</b></div> 
                        </div>

                        <div 
                            className={"show-cursor control-panel-button"}
                            onClick={() => cube?.id ? saveCube() : setShowSaveModal(true)}
                        >                  
                            <div><img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/save.png`} alt="save"/></div> 
                            <div className="control-panel-text"><b>Save Cube</b></div> 
                        </div> 
                    </div>

                    <Droppable locale="main">
                        <div id="main" className="cube-bubble">
                            <div id="main" className="cube-flexbox">
                            {
                                cube?.cardPool.map((card, index) => {
                                    if (!card) {
                                        return (
                                            <Droppable locale="main" index={index}>
                                                <EmptySlot 
                                                    className="card-image" 
                                                    width='72px' 
                                                    height='107px' 
                                                    padding='1px' 
                                                    margin='0px' 
                                                    key={`main-${index}`}
                                                />
                                            </Droppable>
                                        )
                                    } else {
                                        return (
                                            <Droppable locale="main" index={index}>
                                                <Draggable>
                                                    <CardImage 
                                                        removeCard={removeCard} 
                                                        setCard={setCard}
                                                        locale="main" 
                                                        index={index} 
                                                        width='72px' 
                                                        height='107px' 
                                                        padding='1px' 
                                                        margin='0px' 
                                                        key={`main-${index}`} 
                                                        card={card}
                                                        disableLink={true}
                                                    />
                                                </Draggable>
                                            </Droppable>
                                        )
                                    }
                                })
                            }
                            {
                                cube?.cardPool.length < 40 ? [...Array(40 - cube?.cardPool.length)].map((x, i) => <Droppable local="main"><EmptySlot className="card-image" width='72px' height='107px' padding='1px' margin='0px' key={`main-${i}`}/></Droppable>) :
                                cube?.cardPool.length % 10 ? [...Array(10 -  cube?.cardPool.length % 10)].map((x, i) => <Droppable local="main"><EmptySlot className="card-image" width='72px' height='107px' padding='1px' margin='0px' key={`main-${i}`}/></Droppable>) :
                                ''
                            }
                            </div>
                        </div>
                    </Droppable>   
                    <FocalCard card={card}/>
                    <SearchPanel addCard={addCard} setCard={setCard} />
                </div>
                {
                    cube?.id ? (
                        <div className="builder-bottom-panel">                     
                            <div 
                                className="show-cursor deck-button" 
                                onClick={() => setShowDeleteModal(true)}
                            >
                                <b style={{padding: '0px 6px'}}>Delete</b>
                                <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/delete.png`} alt="delete"/>
                            </div>                     
                            <div className="show-cursor cube-button">
                                <a
                                    className="link"
                                    href={`/api/formats/download/${cube?.id}`} 
                                    download={`${cube?.name}-cardpool.ydk`}
                                >                                    
                                    <div className="cube-button">
                                        <b style={{padding: '0px 6px'}}>Download</b>
                                        <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/download.png`} alt="download"/>
                                    </div> 
                                </a>
                            </div>  
                            
                            <div 
                                className="show-cursor cube-button"
                                onClick={() => setShowPublishModal(true)}
                            >
                                {
                                    cube.display ? (
                                        <div className="cube-button">
                                            <b style={{padding: '0px 6px'}}>Unpublish</b>
                                            <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/hide.png`} alt="disguised"/>
                                        </div> 
                                    ) : (
                                        <div className="cube-button">
                                            <b style={{padding: '0px 6px'}}>Publish</b>
                                            <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/globe.png`} alt="globe"/>
                                        </div> 
                                    )
                                }
                            </div> 
                        </div>
                        
                    ) : ''
                }
            </DndContext>
        </div>
    </>
  )
}