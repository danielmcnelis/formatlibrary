
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { StatsRow } from './StatsRow'
import { capitalize } from '@fl/utils'
import { useParams } from 'react-router-dom'
import './LeaderBoard.css'

export const LeaderBoard = () => {
    const [format, setFormat] = useState({})
    const [leaderboard, setLeaderboard] = useState([])
    const { id } = useParams()
  
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
          const {data} = await axios.get(`/api/stats/leaders/1000/${format.name.toLowerCase()}`)
          setLeaderboard(data)
        } catch (err) {
          console.log(err)
        }
      }
  
      fetchData()
    }, [format])
  
    if (!leaderboard.length) return <div></div>
  
    return (
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
                          return <StatsRow stats={stats} index={index} key={stats.playerId}/>
                      })
                  ) : <tr />
              }
            </tbody>
          </table>
        </div>
      </div>
    )
}
