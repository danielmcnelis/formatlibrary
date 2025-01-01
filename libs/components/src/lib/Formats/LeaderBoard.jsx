
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { StatsRow } from './StatsRow'
import { capitalize } from '@fl/utils'
import { useParams, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import './LeaderBoard.css'

export const LeaderBoard = () => {
    const [format, setFormat] = useState({})
    const [leaderboard, setLeaderboard] = useState([])
    const { id } = useParams()
    const location = useLocation()
    const statsType = location?.search?.slice(5)
    const videoPlaylistId = format?.videoPlaylistId
    let [eloType, winsType, lossesType] = statsType === 'seasonal' ? 
        ['seasonalElo', 'seasonalWins', 'seasonalLosses'] :
        ['elo', 'wins', 'losses']
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0), [])
  
    // USE EFFECT FETCH DATA
    useEffect(() => {
      const fetchData = async () => {
        try {
          const {data} = await axios.get(`/api/formats/${id}`)
          setFormat(data.format)
        } catch (err) {
          console.log(err)
        }
      }
  
      fetchData()
    }, [])
  
    // USE EFFECT FETCH DATA
    useEffect(() => {
      if (!format.name) return
      const fetchData = async () => {
        try {
            let {data} = await axios.get(`/api/stats/leaders/1000/${format.name.toLowerCase()}`)
            if (statsType === 'seasonal') {
                data.sort((a, b) => b.seasonalElo - a.seasonalElo)
                setLeaderboard(data)
            } else if (statsType === 'classic') {
                data.sort((a, b) => b.classicElo - a.classicElo)
                setLeaderboard(data)
            } else {
                data.sort((a, b) => b.elo - a.elo)
                setLeaderboard(data)
            }
        } catch (err) {
          console.log(err)
        }
      }
  
      fetchData()
    }, [format])
  
    if (!leaderboard.length) return <div></div>
  
    return (
        <>
            <Helmet>
                <title>{`Yu-Gi-Oh! ${format?.name} Format Leaderboard - Format Library`}</title>
                <meta name="og:title" content={`Live rankings of online ${format?.name} Format Yu-Gi-Oh! players.`}/>
                <meta name="description" content={`Live rankings of online ${format?.name} Format Yu-Gi-Oh! players.`}/>
                <meta name="og:description" content={`Live rankings of online ${format?.name} Format Yu-Gi-Oh! players.`}/>
            </Helmet>
            {
                videoPlaylistId ? <div className="adthrive-content-specific-playlist" data-playlist-id={videoPlaylistId}></div> :
                <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            }
            <div className="body">
                <div id="leaderboard" className="leaderboard">
                <div className="subcategory-title-flexbox">
                    <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                    <h1 className="leaderboard-title">{capitalize(format.name, true)} Leaderboard</h1>
                    <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                </div>
                <table id="leaderboard-table">
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
                        leaderboard.length ? (
                            leaderboard.map((stats, index) => {
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
        </>
      
    )
}
