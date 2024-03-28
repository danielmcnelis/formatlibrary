
import { useState, useEffect, useLayoutEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { capitalize, dateToSimple, dateToVerbose, getCookie } from '@fl/utils'
import { ReplayThumbnail } from './ReplayThumbnail'
import { DeckImage } from '../Decks/DeckImage'
import { NotFound } from '../General/NotFound'
import './SingleEvent.css'
import { Chart as ChartJS, ArcElement, CategoryScale, BarElement, Title, LinearScale, Tooltip, Legend } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Helmet } from 'react-helmet'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)
const playerId = getCookie('playerId')

export const SingleEvent = () => {
  const [event, setEvent] = useState({})
  const [winner, setWinner] = useState({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSubscriber, setIsSubscriber] = useState(false)
  const [replays, setReplays] = useState({})
  const [topDecks, setTopDecks] = useState({})
  const [metagame, setMetagame] = useState({
    deckTypes: [],
    deckCategories: [],
    topMainDeckCards: [],
    topSideDeckCards: []
  })

  const { id } = useParams()
  const navigate = useNavigate()
  const [labelColor, gridColor] = JSON.parse(localStorage.getItem('theme')) === 'dark' ? ['#ccc', '#313131'] : ['#666', '#e1e1e1']

  let extension =  (winner?.discordName || winner?.name || '').replaceAll('%', '%25')
    .replaceAll('/', '%2F')
    .replaceAll(' ', '_')
    .replaceAll('#', '%23')
    .replaceAll('?', '%3F')
    .replaceAll('&', '%26')
    .replaceAll('★', '_')

  if (winner?.discordName && winner?.discriminator !== '0') extension += `#${winner.discriminator}`

  const goToFormat = () => navigate(`/formats/${event.format ? event.format.name : null}`)
  const goToPlayer = () => navigate(`/players/${extension}`)
  
  // USE LAYOUT EFFECT
  useLayoutEffect(() => window.scrollTo(0, 0), [])

    // USE EFFECT
    useEffect(() => {
        const checkRoles = async () => {
            try {
                const accessToken = getCookie('access')
                const { data: player } = await axios.get(`/api/players/roles`, {
                    headers: {
                        ...(accessToken && {authorization: `Bearer ${accessToken}`})
                    }
                })

                if (player.admin) setIsAdmin(true)
                if (player.subscriber) setIsSubscriber(true)
            } catch (err) {
                console.log(err)
            }
        }

        if (playerId) checkRoles()
    }, [])
    
  // USE EFFECT SET CARD
  useEffect(() => {
    const uploadEvent = async () => {
      try {
        const {data} = await axios.get(`/api/events/${id}?isAdmin=${isAdmin}&isSubscriber=${isSubscriber}`)
        setEvent(data.event)
        setWinner(data.event.player)
        setReplays(data.replays)
        setTopDecks(data.topDecks)
        setMetagame(data.metagame)
      } catch (err) {
        console.log(err)
        setEvent(null)
      }
    }

    uploadEvent()
  }, [id, isAdmin, isSubscriber])

    
  if (event === null) return <NotFound/>
  if (!event.name) return <div></div>
  if (!event.format) return <div></div>

  const formatArtwork = `https://cdn.formatlibrary.com/images/artworks/${event.format.icon}.jpg` || ''
  
  const colors = [
      '#3d72e3', '#ff3c2e', '#ffd000', '#47ad53', '#43578f', '#b25cd6',
      '#6d9399', '#f5881b', '#31ada5', '#ffcd19', '#cf8ac5', '#8a8dcf', 
      '#d65180', '#307a3a', '#735645', '#fc8c1c', '#8dc276', '#c4495f', 
  ]

  const deckTypeData = metagame.deckTypes.length ? {
    labels: metagame.deckTypes.map((e) => e[0]),
    datasets: [
      {
        data: metagame.deckTypes.map((e) => e[1]),
        backgroundColor: colors.slice(0, metagame.deckTypes.length),
        borderWidth: 1,
      },
    ]
  } : {}

  const deckCategoryData = metagame.deckCategories.length ? {
    labels: metagame.deckCategories.map((e) => e[0]),
    datasets: [
      {
        data: metagame.deckCategories.map((e) => e[1]),
        backgroundColor: colors.slice(0, metagame.deckCategories.length),
        borderWidth: 1,
      },
    ]
  } : {}

  const topMainDeckCardsData = metagame.topMainDeckCards.length ? {
    labels: metagame.topMainDeckCards.map((e) => e[0].length <= 30 ? e[0] : e[0].slice(0, 30).split(' ').slice(0, -1).join(' ')),
    datasets: [
      {
        label: 'Main Deck Count',
        data: metagame.topMainDeckCards.map((e) => e[1]),
        backgroundColor: '#1f4ed1'
      }
    ]
  } : {}
 
  const topSideDeckCardsData = metagame.topSideDeckCards.length ? {
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
            <meta name="description" content={`Coverage of ${event?.name} - ${event?.formatName} Format hosted by ${event?.community}. Includes decklists, metagame stats, and match replays.`}/>
            <meta name="og:description" content={`Coverage of ${event?.name} - ${event?.formatName} Format hosted by ${event?.community}. Includes decklists, metagame stats, and match replays.`}/>
        </Helmet>
        <div className="body">
            <div className="event-title-flexbox">
                <div className="event-info-container">
                <div className="single-event-title">{event.name}</div>
                    <table className="single-event-table">
                    <tbody>
                    <tr className="single-event-info-1">
                        <td>
                        <div className="single-event-cell">
                            <div onClick={() => goToPlayer()} className="single-event-winner-link">
                                <b>Winner: </b>{event.winner}
                                <img 
                                    className="single-event-winner-cell-pfp"
                                    src={
                                        event.player.discordPfp ? `https://cdn.discordapp.com/avatars/${event.player.discordId}/${event.player.discordPfp}.webp` :
                                        `https://cdn.formatlibrary.com/images/pfps/${event.player.name}.png`
                                    }
                                    onError={(e) => {
                                        e.target.onerror = null
                                        e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                                    }}
                                    alt={event.player.name}
                                />
                            </div>
                            <img 
                                style={{width:'32px'}} 
                                src={`https://cdn.formatlibrary.com/images/emojis/1st.png`}
                                alt="1st"
                            />
                        </div>
                        </td>
                        <td className="desktop-only">
                        <div className="single-event-cell">
                            <div style={{paddingRight:'7px'}}><b>Community:</b> {event.community}</div> 
                            <img 
                                style={{width:'32px'}} 
                                src={`https://cdn.formatlibrary.com/images/logos/${event.community?.replaceAll('+', '%2B')}.png`}
                                alt={event.community}
                            />
                        </div>   
                        </td>
                        <td>   
                        <div className="single-event-cell">
                            <div style={{paddingRight:'7px'}}><b>Players:</b> {event.size} 👤</div> 
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
                            <Link to={`/decktypes/${topDecks[0]?.type?.toLowerCase()?.replace(/\s/g, '-')}?format=${event.format.name}`}>
                                <div className="winning-deck-link" style={{paddingRight:'7px'}}><b>Winning Deck:</b> {capitalize(topDecks[0] ? topDecks[0].type : '', true)}</div> 
                            </Link>
                        </div>   
                        </td>
                        <td>
                        <div className="single-event-cell">
                            <div className="desktop-only"><b>Date:</b> {dateToVerbose(event.startDate, false, false)}</div>
                            <div id="single-event-uploaded-mobile" className="mobile-only"><b>Date:</b> {dateToSimple(event.startDate)}</div>
                        </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
                <br/>
                <li>
                    <a href="#bracket">Bracket</a>
                </li>
                {
                    topDecks.length ? (
                    <li>
                        <a href="#top-decks">Top Decks</a>
                    </li>
                    ) : ''
                }
                {
                    metagame.deckTypes.length ? (
                    <li>
                    <a href="#metagame-stats">Metagame Stats</a>
                    </li>
                    ) : ''
                }
                {
                    replays.length ? (
                    <li>
                        <a href="#replays">Replays</a>
                    </li>
                    ) : ''
                }
                </div>
                <img className="desktop-only" id="format-icon-large" src={formatArtwork} />
            </div>

            <div className="divider"/>

            <div id="bracket">
                <div className="subcategory-title-flexbox">
                <img 
                    style={{ width:'64px'}} 
                    src={`https://cdn.formatlibrary.com/images/emojis/${event.format.icon}.png`}
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
                Click Here for Full Bracket
                </a>
            </div>
            <div className="divider"/>
            {
                topDecks.length ? (
                <div id="top-decks">
                    <div className="subcategory-title-flexbox">
                    <img 
                        style={{ width:'64px'}} 
                        src={`https://cdn.formatlibrary.com/images/emojis/${event.format.icon}.png`}
                        alt={event.format.name}
                    />
                    <h2 className="subheading"><b>{event.abbreviation}</b> {topDecks.length === 1 ? 'Winning Deck' : (isSubscriber || isAdmin) ? `Decks` : `Top ${topDecks.length} Decks`}:</h2>
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
            <div className="divider"/>  
            {
                metagame.deckTypes.length ? (
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
                        <h2>Deck Type Representation</h2>
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
                        <h2>Deck Category Representation</h2>
                        <br/>
                        <Doughnut 
                        className="doughnut"
                        height={parseInt(500 - (20 * Math.ceil(metagame.deckTypes.length / 4)))}
                        width="500px"
                        data={deckCategoryData}
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
                        metagame.topSideDeckCards.length ? (
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
                replays.length ? (
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
