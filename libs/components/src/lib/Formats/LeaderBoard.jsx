
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { StatsRow } from './StatsRow'
import { capitalize } from '@fl/utils'
import { useParams, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import './LeaderBoard.css'

  // GET SEASON
  const getSeason = (month) => {
      return month === 11 || month < 2 ? 'winter' : month < 5 ? 'spring' : month < 8 ? 'summer' : 'autumm'
  }

export const LeaderBoard = () => {
    const [format, setFormat] = useState({})
    const [leaderboard, setLeaderboard] = useState([])
    const { id } = useParams()
    const location = useLocation()
    const statsType = location?.search?.slice(6)
    const videoPlaylistId = format?.videoPlaylistId
    const season = getSeason(new Date().getMonth())
    console.log('format', format)
    console.log('leaderboard', leaderboard)
    console.log('id', id)
    console.log('location', location)
    console.log('statsType', statsType)
    console.log('season', season)

    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0), [])
  
    // USE EFFECT FETCH DATA
    useEffect(() => {
      const fetchData = async () => {
        try {
            const {data: formatData} = await axios.get(`/api/formats/${id}`)
            console.log('formatData', formatData)
            setFormat(formatData)

            console.log('statsType in fetch', statsType)
            if (statsType === 'seasonal') {
                const {data} = await axios.get(`/api/stats/seasonal-leaders/1000/${formatData.format.name.toLowerCase()}`)
                setLeaderboard(data)
            } else if (statsType === 'classic') {
                const {data} = await axios.get(`/api/stats/classic-leaders/1000/${formatData.name.format.toLowerCase()}`)
                setLeaderboard(data)
            } else {
                console.log('HELLO WORLD????')
                const {data} = await axios.get(`/api/stats/general-leaders/1000/${formatData.name.format.toLowerCase()}`)
                setLeaderboard(data)
            }
        } catch (err) {
          console.log(err)
        }
      }
  
      fetchData()
    }, [id, statsType])
  
    if (!leaderboard.length) return <div/>
  
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
                    <div>
                    {
                        statsType === 'seasonal' ? (
                            <div className="subcategory-title-flexbox">
                                <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                                <h1>Seasonal</h1>
                                <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${season}.png`} alt={season || 'season'}/>
                                <h1>{capitalize(format.name, true)} Leaderboard</h1>
                                <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                            </div>
                        ) : (
                            <div className="subcategory-title-flexbox">
                                <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                                <h2>{capitalize(format.name, true)} Leaderboard</h2>
                                <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                            </div>
                        )
                    }
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
