
import { useNavigate } from 'react-router-dom'
import { ordinalize } from '@fl/utils'
import './StatsRow.css'

//GET MEDAL
const getMedal = (elo) => {
  return !elo
    ? 'https://cdn.formatlibrary.com/images/emojis/gold.png'
    : elo <= 320
    ? 'https://cdn.formatlibrary.com/images/emojis/mad.png'
    : elo > 320 && elo <= 360
    ? 'https://cdn.formatlibrary.com/images/emojis/sad.png'
    : elo > 360 && elo <= 400
    ? 'https://cdn.formatlibrary.com/images/emojis/rock.png'
    : elo > 400 && elo <= 440
    ? 'https://cdn.formatlibrary.com/images/emojis/bronze.png'
    : elo > 440 && elo <= 480
    ? 'https://cdn.formatlibrary.com/images/emojis/silver.png'
    : elo > 480 && elo <= 520
    ? 'https://cdn.formatlibrary.com/images/emojis/gold.png'
    : elo > 520 && elo <= 560
    ? 'https://cdn.formatlibrary.com/images/emojis/platinum.png'
    : elo > 560 && elo <= 600
    ? 'https://cdn.formatlibrary.com/images/emojis/diamond.png'
    : elo > 600 && elo <= 640
    ? 'https://cdn.formatlibrary.com/images/emojis/master.png'
    : elo > 640 && elo <= 680
    ? 'https://cdn.formatlibrary.com/images/emojis/legend.png'
    : elo > 680 && elo <= 720
    ? 'https://cdn.formatlibrary.com/images/emojis/god.png'
    : 'https://cdn.formatlibrary.com/images/emojis/treeborn.png'
}

//GET TITLE
const getTitle = (elo) => {
  return !elo
    ? 'Gold'
    : elo <= 320
    ? 'Tilted'
    : elo > 320 && elo <= 360
    ? 'Chump'
    : elo > 360 && elo <= 400
    ? 'Rock'
    : elo > 400 && elo <= 440
    ? 'Bronze'
    : elo > 440 && elo <= 480
    ? 'Silver'
    : elo > 480 && elo <= 520
    ? 'Gold'
    : elo > 520 && elo <= 560
    ? 'Platinum'
    : elo > 560 && elo <= 600
    ? 'Diamond'
    : elo > 600 && elo <= 640
    ? 'Master'
    : elo > 640 && elo <= 680
    ? 'Legend'
    : elo > 680 && elo <= 720
    ? 'Deity'
    : 'Ascended'
}

export const StatsRow = (props) => {
    const {index, stats, isClassic} = props
    let {elo, wins, losses, player} = stats
    if (isClassic === 'true') {
        console.log('using classic')
        elo = stats.classicElo
    }

    const navigate = useNavigate()
    
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    const name = player.name || ''
    const extension =  name.replaceAll('%', '%25')
        .replaceAll('/', '%2F')
        .replaceAll(' ', '_')
        .replaceAll('#', '%23')
        .replaceAll('?', '%3F')
        .replaceAll('&', '%26')
        .replaceAll('★', '_')

    const displayName = name.length <= 24 ? name : name.slice(0, 24).split(' ')[0] || ''
    const goToPlayer = () => navigate(`/players/${extension}`) 

    if (!player) {
        return <tr/>
    } else {
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
                <td className="leaderboard-cell-3">{(Math.round(100 * elo) / 100).toFixed(2)}</td>
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
}
