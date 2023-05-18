
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { DeckImage } from './DeckImage.jsx'
import { DeckRow } from './DeckRow.jsx'
import { MobileDeckRow } from './MobileDeckRow'
import { Pagination } from '../General/Pagination'
import { useMediaQuery } from 'react-responsive'
import { getCookie } from '@fl/utils'
import './DeckTable.css' 

const playerId = getCookie('playerId')

export const DeckTable = () => {
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [decks, setDecks] = useState([])
    const [decksPerPage, setDecksPerPage] = useState(12)
    const [view, setView] = useState('table')
    const [sortBy, setSortBy] = useState('publishDate:desc')
    const [origin, setOrigin] = useState(null)
    const [format, setFormat] = useState(null)
    const [formats, setFormats] = useState([])
    const [isAdmin, setIsAdmin] = useState(false)
    const [isSubscriber, setIsSubscriber] = useState(false)
  
    const [queryParams, setQueryParams] = useState({
      type: null,
      builder: null,
      eventName: null
    })
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0), [])
  
    // USE EFFECT
    useEffect(() => {
        const checkIfAdmin = async () => {
            try {
                const { status } = await axios.get(`/api/players/admin/${playerId}`)
                if (status === 200) setIsAdmin(true)
            } catch (err) {
                console.log(err)
            }
        }

        const checkIfSubscriber = async () => {
            try {
                const { status } = await axios.get(`/api/players/subscriber/${playerId}`)
                if (status === 200) setIsSubscriber(true)
            } catch (err) {
                console.log(err)
            }
        }

        checkIfAdmin()
        checkIfSubscriber()
    }, [])

    // GO TO PAGE
    const goToPage = (num, location) => {
      setPage(num)
      if (location === 'bottom') {
        const tableTop = document.getElementById('resultsWrapper0').offsetTop - 10
        window.scrollTo(0, tableTop)
      }
    }
  
    // PREVIOUS PAGE
    const previousPage = (location) => {
      if (page <= 1) return
      setPage(page - 1)
      if (location === 'bottom') {
        const tableTop = document.getElementById('resultsWrapper0').offsetTop - 10
        window.scrollTo(0, tableTop)
      }
    }
  
    // NEXT PAGE
    const nextPage = (location) => {
      if (page >= Math.ceil(total / decksPerPage)) return
      setPage(page + 1)
      if (location === 'bottom') {
        const tableTop = document.getElementById('resultsWrapper0').offsetTop - 10
        window.scrollTo(0, tableTop)
      }
    }

    // COUNT
    const count = async () => {
        let url = `/api/decks/count?isAdmin=${isAdmin}&isSubscriber=${isSubscriber}`
        let filter = ''
  
        if (queryParams.eventName) filter += `,eventName:inc:${queryParams.eventName}`
        if (queryParams.builder) filter += `,builder:inc:${queryParams.builder}`
        if (queryParams.type) filter += `,type:inc:${queryParams.type}`
        if (origin) filter += `,origin:eq:${origin}`
        if (format) filter += `,formatName:eq:${format}`
        if (filter.length) url += ('&filter=' + filter.slice(1))

        const {data} = await axios.get(url)
        setTotal(data)
    }
  
    // SEARCH
    const search = async () => {
      let url = `/api/decks?page=${page}&limit=${decksPerPage}&isAdmin=${isAdmin}&isSubscriber=${isSubscriber}&sort=${sortBy}`
      let filter = ''

      if (queryParams.eventName) filter += `,eventName:inc:${queryParams.eventName}`
      if (queryParams.builder) filter += `,builder:inc:${queryParams.builder}`
      if (queryParams.type) filter += `,type:inc:${queryParams.type}`
      if (origin) filter += `,origin:eq:${origin}`
      if (format) filter += `,formatName:eq:${format}`
      if (filter.length) url += ('&filter=' + filter.slice(1))

      const { data } = await axios.get(url)
      setDecks(data)
    }
  
    // RESET
    const reset = () => {
      document.getElementById('format').value = null
      document.getElementById('searchBar').value = null
      setPage(1)
      setOrigin(null)
      setFormat(null)
      setQueryParams({
        name: null,
        builder: null,
        type: null
      })
    }
  
    // RUN QUERY
    const runQuery = () => {
      const id = document.getElementById('searchTypeSelector').value
      const otherIds = id === 'type' ? ['builder', 'eventName'] : 
          id === 'builder' ? ['type', 'eventName'] :
          ['type', 'builder']
  
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
        const fetchDecks = async () => {
          const {data} = await axios.get(`/api/decks?page=1&limit=12&sortBy=publishDate:desc`)
          setDecks(data)
        }
  
        const fetchFormats = async () => {
          const {data} = await axios.get(`/api/formats/`)
          setFormats(data)
        }
  
        count()
        fetchDecks()
        fetchFormats()
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
      <div className="body">
        <div className="event-database-flexbox">
          <img className="desktop-only" style={{ height:'80px'}} src={'https://cdn.formatlibrary.com/images/emojis/deckbox.png'} alt="deck-box"/>
          <h1>Deck Database</h1>
          <img style={{ height:'80px'}} src={'https://cdn.formatlibrary.com/images/emojis/deckbox.png'} alt="deck-box"/>
        </div>
  
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
              className="filter desktop-only"
              onChange={() => runQuery()}
            >
              <option value="type">Deck Type</option>
              <option value="builder">Builder</option>
              <option value="eventName">Event</option>
            </select>
  
            <select
              id="origin"
              defaultValue="All Decks"
              className="filter desktop-only"
              onChange={(e) => setOrigin(e.target.value)}
            >
              <option value={null}>All Decks</option>
              <option value="event">Event Decks</option>
              <option value="user">User Decks</option>
            </select>
  
            <select
              id="format"
              defaultValue={null}
              className="filter"
              onChange={(e) => setFormat(e.target.value)}
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
              defaultValue="12"
              style={{width: '195px'}}
              onChange={(e) => {setDecksPerPage(e.target.value); setPage(1)}}
            >
              <option value={12}>Show 12 Decks / Page</option>
              <option value={24}>Show 24 Decks / Page</option>
              <option value={48}>Show 48 Decks / Page</option>
              <option value={90}>Show 90 Decks / Page</option>
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
              <option value="builder:asc">Sort Builder: A ⮕ Z</option>
              <option value="builder:desc">Sort Builder: Z ⮕ A</option>
              <option value="eventName:asc">Sort Event: A ⮕ Z</option>
              <option value="eventName:desc">Sort Event: Z ⮕ A</option>
              <option value="type:asc">Sort Deck Type: A ⮕ Z</option>
              <option value="type:desc">Sort Deck Type: Z ⮕ A</option>
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
  
        <div className="paginationWrapper desktop-only">
          <div className="pagination">
            <Pagination
              location="top"
              nextPage={nextPage}
              previousPage={previousPage}
              goToPage={goToPage}
              length={total}
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
            location="bottom"
            nextPage={nextPage}
            previousPage={previousPage}
            goToPage={goToPage}
            length={total}
            page={page}
            itemsPerPage={decksPerPage}
          />
        </div>
      </div>
    )
}
