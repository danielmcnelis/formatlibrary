
import { capitalize, underscorize } from '@fl/utils'
import { Link } from 'react-router-dom'
import './Badge.css'

//GET MEDAL
const getMedal = (elo) => {
  return !elo ? 'https://cdn.formatlibrary.com/images/emojis/gold.png'
    : elo <= 230 ? 'https://cdn.formatlibrary.com/images/emojis/mad.png'
    : elo > 230 && elo <= 290 ? 'https://cdn.formatlibrary.com/images/emojis/sad.png'
    : elo > 290 && elo <= 350 ? 'https://cdn.formatlibrary.com/images/emojis/rock.png'
    : elo > 350 && elo <= 410 ? 'https://cdn.formatlibrary.com/images/emojis/bronze.png'
    : elo > 410 && elo <= 470 ? 'https://cdn.formatlibrary.com/images/emojis/silver.png'
    : elo > 470 && elo <= 530 ? 'https://cdn.formatlibrary.com/images/emojis/gold.png'
    : elo > 530 && elo <= 590 ? 'https://cdn.formatlibrary.com/images/emojis/platinum.png'
    : elo > 590 && elo <= 650 ? 'https://cdn.formatlibrary.com/images/emojis/diamond.png'
    : elo > 650 && elo <= 710 ? 'https://cdn.formatlibrary.com/images/emojis/master.png'
    : elo > 710 && elo <= 770 ? 'https://cdn.formatlibrary.com/images/emojis/legend.png'
    : 'https://cdn.formatlibrary.com/images/emojis/god.png'
}

//BADGE
export const Badge = (props) => {
  const { stats } = props
  if (!stats) return
  const medal = getMedal(stats.elo)

  return (
    <Link className="link" to={underscorize(`/formats/${stats.format}`)}>
        <div className="badge">
            <img src={medal} alt="medal"/>
            <div className="badge-label">{capitalize(stats.format.replace('_', ' '), true)}</div>
        </div>
    </Link>
  )
}
