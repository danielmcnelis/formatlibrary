import { Link } from 'react-router-dom'
import './MatchupBar.css'
import { capitalize } from '@fl/utils'

//MATCHUP
export const Matchup = (props) => {
    const { deckType, wins, losses, total, format } = props
    if (!deckType) return <p></p>
    const fraction = wins / total

    const backgroundColor = fraction < 0.40 ? '#cc0000' :
        fraction >= 0.40 && fraction < 0.44  ? '#e06666' :
        fraction >= 0.44 && fraction < 0.48  ? '#ea9999' :
        fraction >= 0.48 && fraction <= 0.52  ? '#eeeeee' :
        fraction > 0.52 && fraction <= 0.56  ? '#b6d7a8' :
        fraction > 0.56 && fraction <= 0.60  ? '#93c47d' :
        '#6aa84f'

      return (
        <div 
            onClick={() => {window.location.href=`/deckTypes/${deckType.toLowerCase().replace(/\s/g, '-')}?format=${format}`}}
            key={deckType} 
            className="matchup-cell" 
            style={{backgroundColor}}
        >
            <p>{wins}-{losses} ({(fraction * 100).toFixed(1)}%) vs {capitalize(deckType)}</p>
        </div>
      )
  } 
