
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import axios from 'axios'
import { ReplayRow } from './ReplayRow.jsx'
import { MobileReplayRow } from './MobileReplayRow.jsx'
import { Pagination } from '../General/Pagination.jsx'
import { useMediaQuery } from 'react-responsive'
import { getCookie } from '@fl/utils'
import { Helmet } from 'react-helmet'
import './ReplayTable.css' 

export const ReplayTable = (props) => {
    const isAdmin = props.roles?.admin
    const isSubscriber = props.roles?.subscriber

    const isMounted = useRef(false)
    const [community, setCommunity] = useState(null)
    const [replays, setReplays] = useState([])
    const [replaysPerPage, setReplaysPerPage] = useState(10)
    const [format, setFormat] = useState(null)
    const [formats, setFormats] = useState([])
    const [page, setPage] = useState(1)
    const [sortBy, setSortBy] = useState('publishDate:desc,display:desc,roundAbs:desc')
    const [total, setTotal] = useState(0)
    const [queryParams, setQueryParams] = useState({
      player: null,
      event: null,
      deckType: null
    })
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => {
        if (!isMounted.current) return
        window.scrollTo(0, document.getElementById('sortSelector')?.offsetTop - 10)
    }, [page])

    // SORT REPLAYS
    const sortReplays = () => {
      setSortBy(document.getElementById('sortSelector').value)
      setPage(1)
    }
  
    // COUNT
    const count = async () => {
        const accessToken = getCookie('access')
        let url = `/api/replays/count?isAdmin=${isAdmin}&isSubscriber=${isSubscriber}`
        let filter = ''
  
        if (queryParams.player) filter += `,player:or:${queryParams.player}`
        if (queryParams.event) filter += `,eventAbbreviation:inc:${queryParams.event}`
        if (queryParams.deckType) filter += `,deckType:or:${queryParams.deckType}`
        if (community) filter += `,$event.community$:eq:${community}`
        if (format) filter += `,formatName:eq:${format}`
        if (filter.length) url += ('?filter=' + filter.slice(1))
  
        const { data } = await axios.get(url, {
            headers: {
                ...(accessToken && {authorization: `Bearer ${accessToken}`})
            }
        })
        
        setTotal(data)
    }

    // SEARCH
    const search = async () => {
        let url = `/api/replays?page=${page}&limit=${replaysPerPage}&isAdmin=${isAdmin}&isSubscriber=${isSubscriber}&sort=${sortBy}`
        let filter = ''
  
        if (queryParams.player) filter += `,player:or:${queryParams.player}`
        if (queryParams.event) filter += `,eventAbbreviation:inc:${queryParams.event}`
        if (queryParams.deckType) filter += `,deckType:or:${queryParams.deckType}`
        if (community) filter += `,$event.community$:eq:${community}`
        if (format) filter += `,formatName:eq:${format}`
        if (filter.length) url += ('&filter=' + filter.slice(1))
            
        const accessToken = getCookie('access')
        const { data } = await axios.get(url, {
            headers: {
                ...(accessToken && {authorization: `Bearer ${accessToken}`})
            }
        })
        
        setReplays(data)
    }
  
    // RESET
    const reset = () => {
        document.getElementById('community').value = ''
        document.getElementById('format').value = ''
        document.getElementById('searchTypeSelector').value = 'player'
        document.getElementById('searchBar').value = null
      setPage(1)
      setFormat(null)
      setReplays(replays)
      setSortBy('publishDate:desc,display:desc,roundAbs:desc')
      setQueryParams({
        player: null,
        event: null,
        deckType: null
      })

      count()
      search()
    }
  
    // RUN QUERY
    const runQuery = () => {
      const id = document.getElementById('searchTypeSelector').value
      const otherIds = id === 'player' ? ['event', 'deckType'] : 
            id === 'event' ? ['player', 'deckType'] : ['player', 'event'] 

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
            try {
                const accessToken = getCookie('access')
                const url = `/api/replays?page=1&limit=10&sortBy=publishDate:desc,display:desc,roundAbs:desc`
                const { data: replayData } = await axios.get(url, {
                    headers: {
                        ...(accessToken && {authorization: `Bearer ${accessToken}`})
                    }
                })
                
                setReplays(replayData)
            } catch (err) {
                console.log(err)
            }

            try {
                const {data: formatData} = await axios.get(`/api/formats/`)
                setFormats(formatData)  
            } catch (err) {
                console.log(err)
            }

            isMounted.current = true
        }

        count()
        fetchData()
    }, [])
  

    // USE EFFECT COUNT
    useEffect(() => {
        count()
      }, [isAdmin, isSubscriber, format, community, queryParams])


    // USE EFFECT SEARCH
    useEffect(() => {
        search()
    }, [isAdmin, isSubscriber, page, replaysPerPage, format, community, queryParams, sortBy])
  

    // RENDER
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
    
    if (isTabletOrMobile) {
        return (
            <>
                <Helmet>
                    <title>{`Yu-Gi-Oh! Match Replay Database - Format Library`}</title>
                    <meta name="og:title" content={`Yu-Gi-Oh! Match Replay Database - Format Library`}/>
                    <meta name="description" content={`Search an interactive database of recorded Yu-Gi-Oh! matches in the form of DuelingBook replays.`}/>
                    <meta name="og:description" content={`Search an interactive database of recorded Yu-Gi-Oh! matches in the form of DuelingBook replays.`}/>
                </Helmet>
                {/* Default Gaming Playlist */}
                <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
                <div className="body">
                    <div className="replay-database-flexbox">
                    <h1>Replay Database</h1>
                    <img style={{ height:'80px'}} src={'https://cdn.formatlibrary.com/images/emojis/film.png'} alt="trophy"/>
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
                            defaultValue="player"
                            className="filter desktop-only"
                            onChange={() => runQuery()}
                        >
                        <option value="player">Player</option>
                        <option value="event">Event</option>
                        <option value="deckType">Deck Type</option>
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
                        Results:{replays.length? ` ${replaysPerPage * (page - 1) + 1} - ${total < (replaysPerPage * page) ? total : (replaysPerPage * page)} of ${total}` : ''}
                    </div>
            
                    <div className="buttonWrapper">
                        <select
                        id="replaysPerPageSelector"
                        defaultValue="10"
                        style={{width: '195px'}}
                        onChange={(e) => {setReplaysPerPage(e.target.value); setPage(1)}}
                        >
                            <option value={10}>10 / Page</option>
                            <option value={25}>25 / Page</option>
                            <option value={50}>50 / Page</option>
                            <option value={100}>100 / Page</option>
                        </select>
            
                        <select
                            id="sortSelector"
                            defaultValue="publishDate:desc,display:desc,roundAbs:desc"
                            style={{width: '230px'}}
                            onChange={(e) => {setSortBy(e.target.value); setPage(1)}}
                        >
                            <option value="publishDate:desc,display:desc,roundAbs:desc">Date: New ⮕ Old</option>
                            <option value="publishDate:asc,display:desc,roundAbs:desc">Date: Old ⮕ New</option>
                            <option value="winnerName:asc,display:desc,roundAbs:desc">Winner: A ⮕ Z</option>
                            <option value="winnerName:desc,display:desc,roundAbs:desc">Winner: Z ⮕ A</option>
                            <option value="winningDeckTypeName:asc,display:desc,roundAbs:desc">Winning Deck: A ⮕ Z</option>
                            <option value="winningDeckTypeName:desc,display:desc,roundAbs:desc">Winning Deck: Z ⮕ A</option>
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
                        <div id="replay-table">
                        <table id="replays">
                            <thead>
                            <tr>
                                <th>Format</th>
                                <th>Event</th>
                                <th>Round</th>
                                <th>Players</th>
                            </tr>
                            </thead>
                            <tbody>
                            {replays.map((replay, index) =>  <MobileReplayRow key={replay.id} index={index} replay={replay} />)}
                            </tbody>
                        </table>
                        </div>
                
                        <div className="pagination">
                        <Pagination
                            setPage={setPage}
                            itemCount={total}
                            page={page}
                            itemsPerPage={replaysPerPage}
                        />
                        </div>
                    </div>
                </div>
            </>
        )
    } else { 
        return (
            <>
                <Helmet>
                    <title>{`Yu-Gi-Oh! Match Replay Database - Format Library`}</title>
                    <meta name="og:title" content={`Yu-Gi-Oh! Match Replay Database - Format Library`}/>
                    <meta name="description" content={`Search through an interactive database of recorded Yu-Gi-Oh! matches in the form of DuelingBook replays.`}/>
                    <meta name="og:description" content={`Search through an interactive database of recorded Yu-Gi-Oh! matches in the form of DuelingBook replays.`}/>
                </Helmet>
                {/* Default Gaming Playlist */}
                <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
                <div className="body">
                    <div className="replay-database-flexbox">
                    <img style={{ height:'80px'}} src={'https://cdn.formatlibrary.com/images/emojis/film.png'} alt="film"/>
                    <h1>Replay Database</h1>
                    <img style={{ height:'80px'}} src={'https://cdn.formatlibrary.com/images/emojis/film.png'} alt="film"/>
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
                        defaultValue="player"
                        className="filter"
                        onChange={() => runQuery()}
                        >
                            <option value="player">Player</option>
                            <option value="event">Event</option>
                            <option value="deckType">Deck Type</option>
                        </select>
            
                        <select
                        id="community"
                        defaultValue="All Communities"
                        className="filter"
                        onChange={(e) => {setCommunity(e.target.value || null); setPage(1)}}
                        >
                        <option value="">All Communities</option>
                            <option value="Format Library">Format Library</option>
                            <option value="Androidland">Androidland</option>
                            <option value="Aureum's Army">Aureum's Army</option>
                            <option value="beastmode">Beastmode</option>
                            <option value="Big Boy Gaming">Big Boy Gaming</option>
                            <option value="Card Brawlers">Card Brawlers</option>
                            <option value="DuelistGroundz">DuelistGroundz</option>
                            <option value="EdisonFormat.com">EdisonFormat.com</option>
                            <option value="Fire-Water Format">Fire-Water Format</option>
                            <option value="GoatFormat.com">GoatFormat.com</option>
                            <option value="Goat Community Italia">Goat Community Italia</option>
                            <option value="Goat Format Europe">Goat Format Europe</option>
                            <option value="Goat Format War League">Goat Format War League</option>
                            <option value="HATformat.com">HATFormat.com</option>
                            <option value="Ishizu Tear Format">Ishizu Tear Format</option>
                            <option value="Konami">Konami</option>
                            <option value="Reaper Format">Reaper Format</option>
                            <option value="Shuffle Deck Gaming">Shuffle Deck Gaming</option>
                            <option value="Tengu Plant Town">Tengu Plant Town</option>
                            <option value="The Dice Jar">The Dice Jar</option>
                            <option value="The H.A.T. Alliance">The H.A.T. Alliance</option>
                            <option value="Upper Deck Entertainment">Upper Deck Entertainment</option>
                            <option value="Vegas Format">Vegas Format</option>
                            <option value="Wind-Up Factory">Wind-Up Factory</option>
                            <option value="YGOFrom0">YGOFrom0</option>
                            <option value="Yugi-Kaibaland">Yugi-Kaibaland</option>
                            <option value="Yu-Gi-Oh! Legacy">Yu-Gi-Oh! Legacy</option>
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
            
                    <div id="resultsWrapper0" className="resultsWrapper0">
                    <div className="results" style={{width: '360px'}}>
                        Results:{replays.length? ` ${replaysPerPage * (page - 1) + 1} - ${total < (replaysPerPage * page) ? total: (replaysPerPage * page)} of ${total}` : ''}
                    </div>
            
                    <div className="buttonWrapper">
                        <select
                        id="replaysPerPageSelector"
                        defaultValue="10"
                        style={{width: '160px', maxWidth: '45vw'}}
                        onChange={(e) => { setReplaysPerPage(e.target.value); setPage(1) }}
                        >
                        <option value={10}>10 Replays / Page</option>
                        <option value={25}>25 Replays / Page</option>
                        <option value={50}>50 Replays / Page</option>
                        <option value={100}>100 Replays / Page</option>
                        </select>
            
                        <select
                        id="sortSelector"
                            defaultValue="publishDate:desc,display:desc,roundAbs:desc"
                            style={{width: '230px'}}
                            onChange={() => sortReplays()}
                        >
                        <option value="publishDate:desc,display:desc,roundAbs:desc">Date: New ⮕ Old</option>
                        <option value="publishDate:asc,display:desc,roundAbs:desc">Date: Old ⮕ New</option>
                        <option value="winnerName:asc,display:desc,roundAbs:desc">Winner: A ⮕ Z</option>
                        <option value="winnerName:desc,display:desc,roundAbs:desc">Winner: Z ⮕ A</option>
                        <option value="winningDeckTypeName:asc,display:desc,roundAbs:desc">Winning Deck: A ⮕ Z</option>
                        <option value="winningDeckTypeName:desc,display:desc,roundAbs:desc">Winning Deck: Z ⮕ A</option>
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
            
                    <div className="paginationWrapper">
                    <div className="pagination">
                        <Pagination
                        setPage={setPage}
                        itemCount={total}
                        page={page}
                        itemsPerPage={replaysPerPage}
                        />
                    </div>
                    </div>

                    <div className="results-component">
                    <div id="replay-table">
                        <table id="replays">
                            <thead>
                            <tr>
                                <th>Format</th>
                                <th>Event</th>
                                <th>Round</th>
                                <th>Winning Player</th>
                                <th>Winning Deck</th>
                                <th>Losing Player</th>
                                <th>Losing Deck</th>
                                <th>Date</th>
                            </tr>
                            </thead>
                            <tbody>
                            {replays.map((replay, index) => <ReplayRow key={replay.id} index={index} replay={replay} />)}
                            </tbody>
                        </table>
                    </div>

            
                    <div className="pagination">
                    <Pagination
                        setPage={setPage}
                        itemCount={total}
                        page={page}
                        itemsPerPage={replaysPerPage}
                    />
                    </div>
                </div>
                </div>
            </div>
            </>
        )
    }
}
