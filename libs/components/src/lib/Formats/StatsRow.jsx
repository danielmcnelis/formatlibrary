
import { useNavigate } from 'react-router-dom'
import { ordinalize } from '@fl/utils'
import './StatsRow.css'

//GET MEDAL
const getMedal = (elo) => {
  return !elo
    ? 'https://cdn.formatlibrary.com/images/emojis/gold.png'
    : elo <= 230
    ? 'https://cdn.formatlibrary.com/images/emojis/mad.png'
    : elo > 230 && elo <= 290
    ? 'https://cdn.formatlibrary.com/images/emojis/sad.png'
    : elo > 290 && elo <= 350
    ? 'https://cdn.formatlibrary.com/images/emojis/rock.png'
    : elo > 350 && elo <= 410
    ? 'https://cdn.formatlibrary.com/images/emojis/bronze.png'
    : elo > 410 && elo <= 470
    ? 'https://cdn.formatlibrary.com/images/emojis/silver.png'
    : elo > 470 && elo <= 530
    ? 'https://cdn.formatlibrary.com/images/emojis/gold.png'
    : elo > 530 && elo <= 590
    ? 'https://cdn.formatlibrary.com/images/emojis/platinum.png'
    : elo > 590 && elo <= 650
    ? 'https://cdn.formatlibrary.com/images/emojis/diamond.png'
    : elo > 650 && elo <= 710
    ? 'https://cdn.formatlibrary.com/images/emojis/master.png'
    : elo > 710 && elo <= 770
    ? 'https://cdn.formatlibrary.com/images/emojis/legend.png'
    : 'https://cdn.formatlibrary.com/images/emojis/god.png'
}

//GET TITLE
const getTitle = (elo) => {
  return !elo
    ? 'Gold'
    : elo <= 230
    ? 'Tilted'
    : elo > 230 && elo <= 290
    ? 'Chump'
    : elo > 290 && elo <= 350
    ? 'Rock'
    : elo > 350 && elo <= 410
    ? 'Bronze'
    : elo > 410 && elo <= 470
    ? 'Silver'
    : elo > 470 && elo <= 530
    ? 'Gold'
    : elo > 530 && elo <= 590
    ? 'Platinum'
    : elo > 590 && elo <= 650
    ? 'Diamond'
    : elo > 650 && elo <= 710
    ? 'Master'
    : elo > 710 && elo <= 770
    ? 'Legend'
    : 'Deity'
}

export const StatsRow = (props) => {
    const {index, stats} = props
    const {elo, wins, losses, player} = stats
    if (!player) return <tr/>
    const discriminator = player.discriminator 
!== '0' ? `#${player.discriminator}` : ''

    const extension =  player.globalName?.replaceAll('%', '%252525')
        .replaceAll('/', '%2F')
        .replaceAll(' ', '_')
        .replaceAll('#', '%23')
        .replaceAll('?', '%3F') + discriminator

    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    const displayName = player.globalName?.length <= 24 ? player.globalName : player.globalName?.slice(0, 24).split(' ').slice(0, -1).join(' ')
    const navigate = useNavigate()
    const goToPlayer = () => navigate(`/players/${extension}`) 

    return (
        <tr onClick={() => goToPlayer()} className={`${evenOrOdd}-search-results-row`}>
            <td className="leaderboard-cell-1">{ordinalize(index + 1)}</td>
            <td className="leaderboard-cell-2">
                <div className="player-cell">
                    <img
                        className="player-cell-pfp"
                        src={`https://cdn.formatlibrary.com/images/pfps/${stats.player.discordId || stats.player.name}.png`}
                        onError={(e) => {
                                e.target.onerror = null
                                e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                            }
                        }
                        alt={stats.player.name}
                    />
                    <div>{displayName}</div>
                </div>
            </td>
            <td className="leaderboard-cell-3">{Math.round(100 * elo)/100}</td>
            <td className="leaderboard-cell-4">
                <div className="medal-cell">
                    <div className="medal-title">{getTitle(elo)}</div>
                    <img width="32px" src={getMedal(elo)} alt="medal"/>
                </div>
            </td>
            <td className="leaderboard-cell-5">{wins}</td>
            <td className="leaderboard-cell-6">{losses}</td>
            <td className="leaderboard-cell-7">{(Math.round(1000 * wins / (wins + losses))/10).toFixed(2)}%</td>
        </tr>
    )
}
