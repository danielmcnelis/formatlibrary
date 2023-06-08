import { Link } from 'react-router-dom'
import './MatchupBar.css'
import { capitalize } from '@fl/utils'

//MATCHUP
export const Matchup = (props) => {
    const { deckType, wins, losses, total, format } = props
    if (!deckType) return <p></p>
    console.log('deckType')
    const fraction = wins / total
    const percent = fraction.toFixed(3) * 100

    const backgroundColor = fraction < 0.4 ? '#cc0000' :
        fraction >= 0.4 & fraction < 0.45  ? 'e06666' :
        fraction >= 0.45 & fraction < 0.5  ? 'ea9999' :
        fraction === 0.5 ? '#eeeeee' :
        fraction >= 0.5 & fraction < 0.55  ? '#b6d7a8' :
        fraction >= 0.55 & fraction < 0.6  ? '#93c47d' :
        '#6aa84f'
  
      return (
          <Link to={`/decktypes/${deckType}?format=${format}`} key={deckType} className="matchup-cell" style={{backgroundColor}}>
            <p>${wins}-${losses} ({percent}%) vs ${capitalize(deckType)}</p>
          </Link>
      )
  } 
