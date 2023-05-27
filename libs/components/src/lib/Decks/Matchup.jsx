import { Link } from 'react-router-dom'
import { capitalize } from '@fl/utils'

//MATCHUP
export const Matchup = (props) => {
    const { deckType, wins, losses, total } = props

    return (
        <>
            <h3>{deckType}</h3>
            <div>
                {wins} W - {losses} L
            </div>
            <div>
                {(wins / total).toFixed(3) * 100}
            </div>
        </>
    )
  } 
