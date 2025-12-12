
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import axios from 'axios'
import { PlayerRow } from './PlayerRow.jsx'
import { MobilePlayerRow } from './MobilePlayerRow.jsx'
import { Pagination } from '../General/Pagination.jsx'
import { useMediaQuery } from 'react-responsive'
import { Helmet } from 'react-helmet'
import './PlayerTable.css' 

export const PlayerTable = (props) => {
    const isMounted = useRef(false)
    const [players, setPlayers] = useState([])
    const [playersPerPage, setPlayersPerPage] = useState(10)
    const [page, setPage] = useState(1)
    const [sortBy, setSortBy] = useState('tops:desc,name:asc')
    const [total, setTotal] = useState(0)
    const [queryParams, setQueryParams] = useState({
      name: '',
      deck: null
    })
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => {
        if (!isMounted.current) return
        window.scrollTo(0, document.getElementById('sortSelector')?.offsetTop - 10)
    }, [page])

    // // SORT PLAYERS
    // const sortPlayers = () => {
    //   setSortBy(document.getElementById('sortSelector').value)
    //   setPage(1)
    // }
  
    // COUNT
    const count = async () => {
        let url = `/api/players/count?name=${queryParams.name}`
        const { data } = await axios.get(url)           
        setTotal(data)
    }

    // SEARCH
    const search = async () => {
        const fetchPlayerData = async () => {
            try {
                let url = `/api/players?page=${page}&limit=${playersPerPage}&sort=${sortBy}&name=${queryParams.name}&deck=${queryParams.deck}`
                const { data } = await axios.get(url)
                setPlayers(data)
            } catch (err) {
                console.log(err)
            } 
        }

        fetchPlayerData()
    }
  
    // RESET
    const reset = () => {
        document.getElementById('searchTypeSelector').value = 'player'
        document.getElementById('searchBar').value = null
      setPage(1)
      setPlayers(players)
      setSortBy('tops:desc,name:asc')
      setQueryParams({
        player: null,
        deck: null
      })

      count()
      search()
    }
  
    // RUN QUERY
    const runQuery = () => {
      const id = document.getElementById('searchTypeSelector').value
      const otherIds = id === 'player' ? ['event', 'deck'] : 
            id === 'event' ? ['player', 'deck'] : ['player', 'event'] 

      setQueryParams(() => {
        return {
          ...queryParams,
          [id]: document.getElementById('searchBar').value,
          [otherIds[0]]: null
        }
      })

      setPage(1)
    }
  

    // USE EFFECT COUNT
    useEffect(() => {
        count()
      }, [queryParams])


    // USE EFFECT SEARCH
    useEffect(() => {
        search()
    }, [page, playersPerPage, queryParams, sortBy])
  

    // RENDER
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
    
    if (isTabletOrMobile) {
        return (
            <>
                <Helmet>
                    <title>{`Yu-Gi-Oh! Player Database - Format Library`}</title>
                    <meta name="og:title" content={`Yu-Gi-Oh! Player Database - Format Library`}/>
                    <meta name="description" content={`Search through an interactive database of Yu-Gi-Oh! players.`}/>
                    <meta name="og:description" content={`Search through an interactive database of Yu-Gi-Oh! players.`}/>
                </Helmet>
                {/* Default Gaming Playlist */}
                <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
                <div className="body">
                    <div className="Player-database-flexbox">
                        <h1>Player Database</h1>
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
                        <option value="name">Name</option>
                        {/* <option value="deck">Deck Type</option> */}
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
                        Results:{players.length? ` ${playersPerPage * (page - 1) + 1} - ${total < (playersPerPage * page) ? total : (playersPerPage * page)} of ${total}` : ''}
                    </div>
            
                    <div className="buttonWrapper">
                        <select
                        id="playersPerPageSelector"
                        defaultValue="10"
                        style={{width: '195px'}}
                        onChange={(e) => {setPlayersPerPage(e.target.value); setPage(1)}}
                        >
                            <option value={10}>10 / Page</option>
                            <option value={25}>25 / Page</option>
                            <option value={50}>50 / Page</option>
                            <option value={100}>100 / Page</option>
                        </select>
            
                        <select
                            id="sortSelector"
                            defaultValue="tops:desc,name:asc"
                            style={{width: '230px'}}
                            onChange={(e) => {setSortBy(e.target.value); setPage(1)}}
                        >
                            <option value="tops:desc,name:asc">Tops: More ⮕ Less</option>
                            <option value="tops:asc,name:asc">Tops: Less ⮕ More</option>
                            <option value="name:asc">Player: A ⮕ Z</option>
                            <option value="name:desc">Player: Z ⮕ A</option>
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
                        <div id="Player-table">
                        <table id="players">
                            <thead>
                            <tr>
                                <th></th>
                                <th>Medals</th>
                                <th>Finishes</th>
                            </tr>
                            </thead>
                            <tbody>
                            {players.map((player, index) =>  <MobilePlayerRow key={player.id} index={index} player={player} stats={player.stats} decks={player.decks} deckTypes={player.deckTypes} />)}
                            </tbody>
                        </table>
                        </div>
                
                        <div className="pagination">
                        <Pagination
                            setPage={setPage}
                            itemCount={total}
                            page={page}
                            itemsPerPage={playersPerPage}
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
                    <title>{`Yu-Gi-Oh! Player Database - Format Library`}</title>
                    <meta name="og:title" content={`Yu-Gi-Oh! Player Database - Format Library`}/>
                    <meta name="description" content={`Search through an interactive database of Yu-Gi-Oh! players.`}/>
                    <meta name="og:description" content={`Search through an interactive database of Yu-Gi-Oh! players.`}/>
                </Helmet>
                {/* Default Gaming Playlist */}
                <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
                <div className="body">
                    <div className="player-database-flexbox">
                        <img style={{ height:'80px'}} src={'https://cdn.formatlibrary.com/images/emojis/nerd.png'} alt="nerd"/>
                        <h1>Player Database</h1>
                        <img style={{ height:'80px'}} src={'https://cdn.formatlibrary.com/images/emojis/nerd.png'} alt="nerd"/>
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
                            <option value="name">Name</option>
                            {/* <option value="deck">Deck Type</option> */}
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
                        Results:{players.length? ` ${playersPerPage * (page - 1) + 1} - ${total < (playersPerPage * page) ? total: (playersPerPage * page)} of ${total}` : ''}
                    </div>
            
                    <div className="buttonWrapper">
                        <select
                        id="playersPerPageSelector"
                        defaultValue="10"
                        style={{width: '160px', maxWidth: '45vw'}}
                        onChange={(e) => { setPlayersPerPage(e.target.value); setPage(1) }}
                        >
                        <option value={10}>10 Players / Page</option>
                        <option value={25}>25 Players / Page</option>
                        <option value={50}>50 Players / Page</option>
                        <option value={100}>100 Players / Page</option>
                        </select>
            
                        <select
                            id="sortSelector"
                            defaultValue="tops:desc,name:asc"
                            style={{width: '230px'}}
                            onChange={(e) => {setSortBy(e.target.value); setPage(1)}}
                        >
                            <option value="tops:desc,name:desc">Tops: More ⮕ Less</option>
                            <option value="tops:asc,name:asc">Tops: Less ⮕ More</option>
                            <option value="name:asc">Player: A ⮕ Z</option>
                            <option value="name:desc">Player: Z ⮕ A</option>
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
                        itemsPerPage={playersPerPage}
                        />
                    </div>
                    </div>

                    <div className="results-component">
                    <div id="Player-table">
                        <table id="players">
                            <thead>
                            <tr>
                                <th>Player</th>
                                <th>Best Medals</th>
                                <th>Recent Finishes</th>
                                <th>Favorite Deck Types</th>
                            </tr>
                            </thead>
                            <tbody>
                            {players.map((player, index) => <PlayerRow key={player.id} index={index} player={player} stats={player.stats} decks={player.decks} deckTypes={player.deckTypes}/>)}
                            </tbody>
                        </table>
                    </div>

            
                    <div className="pagination">
                    <Pagination
                        setPage={setPage}
                        itemCount={total}
                        page={page}
                        itemsPerPage={playersPerPage}
                    />
                    </div>
                </div>
                </div>
            </div>
            </>
        )
    }
}
