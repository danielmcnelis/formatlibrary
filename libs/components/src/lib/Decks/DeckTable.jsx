
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import axios from 'axios'
import { DeckImage } from './DeckImage.jsx'
import { DeckRow } from './DeckRow.jsx'
import { MobileDeckRow } from './MobileDeckRow'
import { Pagination } from '../General/Pagination'
import { useMediaQuery } from 'react-responsive'
import { Helmet } from 'react-helmet'
import { getCookie } from '@fl/utils'
import './DeckTable.css' 

// DECK TABLE
export const DeckTable = (props) => {
    const isMounted = useRef(false)
    const accessToken = getCookie('access')
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [decks, setDecks] = useState([])
    const [decksPerPage, setDecksPerPage] = useState(10)
    const [view, setView] = useState('table')
    const [sortBy, setSortBy] = useState('publishDate:desc')
    const [origin, setOrigin] = useState('event')
    const [format, setFormat] = useState(null)
    const [formats, setFormats] = useState([])
    const isAdmin = props.roles?.admin
    const isSubscriber = props.roles?.subscriber
  
    const [queryParams, setQueryParams] = useState({
      deckTypeName: null,
      builderName: null,
      eventAbbreviation: null
    })
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0), [page]) 
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => {
        if (!isMounted.current) return
        window.scrollTo(0, document.getElementById('sortSelector')?.offsetTop - 10)
    }, [page])

    // COUNT
    const count = async () => {
        let url = `/api/decks/count?admin=${isAdmin}&subscriber=${isSubscriber}`
        let filter = ''
  
        if (queryParams.eventAbbreviation) filter += `,event:or:${queryParams.eventAbbreviation}`
        if (queryParams.builderName) filter += `,builder:inc:${queryParams.builderName}`
        if (queryParams.deckTypeName) filter += `,type:inc:${queryParams.deckTypeName}`
        if (origin) filter += `,origin:eq:${origin}`
        if (format) filter += `,format:eq:${format}`
        if (filter.length) url += ('&filter=' + filter.slice(1))

        const {data} = await axios.get(url)
        setTotal(data)
    }
  
    // SEARCH
    const search = async () => {
        let filter = ''

        if (queryParams.eventAbbreviation) filter += `,event:or:${queryParams.eventAbbreviation}`
        if (queryParams.builderName) filter += `,builder:inc:${queryParams.builderName}`
        if (queryParams.deckTypeName) filter += `,type:inc:${queryParams.deckTypeName}`
        if (origin) filter += `,origin:eq:${origin}`
        if (format) filter += `,format:eq:${format}`
       
        // If user is subscriber or admin: Hit different endpoints that require authentication
        if (isAdmin) {
            try { 
                let url = `/api/decks/admin?page=${page}&limit=${decksPerPage}&admin=${isAdmin}&subscriber=${isSubscriber}&sort=${sortBy}`
                if (filter.length) url += ('&filter=' + filter.slice(1))
    
                const {data: deckData} = await axios.get(url, {
                    headers: {
                        ...(accessToken && {authorization: `Bearer ${accessToken}`})
                    }
                })

                setDecks(deckData)
            } catch (err) {
                console.log(err)
            }
        } else if (isSubscriber) {
            try {
                let url = `/api/decks/subscriber?page=${page}&limit=${decksPerPage}&admin=${isAdmin}&subscriber=${isSubscriber}&sort=${sortBy}`
                if (filter.length) url += ('&filter=' + filter.slice(1))
    
                const {data: deckData} = await axios.get(url, {
                    headers: {
                        ...(accessToken && {authorization: `Bearer ${accessToken}`})
                    }
                })

                setDecks(deckData)
            } catch (err) {
                console.log(err)
            }
        } else {
            try {
                let url = `/api/decks?page=${page}&limit=${decksPerPage}&sort=${sortBy}`
                if (filter.length) url += ('&filter=' + filter.slice(1))
    
                const {data: deckData} = await axios.get(url)
                setDecks(deckData)
            } catch (err) {
                console.log(err)
            }
        }
    }
  
    // RESET
    const reset = () => {
      document.getElementById('format').value = ''
      document.getElementById('origin').value = 'event'
      document.getElementById('searchBar').value = null
      document.getElementById('searchTypeSelector').value = 'deckTypeName'
      setPage(1)
      setOrigin('event')
      setSortBy('publishDate:desc')
      setFormat(null)
      setQueryParams({
        name: null,
        builderName: null,
        deckTypeName: null
      })

      count()
      search()
    }
  
    // RUN QUERY
    const runQuery = () => {
      const id = document.getElementById('searchTypeSelector').value
      const otherIds = id === 'deckTypeName' ? ['builderName', 'eventAbbreviation'] : 
          id === 'builderName' ? ['deckTypeName', 'eventAbbreviation'] :
          ['deckTypeName', 'builderName']
  
      setQueryParams(() => {
        return {
          ...queryParams,
          [id]: document.getElementById('searchBar').value,
          [otherIds[0]]: null,
          [otherIds[1]]: null
        }
      })

      setPage(1)
    }
  
    // USE EFFECT
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // const {data: deckData} = await axios.get(`/api/decks?page=1&limit=12&sortBy=publishDate:desc&filter=origin:eq:event`)
                // setDecks(deckData)

                const {data: formatData} = await axios.get(`/api/formats/`)
                setFormats(formatData)  
                
                isMounted.current = true
            } catch (err) {
                console.log(err)
            }
        }
    
        fetchInitialData()
    }, [])
  
    // USE EFFECT SEARCH
    useEffect(() => {
        search()
    }, [isAdmin, isSubscriber, format, origin, queryParams, page, decksPerPage, sortBy])
  
    // USE EFFECT COUNT
    useEffect(() => {
        count()
      }, [isAdmin, isSubscriber, format, origin, queryParams])

    // RENDER
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
  
    return (
        <>
            <Helmet>
                <title>{`Yu-Gi-Oh! Deck Database - Format Library`}</title>
                <meta name="og:title" content={`Yu-Gi-Oh! Deck Database - Format Library`}/>
                <meta name="description" content={`Search through an interactive database of thousands of Yu-Gi-Oh! decklists from recent and historic tournaments, as well as community members.`}/>
                <meta name="og:description" content={`Search through an interactive database of thousands of Yu-Gi-Oh! decklists from recent and historic tournaments, as well as community members.`}/>
            </Helmet>
            {/* Default Gaming Playlist */}
            <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            <div className="body">
                <div className="event-database-flexbox">
                    <img className="desktop-only" style={{ height:'80px'}} src={'https://cdn.formatlibrary.com/images/emojis/deckbox.png'} alt="deck-box"/>
                    <h1>Deck Database</h1>
                    {
                        isSubscriber ? (
                            <img className="desktop-only" style={{ height:'80px'}} src={'https://cdn.formatlibrary.com/images/emojis/deckbox.png'} alt="deck-box"/>
                        ) : (
                            <div className="horizontal-centered-flexbox" style={{alignItems: 'flex-end', padding: '10px 0px 10px'}}>
                                <div style={{'padding': '0px 10px'}} className="desktop-only"><i>Subscribe to view all decks.</i></div>
                                <img style={{ height:'80px'}} src={'https://cdn.formatlibrary.com/images/artworks/fl-arrow.png'} alt="deck-box"/>
                            </div>
                        )
                    }
                </div>
        
                <div className="search-component">
                    <div className="searchWrapper">
                        <input
                            id="searchBar"
                            className="filter"
                            type="text"
                            placeholder="🔍"
                            onChange={() => runQuery()}
                            onKeyDown={(e) => {
                            if (e.key === 'Enter') search()
                            }}
                        />
                
                        <div className="buttonWrapper">
                            <select
                            id="searchTypeSelector"
                            defaultValue="name"
                            className="filter"
                            onChange={() => runQuery()}
                            >
                            <option value="deckTypeName">Deck Type</option>
                            <option value="builderName">Builder</option>
                            <option value="eventAbbreviation">Event</option>
                            </select>
                
                            <select
                            id="origin"
                            defaultValue="event"
                            className="filter desktop-only"
                            onChange={(e) => setOrigin(e.target.value || null)}
                            >
                            <option value="event">Event Decks</option>
                            <option value="user">User Decks</option>
                            <option value="">All Decks</option>
                            </select>
                
                            <select
                            id="format"
                            defaultValue=""
                            className="filter"
                            onChange={(e) => setFormat(e.target.value || null)}
                            >
                            <option key={'All Formats'} value={''}>All Formats</option>
                            {
                                formats.map((f) => <option key={f.id} value={f.name}>{f.name}</option>)
                            }
                            </select>
                
                            <div
                            className="searchButton desktop-only"
                            type="submit"
                            onClick={() => search()}
                            >
                            Search
                            </div>
                        </div>
                    </div>
                </div>
        
                <div id="resultsWrapper0" className="resultsWrapper0 desktop-only">
                <div className="results" style={{width: '360px'}}>
                    Results:{decks.length? ` ${decksPerPage * (page - 1) + 1} - ${total < (decksPerPage * page) ? total: (decksPerPage * page)} of ${total}` : ''}
                </div>
        
                <div className="buttonWrapper">
                    <select
                    id="viewSwitch"
                    defaultValue="table"
                    style={{width: '130px'}}
                    onChange={() => setView(document.getElementById('viewSwitch').value)}
                    >
                    <option value="table">View Table</option>
                    <option value="gallery">View Gallery</option>
                    </select>
        
                    <select
                    id="decksPerPageSelector"
                    defaultValue="10"
                    style={{width: '160px', maxWidth: '45vw'}}
                    onChange={(e) => {setDecksPerPage(e.target.value); setPage(1)}}
                    >
                    <option value={10}>10 Decks / Page</option>
                    <option value={25}>25 Decks / Page</option>
                    <option value={50}>50 Decks / Page</option>
                    <option value={100}>100 Decks / Page</option>
                    </select>
        
                    <select
                    id="sortSelector"
                    defaultValue="nameASC"
                    style={{width: '230px'}}
                    onChange={(e) => setSortBy(e.target.value)}
                    >
                    <option value="publishDate:desc">Sort Uploaded: New ⮕ Old</option>
                    <option value="publishDate:asc">Sort Uploaded: Old ⮕ New</option>
                    <option value="placement:asc">Sort Place: Hi ⮕ Low</option>
                    <option value="placement:desc">Sort Place: Low ⮕ Hi</option>
                    <option value="downloads:desc">Sort Downloads: Hi ⮕ Low</option>
                    <option value="downloads:asc">Sort Downloads: Low ⮕ Hi</option>
                    <option value="rating:desc">Sort Likes: Hi ⮕ Low</option>
                    <option value="rating:asc">Sort Likes: Low ⮕ Hi</option>
                    <option value="builderName:asc">Sort Builder: A ⮕ Z</option>
                    <option value="builderName:desc">Sort Builder: Z ⮕ A</option>
                    <option value="eventAbbreviation:asc">Sort Event: A ⮕ Z</option>
                    <option value="eventAbbreviation:desc">Sort Event: Z ⮕ A</option>
                    <option value="deckTypeName:asc">Sort Deck Type: A ⮕ Z</option>
                    <option value="deckTypeName:desc">Sort Deck Type: Z ⮕ A</option>
                    </select>
        
                    <div
                    className="searchButton"
                    type="submit"
                    onClick={() => reset()}
                    >
                    Reset
                    </div>
                </div>
                </div>
        
                <div className="results-component">
                    <div className="paginationWrapper desktop-only">
                        <div className="pagination">
                            <Pagination
                            setPage={setPage}
                            itemCount={total}
                            page={page}
                            itemsPerPage={decksPerPage}
                            />
                        </div>
                        </div>
                
                        { isTabletOrMobile ? (
                        <div id="deck-table">
                            <table id="decks">
                            <thead>
                                <tr>
                                <th>Format</th>
                                <th>Deck</th>
                                <th>Builder</th>
                                <th>Place</th>
                                </tr>
                            </thead>
                            <tbody>
                                {decks.map((deck, index) => <MobileDeckRow key={deck.id} index={index} deck={deck}/>)}
                            </tbody>
                            </table>
                        </div>
                        ) : (view === 'table') ? (
                        <div id="deck-table">
                            <table id="decks">
                            <thead>
                                <tr>
                                <th>Format</th>
                                <th>Deck Type</th>
                                <th>Builder</th>
                                <th>Place</th>
                                <th>Event</th>
                                <th>Likes</th>
                                <th>Downloads</th>
                                <th>Uploaded</th>
                                </tr>
                            </thead>
                            <tbody>
                                {decks.map((deck, index) => <DeckRow key={deck.id} index={index} deck={deck}/>)}
                            </tbody>
                            </table>
                        </div>
                        ) : (
                        <div id="deckGalleryFlexBox">
                            {decks.map((deck, index) => <DeckImage key={deck.id} index={index} deck={deck} width="360px" margin="10px 5px" padding="5px"/>)}
                            </div>
                        )}
                
                        <div className="pagination">
                        <Pagination
                            setPage={setPage}
                            itemCount={total}
                            page={page}
                            itemsPerPage={decksPerPage}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}
