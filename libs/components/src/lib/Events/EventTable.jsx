
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import axios from 'axios'
import { EventRow } from './EventRow.jsx'
import { MobileEventRow } from './MobileEventRow'
// import { EventImage } from './EventImage'
import { Pagination } from '../General/Pagination'
import { useMediaQuery } from 'react-responsive'
import { Helmet } from 'react-helmet'
import './EventTable.css' 

export const EventTable = (props) => {
    const isMounted = useRef(false)
    const [communityName, setCommunityName] = useState(null)
    const [communities, setCommunities] = useState(['All Communities'])
    const [events, setEvents] = useState([])
    const [eventsPerPage, setEventsPerPage] = useState(10)
    const [format, setFormat] = useState(null)
    const [formats, setFormats] = useState([])
    const [page, setPage] = useState(1)
    const [sortBy, setSortBy] = useState('startedAt:desc')
    const [total, setTotal] = useState(0)
    const [view, setView] = useState('table')

    const [queryParams, setQueryParams] = useState({
      name: null,
      winner: null
    })
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => {
        if (!isMounted.current) return
        window.scrollTo(0, document.getElementById('sortSelector')?.offsetTop - 10)
    }, [page])

    // SORT EVENTS
    const sortEvents = () => {
      setSortBy(document.getElementById('sortSelector').value)
      setPage(1)
    }
  
    // COUNT
    const count = async () => {
        let url = `/api/events/count`
        let filter = ''
  
        if (queryParams.name) filter += `,name:or:${queryParams.name}`
        if (queryParams.winner) filter += `,winner:inc:${queryParams.winner}`
        if (communityName) filter += `,community:eq:${communityName}`
        if (format) filter += `,format:eq:${format}`
        if (filter.length) url += ('?filter=' + filter.slice(1))
  
        const { data } = await axios.get(url)
        setTotal(data)
    }

    // SEARCH
    const search = async () => {
        let url = `/api/events?page=${page}&limit=${eventsPerPage}&sort=${sortBy}`
        let filter = ''
  
        if (queryParams.name) filter += `,name:or:${queryParams.name}`
        if (queryParams.winner) filter += `,winner:inc:${queryParams.winner}`
        if (communityName) filter += `,community:eq:${communityName}`
        if (format) filter += `,format:eq:${format}`
        if (filter.length) url += ('&filter=' + filter.slice(1))
  
        const { data } = await axios.get(url)
        setEvents(data)
    }
  
    // RESET
    const reset = () => {
      document.getElementById('format').value = ''
      document.getElementById('community').value = ''
      document.getElementById('searchBar').value = null
      document.getElementById('searchTypeSelector').value = 'name'
      setPage(1)
      setFormat(null)
      setEvents(events)
      setSortBy('startedAt:desc')
      setQueryParams({
        name: null,
        winner: null
      })

      count()
      search()
    }
  
    // RUN QUERY
    const runQuery = () => {
      const id = document.getElementById('searchTypeSelector').value
      const otherIds = id === 'name' ? ['winner'] : ['name']
  
      setQueryParams(() => {
        return {
          ...queryParams,
          [id]: document.getElementById('searchBar').value,
          [otherIds[0]]: null
        }
      })

      setPage(1)
    }

    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            // const {data: eventData} = await axios.get(`/api/events?page=1&limit=10&sortBy=startedAt:desc`)
            // setEvents(eventData)
        
            const {data: formatData} = await axios.get(`/api/formats/`)
            setFormats(formatData)  

            const {data: communityData} = await axios.get(`/api/events/event-communities`)
            setCommunities(communityData)  
              
            isMounted.current = true
        }
  
        // count()
        fetchData()
    }, [])
  

    // USE EFFECT SEARCH
    useEffect(() => {
        count()
      }, [format, communityName, queryParams])


    // USE EFFECT SEARCH
    useEffect(() => {
        search()
    }, [page, eventsPerPage, format, communityName, queryParams, sortBy])
  

    // RENDER
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
    
    if (isTabletOrMobile) return (
        <>
            <Helmet>
                <title>{`Yu-Gi-Oh! Tournament Database - Format Library`}</title>
                <meta name="og:title" content={`Yu-Gi-Oh! Tournament Database - Format Library`}/>
                <meta name="description" content={`Search a complete database of recent and historic Yu-Gi-Oh! tournaments. Includes detailed coverage of decklists, metagame charts, and match replays.`}/>
                <meta name="og:description" content={`Search a complete database of recent and historic Yu-Gi-Oh! tournaments. Includes detailed coverage of decklists, metagame charts, and match replays.`}/>
            </Helmet>
            {/* Default Gaming Playlist */}
            <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            <div className="body">
                <div className="event-database-flexbox">
                    <h1>Event Database</h1>
                    <img style={{ height:'80px'}} src={'https://cdn.formatlibrary.com/images/emojis/event.png'} alt="trophy"/>
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
                            className="filter desktop-only"
                            onChange={() => runQuery()}
                            >
                            <option value="name">Event</option>
                            <option value="winner">Winner</option>
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
                <div className="desktop-only results" style={{width: '360px'}}>
                    Results:{events.length? ` ${eventsPerPage * (page - 1) + 1} - ${total < (eventsPerPage * page) ? total : (eventsPerPage * page)} of ${total}` : ''}
                </div>
        
                <div className="buttonWrapper">
                    <select
                    id="eventsPerPageSelector"
                    defaultValue="10"
                    style={{width: '195px'}}
                    onChange={(e) => {setEventsPerPage(e.target.value); setPage(1)}}
                    >
                    <option value={10}>10 / Page</option>
                    <option value={25}>25 / Page</option>
                    <option value={50}>50 / Page</option>
                    <option value={100}>100 / Page</option>
                    </select>
        
                    <select
                    id="sortSelector"
                    defaultValue="startedAt:desc"
                    style={{width: '230px'}}
                    onChange={(e) => {setSortBy(e.target.value); setPage(1)}}
                    >
                    <option value="startedAt:desc">Date: New ⮕ Old</option>
                    <option value="startedAt:asc">Date: Old ⮕ New</option>
                    <option value="name:asc">Event: A ⮕ Z</option>
                    <option value="name:desc">Event: Z ⮕ A</option>
                    </select>
        
                    <div
                    className="searchButton desktop-only"
                    type="submit"
                    onClick={() => reset()}
                    >
                    Reset
                    </div>
                </div>
                </div>

                <div className="results-component">
                    <div id="event-table">
                        <table id="events">
                            <thead>
                            <tr>
                                <th></th>
                                <th>Host</th>
                                <th>Event</th>
                                <th>Winner</th>
                            </tr>
                            </thead>
                            <tbody>
                            {events.map((event, index) =>  <MobileEventRow key={event.id} index={index} event={event} />)}
                            </tbody>
                        </table>
                    </div>
            
                    <div className="pagination">
                        <Pagination
                            setPage={setPage}
                            itemCount={total}
                            page={page}
                            itemsPerPage={eventsPerPage}
                        />
                    </div>
                </div>
            </div>
        </>
    )
  
    return (
        <>
            <Helmet>
                <title>{`Yu-Gi-Oh! Tournament Database - Format Library`}</title>
                <meta name="og:title" content={`Yu-Gi-Oh! Tournament Database - Format Library`}/>
                <meta name="description" content={`Search a complete database of recent and historic Yu-Gi-Oh! tournaments. Includes detailed coverage of decklists, metagame charts, and match replays.`}/>
                <meta name="og:description" content={`Search a complete database of recent and historic Yu-Gi-Oh! tournaments. Includes detailed coverage of decklists, metagame charts, and match replays.`}/>
           </Helmet>
           {/* Default Gaming Playlist */}
           <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            <div className="body">
                <div className="event-database-flexbox">
                <img style={{ height:'80px'}} src={'https://cdn.formatlibrary.com/images/emojis/event.png'} alt="trophy"/>
                <h1>Event Database</h1>
                <img style={{ height:'80px'}} src={'https://cdn.formatlibrary.com/images/emojis/event.png'} alt="trophy"/>
                </div>
                
                <br />

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
                            <option value="name">Event Name</option>
                            <option value="winner">Winning Player</option>
                            </select>
                
                            <select
                                id="community"
                                defaultValue="All Communities"
                                className="filter"
                                onChange={(e) => {setCommunityName(e.target.value || null); setPage(1)}}
                            >
                            {
                                communities.map((c) => <option key={c} value={c}>{c}</option>)
                            }
                            </select>
                
                            <select
                            id="format"
                            defaultValue=""
                            className="filter"
                            onChange={(e) => {setFormat(e.target.value || null); setPage(1)}}
                            >
                            <option key={'All Formats'} value={''}>All Formats</option>
                            {
                                formats.map((format) => <option key={format.id} value={format.name}>{format.name}</option>)
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
        
                <div id="resultsWrapper0" className="resultsWrapper0">
                <div className="results" style={{width: '360px'}}>
                    Results:{events.length? ` ${eventsPerPage * (page - 1) + 1} - ${total < (eventsPerPage * page) ? total: (eventsPerPage * page)} of ${total}` : ''}
                </div>
        
                <div className="buttonWrapper">
                    {/* <select
                    id="viewSwitch"
                    defaultValue="table"
                    style={{width: '130px'}}
                    onChange={() => setView(document.getElementById('viewSwitch').value)}
                    >
                    <option value="table">View Table</option>
                    <option value="gallery">View Gallery</option>
                    </select> */}
        
                    <select
                    id="eventsPerPageSelector"
                    defaultValue="10"
                    style={{width: '160px', maxWidth: '45vw'}}
                    onChange={(e) => { setEventsPerPage(e.target.value); setPage(1) }}
                    >
                    <option value={10}>10 Events / Page</option>
                    <option value={25}>25 Events / Page</option>
                    <option value={50}>50 Events / Page</option>
                    <option value={100}>100 Events / Page</option>
                    </select>
        
                    <select
                    id="sortSelector"
                    defaultValue="startedAt:desc"
                    style={{width: '230px'}}
                    onChange={() => sortEvents()}
                    >
                    <option value="startedAt:desc">Sort Date: New ⮕ Old</option>
                    <option value="startedAt:asc">Sort Date: Old ⮕ New</option>
                    <option value="name:asc">Sort Event: A ⮕ Z</option>
                    <option value="name:desc">Sort Event: Z ⮕ A</option>
                    <option value="size:desc">Sort Size: Large ⮕ Small </option>
                    <option value="size:asc">Sort Size: Small ⮕ Large </option>
                    </select>
        
                    <div
                    className="searchButton desktop-only"
                    type="submit"
                    onClick={() => reset()}
                    >
                    Reset
                    </div>
                </div>
                </div>

                <div className="results-component">
                    <div className="paginationWrapper">
                        <div className="pagination">
                            <Pagination
                            setPage={setPage}
                            itemCount={total}
                            page={page}
                            itemsPerPage={eventsPerPage}
                            />
                        </div>
                    </div>
            
                    {view === 'table' ? (
                        <div id="event-table">
                            <table id="events">
                                <thead>
                                    <tr>
                                    <th>Format</th>
                                    <th>Event Name</th>
                                    <th>Winning Player</th>
                                    <th>Community</th>
                                    <th>Size</th>
                                    <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((event, index) => <EventRow key={event.id} index={index} event={event} />)}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                    <div id="eventGalleryFlexBox">
                </div>
                )}
        
                    <div className="pagination">
                        <Pagination
                            setPage={setPage}
                            itemCount={total}
                            page={page}
                            itemsPerPage={eventsPerPage}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}
