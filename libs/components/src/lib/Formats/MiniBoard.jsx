
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { StatsRow } from './StatsRow'
import { capitalize } from '@fl/utils'
import './MiniBoard.css'

export const MiniBoard = (props) => {
    const { format, limit } = props
    console.log('format in miniboard', format)
    const [miniboard, setMiniBoard] = useState([])
    const navigate = useNavigate()
    const now = new Date()
    console.log(`format.seasonResetDate < now`, format.seasonResetDate < now)
    const statsType = format.seasonResetDate < now ? 'seasonal' : 'general'
    console.log(`statsType in miniboard`, statsType)
    // const videoPlaylistId = format?.videoPlaylistId
    const url = statsType === 'seasonal' ? `/leaderboards/${format?.name?.toLowerCase()}?type=seasonal` :
        `/leaderboards/${format?.name?.toLowerCase()}`
    
    const goToLeaderBoard = () => navigate(url)

    // USE EFFECT FETCH DATA
    useEffect(() => {
      const fetchData = async () => {
        try {
            if (statsType === 'seasonal') {
                const {data} = await axios.get(`/api/stats/seasonal-leaders/${limit}/${format?.name?.toLowerCase()}`)
                setMiniBoard(data)
            } else {
                const {data} = await axios.get(`/api/stats/general-leaders/${limit}/${format?.name?.toLowerCase()}`)
                setMiniBoard(data)
            }
        } catch (err) {
          console.log(err)
        }
      }
  
      fetchData()
    }, [statsType])
  
    if (!format || !limit || !miniboard.length) return <div/>
  
    return (
      <div>
        <div className="divider"/> 
        <div id="leaderboard" className="miniboard">
          <div onClick={() => goToLeaderBoard()} className="miniboard-title-flexbox">
            <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt="format-icon"/>
            <h2 className="subheading">{capitalize(format.name, true)} Leaderboard</h2>
            <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt="format-icon"/>
          </div>
          <table id="miniboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Elo</th>
                <th>Medal</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {
                  miniboard.length ? (
                      miniboard.map((stats, index) => {
                        return <StatsRow 
                                stats={stats} 
                                statsType={statsType} 
                                index={index} 
                                key={stats.playerId}
                            />
                    })
                  ) : <tr />
              }
            </tbody>
          </table>
        </div>
      </div>
    )
}
