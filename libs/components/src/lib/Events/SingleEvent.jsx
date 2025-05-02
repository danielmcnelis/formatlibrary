
import { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { capitalize, dateToSimple, dateToVerbose } from '@fl/utils'
// import { s3FileExists } from '@fl/bot-functions'
import { ReplayThumbnail } from './ReplayThumbnail'
import { DeckImage } from '../Decks/DeckImage'
import { NotFound } from '../General/NotFound'
import './SingleEvent.css'
import { Chart as ChartJS, ArcElement, CategoryScale, BarElement, Title, LinearScale, Tooltip, Legend } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Helmet } from 'react-helmet'
import { getCookie } from '@fl/utils'
const playerId = getCookie('playerId')
const discordPfp = getCookie('discordPfp')
const discordId = getCookie('discordId')

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export const SingleEvent = (props) => {
    const isAdmin = props.roles?.admin
    const isSubscriber = props.roles?.subscriber

    const [event, setEvent] = useState({})
    const [winner, setWinner] = useState({})
    const [replays, setReplays] = useState({})
    const [topDecks, setTopDecks] = useState({})
    const [metagame, setMetagame] = useState({
        deckTypes: [],
        topDeckConversions: [],
        topMainDeckCards: [],
        topSideDeckCards: []
    })
    const [bracketExists, setBracketExists] = useState(false)

    // const [existingPfps, setExistingPfps] = useState({ 
    //     playerId: false, 
    //     discordPfp: false, 
    //     discordId: false, 
    //     playerName: false
    // })

    const { id } = props.match.params
    const navigate = useNavigate()
    const [labelColor, gridColor] = JSON.parse(localStorage.getItem('theme')) === 'dark' ? ['#ccc', '#313131'] : ['#666', '#e1e1e1']
    //   const videoPlaylistId = event?.format?.videoPlaylistId

    let extension =  (winner?.name || '').replaceAll('%', '%25')
        .replaceAll('/', '%2F')
        .replaceAll(' ', '_')
        .replaceAll('#', '%23')
        .replaceAll('?', '%3F')
        .replaceAll('&', '%26')
        .replaceAll('★', '_')

    const goToFormat = () => navigate(`/formats/${event.formatName || null}`)
    const goToPlayer = () => navigate(`/players/${extension}`)
    
    const communityLink = event.server?.inviteLink ? event.server?.inviteLink :
        event.communityName === 'Konami' ? 'https://www.yugioh-card.com/en/events/' :
        event.communityName === 'Upper Deck Entertainment' ? 'https://upperdeck.com/entertainment/' :
        'https://formatlibrary.com/cards/lost-world'

    const goToCommunity = () => window.open(communityLink, "_blank")

    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0), [])

    // USE EFFECT SET EVENT DATA
    useEffect(() => {
        const fetchEventData = async () => {
            // If user is subscriber or admin: Hit a different endpoint that requires authentication
            if (isAdmin || isSubscriber) {
                try {
                    const accessToken = getCookie('access')
                    const {data} = await axios.get(`/api/events/subscriber/${id}`, {
                        headers: {
                            ...(accessToken && {authorization: `Bearer ${accessToken}`})
                        }
                    })

                    setEventData(data)
                } catch (err) {
                    console.log(err)
                    setEvent(null)
                }
            } else {
                try {
                    const {data} = await axios.get(`/api/events/${id}`)
                    setEventData(data)
                } catch (err) {
                    console.log(err)
                    setEvent(null)
                }
            }
        }

        const setEventData = (data) => {
            setEvent(data.event)
            setWinner(data.event.winner || data.event.team)
            setReplays(data.replays)
            setTopDecks(data.topDecks)
            setMetagame(data.metagame)
        }

        fetchEventData()
    }, [isAdmin, isSubscriber])

    // USE EFFECT SET EVENT DATA
    useEffect(() => {
        const checkForBracket = async () => {
            try {
                await axios.get(`api/images/brackets/${event.abbreviation}`)
                setBracketExists(true)
            } catch (err) {
                setBracketExists(false)
            }
        }

        checkForBracket()
    }, [event])

    if (event === null) return <NotFound/>
    if (!event.name) return <div></div>
    if (!event.format) return <div></div>

    const formatArtwork = `https://cdn.formatlibrary.com/images/artworks/${event.format.icon}.jpg` || ''

    const deckTypeData = metagame.deckTypes?.length ? {
        labels: metagame.deckTypes.map((e) => e[0]),
        datasets: [
        {
            data: metagame.deckTypes.map((e) => e[1]),
            backgroundColor: metagame.deckTypes.map((e) => e[2]),
            borderWidth: 1,
        },
        ]
    } : {}

    const conversionRateData = metagame.topDeckConversions?.length ? {
        labels: metagame.topDeckConversions.map((e) => e[0]),
        datasets: [
        {
            data: metagame.topDeckConversions.map((e) => e[1]),
            backgroundColor: metagame.topDeckConversions.map((e) => e[2]),
            borderWidth: 1,
        },
        ]
    } : {}

    const topMainDeckCardsData = metagame.topMainDeckCards?.length ? {
        labels: metagame.topMainDeckCards.map((e) => e[0].length <= 30 ? e[0] : e[0].slice(0, 30).split(' ').slice(0, -1).join(' ')),
        datasets: [
        {
            label: 'Main Deck Count',
            data: metagame.topMainDeckCards.map((e) => e[1]),
            backgroundColor: '#1f4ed1'
        }
        ]
    } : {}
    
    const topSideDeckCardsData = metagame.topSideDeckCards?.length ? {
        labels: metagame.topSideDeckCards.map((e) => e[0].length <= 30 ? e[0] : e[0].slice(0, 30).split(' ').slice(0, -1).join(' ')),
        datasets: [
        {
            label: 'Side Deck Count',
            data: metagame.topSideDeckCards.map((e) => e[1]),
            backgroundColor: '#c24225'
        }
        ]
    } : {}

    const doughnutOptions = {
        responsive: false,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                align: 'start',
                labels: {    
                    color: labelColor
                }
            },
        }
    }

    const barOptions = {
        responsive: false,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                align: 'start',
                labels: {    
                    color: labelColor
                }
            },
        },
        scales: {
            y: {
                grid: {
                    color: gridColor
                },
                ticks: {
                    color: labelColor
                }
            },
            x: {
                grid: {
                    color: gridColor
                },
                ticks: {
                    color: labelColor
                }
            }
        }
    }

  return (
    <>
        <Helmet>
            <title>{`${event?.name} Yu-Gi-Oh! Tournament Coverage - Format Library`}</title>
            <meta name="og:title" content={`${event?.name} Yu-Gi-Oh! Tournament Coverage - Format Library`}/>
            <meta name="description" content={`Coverage of ${event?.name} - ${event?.formatName} Format hosted by ${event?.communityName}. Includes decklists, metagame stats, and match replays.`}/>
            <meta name="og:description" content={`Coverage of ${event?.name} - ${event?.formatName} Format hosted by ${event?.communityName}. Includes decklists, metagame stats, and match replays.`}/>
        </Helmet>
        {
            // videoPlaylistId ? <div className="adthrive-content-specific-playlist" data-playlist-id={videoPlaylistId}></div> :
            <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
        }
        <div className="body">
            <div className="event-title-flexbox">
                <div className="event-info-container">
                <div className="single-event-title">{event.name}</div>
                    <table className="single-event-table">
                    <tbody>
                    <tr className="single-event-info-1">
                        <td>
                        <div className="single-event-cell">
                            {
                                event.isTeamEvent ? (
                                    <div className="single-event-cell">
                                        <b>Winner: </b>{event.winnerName}
                                    </div>
                                ) : (
                                    <div onClick={() => goToPlayer()} className="single-event-winner-link">
                                        <b>Winner: </b>{event.winnerName}
                                        <img 
                                            className="single-event-winner-cell-pfp"
                                            src={`/api/players/${winner?.id}/avatar`}
                                            alt={event.winner?.name}
                                        />
                                    </div>
                                )
                            }
                            <img 
                                style={{width:'32px'}} 
                                src={`https://cdn.formatlibrary.com/images/emojis/1st.png`}
                                alt="1st"
                            />
                        </div>
                        </td>
                        <td className="desktop-only">
                        <div className="single-event-cell">
                            <div onClick={() => goToCommunity()} className="single-event-community-link" style={{paddingRight:'7px'}}><b>Community:</b> {event.communityName}</div> 
                            <img 
                                style={{width:'32px'}} 
                                src={`https://cdn.formatlibrary.com/images/logos/${event.communityName?.replaceAll('+', '%2B')}.png`}
                                alt={event.communityName}
                            />
                        </div>
                        </td>
                        <td>
                        <div className="single-event-cell">
                            {
                                event.isTeamEvent ? (
                                    <div style={{paddingRight:'7px'}}><b>Teams:</b> {event.size} 👤</div> 
                                ) : (
                                    <div style={{paddingRight:'7px'}}><b>Players:</b> {event.size} 👤</div> 
                                )
                            }
                        </div>
                        </td>
                    </tr>
                    <tr className="single-event-info-2">
                        <td>
                        <div className="single-event-cell">
                            <div onClick={() => goToFormat()} className="single-event-format-link" style={{paddingRight:'7px'}}><b>Format:</b> {capitalize(event.formatName, true)}</div>
                            <img 
                                style={{width:'32px'}}
                                src={`https://cdn.formatlibrary.com/images/emojis/${event.format.icon}.png`}
                                alt={event.format.name}
                            />
                        </div>     
                        </td>
                        <td className="desktop-only">
                        <div className="single-event-cell">
                            <div 
                                onClick={() => {window.location.href=`/deckTypes/${topDecks[0]?.deckTypeName?.toLowerCase()?.replace(/\s/g, '-')}?format=${event.format.name}`}}                                 
                            >
                                <div className="winning-deck-link" style={{paddingRight:'7px'}}><b>Winning Deck:</b> {capitalize(topDecks[0] ? topDecks[0].deckTypeName : '', true)}</div> 
                            </div>
                        </div>   
                        </td>
                        <td>
                        <div className="single-event-cell">
                            <div className="desktop-only"><b>Date:</b> {dateToVerbose(event.startedAt, false, false)}</div>
                            <div id="single-event-uploaded-mobile" className="mobile-only"><b>Date:</b> {dateToSimple(event.startedAt)}</div>
                        </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
                <br/>
                {
                    bracketExists ? (
                    <li>
                        <a href="#bracket">Bracket</a>
                    </li>
                    ) : ''
                }
                {
                    topDecks?.length ? (
                    <li>
                        <a href="#top-decks">Top Decks</a>
                    </li>
                    ) : ''
                }
                {
                    metagame.deckTypes?.length ? (
                    <li>
                    <a href="#metagame-stats">Metagame Stats</a>
                    </li>
                    ) : ''
                }
                {
                    replays?.length ? (
                    <li>
                        <a href="#replays">Replays</a>
                    </li>
                    ) : ''
                }
                </div>
                <img className="desktop-only" id="format-icon-large" src={formatArtwork} alt={event.format?.name} />
            </div>

            <div className="divider"/>

            {
                bracketExists ? (
                    <>
                        <div id="bracket">
                            <div className="subcategory-title-flexbox">
                                <img 
                                    style={{ width:'64px'}} 
                                    src={`https://cdn.formatlibrary.com/images/emojis/${event.format?.icon}.png`}
                                    alt={event.format.name}
                                />
                                <h2 className="subheading"><b>{event.abbreviation}</b> Bracket:</h2>
                                <img
                                    style={{ width:'64px'}} 
                                    src={'https://cdn.formatlibrary.com/images/logos/Challonge.png'}
                                    alt="challonge"
                                />
                            </div>
                            <img 
                                style={{width:'800px'}}
                                className="bracket" 
                                src={`https://cdn.formatlibrary.com/images/brackets/${event.abbreviation}.png`}
                                onError={(e) => {
                                    e.target.onerror = null
                                    e.target.style.width = "300px"
                                    e.target.src="https://cdn.formatlibrary.com/images/artworks/dig.jpg"
                                }}
                                alt="bracket"
                            />
                            <a 
                                className="bracket-link"
                                href={event.referenceUrl} 
                                target="_blank"
                                rel="noreferrer"
                            >
                            Click Here for Reference
                            </a>
                        </div>
                        <div className="divider"/>
                    </>
                ) : (
                    <>
                        <div id="bracket">
                            <a 
                                className="bracket-link"
                                href={event.referenceUrl} 
                                target="_blank"
                                rel="noreferrer"
                            >
                            Click Here for Reference
                            </a>
                        </div>
                        <div className="divider"/>
                    </>
                )
            }

            {
                topDecks?.length ? (
                <div id="top-decks">
                    <div className="subcategory-title-flexbox">
                    <img 
                        style={{ width:'64px'}} 
                        src={`https://cdn.formatlibrary.com/images/emojis/${event.format.icon}.png`}
                        alt={event.format.name}
                    />
                    <h2 className="subheading"><b>{event.abbreviation}</b> {topDecks?.length === 1 ? 'Winning Deck' : (isSubscriber || isAdmin) ? `Decks` : `Top ${topDecks?.length} Decks`}:</h2>
                    <img 
                        style={{ height:'64px'}} 
                        src={'https://cdn.formatlibrary.com/images/emojis/deckbox.png'}
                        alt="deckbox"
                    />
                    </div>
                    <div id="deckGalleryFlexBox">
                    {
                    topDecks.map((deck, index) => {
                        return <
                                DeckImage 
                                key={deck.id} 
                                index={index} 
                                deck={deck}
                                width="360px"
                                margin="10px 1px"
                                padding="1px"
                                coverage={true}
                                />
                    })
                    }
                    </div>
                </div>
                ) : ''
            }
            <div className="divider"/>  
            {
                metagame.deckTypes?.length ? (
                <div id="metagame-stats">
                    <div className="subcategory-title-flexbox">
                    <img 
                        style={{ width:'64px'}} 
                        src={`https://cdn.formatlibrary.com/images/emojis/${event.format.icon}.png`}
                        alt={event.format.name}
                    />
                    <h2 className="subheading"><b>{event.abbreviation}</b> Metagame Stats:</h2>
                    <img 
                        style={{ height:'64px'}} 
                        src={'https://cdn.formatlibrary.com/images/emojis/microscope.png'}
                        alt="microscope"
                    />
                    </div>

                    <div className="chart-flexbox">
                    <div className="doughnut-container">
                        <h2>Deck Representation</h2>
                        <br/>
                        <Doughnut 
                            className="doughnut"
                            height="500px"
                            width="500px"
                            data={deckTypeData}
                            options={doughnutOptions}
                        />
                    </div>
                    <div className="doughnut-container">
                        <h2>Top Deck Representation</h2>
                        <br/>
                        <Doughnut 
                            className="doughnut"
                            height={parseInt(500 - (20 * Math.ceil(metagame.deckTypes?.length / 4)))}
                            width="500px"
                            data={conversionRateData}
                            options={doughnutOptions}
                        />
                    </div>
                    </div>

                    <div className="chart-flexbox">
                    <div className="bargraph-container">
                        <h2>Top Main Deck Cards</h2>
                        <br/>
                        <Bar 
                        className="bargraph"
                        height="400px"
                        width="500px"
                        data={topMainDeckCardsData}
                        options={barOptions}
                        />
                    </div>
                    {
                        metagame.topSideDeckCards?.length ? (
                            <div className="bargraph-container">
                                <h2>Top Side Deck Cards</h2>
                                <br/>
                                <Bar 
                                    className="bargraph"
                                    height="400px"
                                    width="500px"
                                    data={topSideDeckCardsData}
                                    options={barOptions}
                                />
                            </div>
                        ) : ''
                    }
                    </div>
                </div>
                ) : ''
            }
            <div className="divider"/>
            {
                replays?.length ? (
                <div id="replays">
                    <div className="subcategory-title-flexbox">
                    <img 
                        style={{ width:'64px'}} 
                        src={`https://cdn.formatlibrary.com/images/emojis/film.png`}
                        alt="film"
                    />
                    <h2 className="subheading"><b>{event.abbreviation}</b> Replays:</h2>
                    <img 
                        style={{ height:'64px'}} 
                        src={'https://cdn.formatlibrary.com/images/emojis/film.png'}
                        alt="film"
                    />
                    </div>
                    <div className="replays-flexbox">
                    {
                    replays.map((replay, index) => {
                        return <
                                ReplayThumbnail
                                key={replay.id}
                                index={index} 
                                roundName={replay.roundName}
                                url={replay.url}
                                winner={replay.winner}
                                loser={replay.loser}
                                width="360px"
                                margin="10px 5px"
                                padding="5px"
                                coverage={true}
                            />
                    })
                    }
                    </div>
                </div>
                ) : ''
            }
        </div>
    </>
  )
}
