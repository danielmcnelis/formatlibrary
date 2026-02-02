
import { capitalize } from '@fl/utils'
import './PlayerRowBadge.css'

//GET MEDAL
const getMedal = (elo) => {
  return !elo ? 'https://cdn.formatlibrary.com/images/emojis/gold.webp'
    : elo <= 400 ? 'https://cdn.formatlibrary.com/images/emojis/rock.webp'
    : elo > 400 && elo <= 440 ? 'https://cdn.formatlibrary.com/images/emojis/bronze.webp'
    : elo > 440 && elo <= 480 ? 'https://cdn.formatlibrary.com/images/emojis/silver.webp'
    : elo > 480 && elo <= 520 ? 'https://cdn.formatlibrary.com/images/emojis/gold.webp'
    : elo > 520 && elo <= 560 ? 'https://cdn.formatlibrary.com/images/emojis/platinum.webp'
    : elo > 560 && elo <= 600 ? 'https://cdn.formatlibrary.com/images/emojis/diamond.webp'
    : elo > 600 && elo <= 640 ? 'https://cdn.formatlibrary.com/images/emojis/master.webp'
    : elo > 640 && elo <= 680 ? 'https://cdn.formatlibrary.com/images/emojis/legend.webp'
    : elo > 680 && elo <= 720 ? 'https://cdn.formatlibrary.com/images/emojis/god.webp'
    : 'https://cdn.formatlibrary.com/images/emojis/treeborn.webp'
}

//BADGE
export const PlayerRowBadge = (props) => {
  const { stats } = props
  if (!stats) return
  const medal = getMedal(stats.elo)

  return (
    <div onClick={() => {window.location.href=`/formats/${stats.formatName}`}}>
        <div className="badge">
            <img src={medal} alt="medal"/>
            <div className="link">{capitalize(stats.formatName.replace('_', ' '), true)}</div>
        </div>
    </div>
  )
}
