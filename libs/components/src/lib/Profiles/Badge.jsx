
import { capitalize, urlize } from '@fl/utils'
import { Link } from 'react-router-dom'
import './Badge.css'

//GET MEDAL
const getMedal = (elo) => {
  return !elo ? 'https://cdn.formatlibrary.com/images/emojis/gold.png'
    : elo <= 400 ? 'https://cdn.formatlibrary.com/images/emojis/rock.png'
    : elo > 400 && elo <= 440 ? 'https://cdn.formatlibrary.com/images/emojis/bronze.png'
    : elo > 440 && elo <= 480 ? 'https://cdn.formatlibrary.com/images/emojis/silver.png'
    : elo > 480 && elo <= 520 ? 'https://cdn.formatlibrary.com/images/emojis/gold.png'
    : elo > 520 && elo <= 560 ? 'https://cdn.formatlibrary.com/images/emojis/platinum.png'
    : elo > 560 && elo <= 600 ? 'https://cdn.formatlibrary.com/images/emojis/diamond.png'
    : elo > 600 && elo <= 640 ? 'https://cdn.formatlibrary.com/images/emojis/master.png'
    : elo > 640 && elo <= 680 ? 'https://cdn.formatlibrary.com/images/emojis/legend.png'
    : elo > 680 && elo <= 720 ? 'https://cdn.formatlibrary.com/images/emojis/god.png'
    : 'https://cdn.formatlibrary.com/images/emojis/treeborn.png'
}

//BADGE
export const Badge = (props) => {
  const { stats } = props
  if (!stats) return
  const medal = getMedal(stats.elo)

  return (
    <div onClick={() => {window.location.href=`/formats/${stats.formatName}`}}>
        <div className="badge">
            <img src={medal} alt="medal"/>
            <div className="badge-label">{capitalize(stats.formatName.replace('_', ' '), true)}</div>
        </div>
    </div>
  )
}
