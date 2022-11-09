
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { Badge } from './Badge'
import { Placement } from './Placement'
import { DeckThumbnail } from '../Decks/DeckThumbnail'
import { NotFound } from '../General/NotFound'
import { useLocation, useParams } from 'react-router-dom'
import './PlayerProfile.css'

export const PlayerProfile = () => {
  const [player, setPlayer] = useState({})
  const [stats, setStats] = useState([])
  const [decks, setDecks] = useState([])
  const [deckTypes, setDeckTypes] = useState([])
  const { id } = useParams()
  const location = useLocation()
  const discriminator = location.hash.slice(-4)

  // USE LAYOUT EFFECT
  useLayoutEffect(() => window.scrollTo(0, 0))

  // USE EFFECT SET PLAYER
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`/api/players/${id}?discriminator=${discriminator}`)
        setPlayer(data)
      } catch (err) {
        console.log(err)
        setPlayer(null)
      }
    }

    fetchData()
  }, [id, discriminator])

  // USE EFFECT SET STATS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`/api/stats/${player.id}`)
        setStats(data)
      } catch (err) {
        console.log(err)
      }
    }

    fetchData()
  }, [player])

  // USE EFFECT SET DECKS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`/api/decks/player/${player.id}`)
        setDecks(data)
      } catch (err) {
        console.log(err)
      }
    }

    fetchData()
  }, [player])

  // USE EFFECT SET DECKS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`/api/decks/frequent/${player.id}`)
        setDeckTypes(data)
      } catch (err) {
        console.log(err)
      }
    }

    fetchData()
  }, [player])

  if (player === null) return <NotFound />
  if (!player.id) return <div />
  const regionNames = new Intl.DisplayNames(['en'], {type: 'region'})

  return (
    <div className="body">
      <div className="player-profile-flexbox">
        <div className="player-info">
          <div className="player-profile-title">{player.name}</div>
            <img
                className="player-pfp"
                src={
                  player.discordPfp ? `https://cdn.discordapp.com/avatars/${player.discordId}/${player.discordPfp}.webp` :
                  `https://cdn.formatlibrary.com/images/pfps/${player.name}.png`
                }
                alt={player.name}
                onError={(e) => {
                e.target.onerror = null
                e.target.src = 'https://cdn.discordapp.com/embed/avatars/1.png'
                }}
            />
            <div className="profile-info"> 
                {
                    player.firstName && player.lastName ? (
                        <div className="profile-line"><b>Name:</b> {player.firstName} {player.lastName}</div>
                    ) : ''
                }
                <div className="profile-line"><b>DuelingBook:</b> {player.duelingBook || 'N/A'}</div>   
                <div className="profile-line"><b>Discord:</b> {player.discordName && player.discriminator ? (<><span>{player.discordName}</span><span style={{ color: 'gray' }}>#{player.discriminator}</span></>): 'N/A'}</div>
                {
                    player.country ? (
                        <div className="profile-line"><b>Country:</b> {regionNames.of(player.country)} <img className="country" src={`https://www.worldometers.info/img/flags/${player.country.toLowerCase()}-flag.gif`} alt={player.country + '-flag'}/></div>
                    ) : ''
                }
                {
                    player.timeZone ? (
                        <div className="profile-line"><b>Time Zone:</b> {player.timeZone}</div>
                    ) : ''
                }
            </div>
            <div className="social-links">
                {
                    player.youtube ? (
                        <a 
                            href={player.youtube}
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            <img className="social-icon" src="https://cdn.formatlibrary.com/images/logos/YouTube.png" alt="youtube"/>
                        </a>
                    ) : ''
                }
                {
                    player.twitch ? (
                        <a 
                            href={"https://twitch.tv/" + player.twitch}
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            <img className="social-icon" src="https://cdn.formatlibrary.com/images/logos/Twitch.png" alt="twitch"/>
                        </a>
                    ) : ''
                }
                {
                    player.twitter ? (
                        <a 
                            href={"https://twitter.com/" + player.twitter}
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            <img className="social-icon" src="https://cdn.formatlibrary.com/images/logos/Twitter.png" alt="twitter"/>
                        </a>
                    ) : ''
                }
            </div>
        </div>
        <div className="player-awards">
          {stats.length ? (
            <div>
              <div className="badges-title">Best Formats:</div>
              <div className="badges-flexbox">
                {stats.map((s) => (
                  <Badge key={s.format} stats={s} />
                ))}
              </div>
            </div>
          ) : (
            ''
          )}
          {decks.length ? (
            <div>
              <div className="badges-title">Top Finishes:</div>
              <div className="badges-flexbox">
                {decks.map((d) => (
                  <Placement key={d.tournamentId} deck={d} />
                ))}
              </div>
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
      {deckTypes.length ? (
        <div id="popular-decks" className="popular-decks">
          <h2>Favorite Decks:</h2>
          <div className="popular-decks-flexbox">
            {deckTypes.map((dt) => (
              <DeckThumbnail deck={dt} key={dt.id} />
            ))}
          </div>
        </div>
      ) : (
        ''
      )}
    </div>
  )
}
