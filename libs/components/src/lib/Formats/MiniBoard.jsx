
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { StatsRow } from './StatsRow'
import { capitalize } from '@fl/utils'
import './MiniBoard.css'

export const MiniBoard = (props) => {
    const { format, limit } = props
    const [miniboard, setMiniBoard] = useState([])
    const navigate = useNavigate()
    const statsType = format.useSeasonal ? 'seasonal' : 'general'
    const videoPlaylistId = format?.videoPlaylistId
    let [eloType, winsType, lossesType, url] = statsType === 'seasonal' ? 
        ['seasonalElo', 'seasonalWins', 'seasonalLosses'] :
        ['elo', 'wins', 'losses']
    
    const goToLeaderBoard = () => navigate(`/leaderboards/${format.name.toLowerCase()}`)

    // USE EFFECT FETCH DATA
    useEffect(() => {
      const fetchData = async () => {
        try {
          let {data} = await axios.get(`/api/stats/leaders/${limit}/${format.name.toLowerCase()}`)
          if (statsType === 'seasonal') {
              data.sort((a, b) => b.seasonalElo - a.seasonalElo)
              setMiniBoard(data)
          } else if (statsType === 'classic') {
              data.sort((a, b) => b.classicElo - a.classicElo)
              setMiniBoard(data)
          } else {
              data.sort((a, b) => b.elo - a.elo)
              setMiniBoard(data)
          }
        } catch (err) {
          console.log(err)
        }
      }
  
      fetchData()
    }, [format, limit])
  
    if (!format || !limit) return
    if (!miniboard.length) return <div></div>
  
    return (
      <div>
        <div className="divider"/> 
        <div id="leaderboard" className="miniboard">
          <div onClick={() => goToLeaderBoard()} className="miniboard-title-flexbox">
            <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`}/>
            <h2 className="subheading">{capitalize(format.name, true)} Leaderboard</h2>
            <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`}/>
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
                                eloType={eloType} 
                                winsType={winsType} 
                                lossesType={lossesType} 
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
