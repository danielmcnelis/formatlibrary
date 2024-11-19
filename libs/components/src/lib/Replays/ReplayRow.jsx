
import './ReplayRow.css'

export const ReplayRow = (props) => {
    const {replay} = props
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    const format = replay.format || {}
    const openNewTab = () => window.open(replay.url, "_blank")

    return (    
        <tr onClick={() => openNewTab()} className={`${evenOrOdd}-search-results-row`}>
          <td className="no-padding">
              <div className="format-cell-flexbox">
                <img src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`} alt={format.icon}/>
                <div>{format.name}</div>
              </div>
          </td>

        <td className="no-padding replay-row-event-flexbox">
              <div className="replay-event-cell">
                {replay.eventAbbreviation}
              </div>
              <img src={`https://cdn.formatlibrary.com/images/logos/${replay.event?.community?.replaceAll('+', '%2B')}.png`} alt={replay.event?.community}/>
        </td>

          <td className="no-padding">
            <div className="round-cell">
                {replay.roundName}
            </div>
          </td>

          <td className="no-padding">
              <div className="player-cell">
                <img 
                    className="player-cell-pfp"
                    src={`https://cdn.formatlibrary.com/images/pfps/${replay.winner.discordId}.png`}
                    onError={(e) => {
                            e.target.onerror = null
                            e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                        }
                    }
                    alt={replay.winnerName}
                />
                <div>{!replay.winnerName ? '' : replay.winnerName?.length <= 17 ? replay.winnerName : replay.winnerName?.slice(0, 17)?.split(' ')[0] || ''}</div>
              </div>
          </td>

            <div className="deckType-cell">
                {replay.winningDeckType || '-'}
            </div>

          <td className="no-padding">
              <div className="player-cell">
                <img 
                    className="player-cell-pfp"
                    src={`https://cdn.formatlibrary.com/images/pfps/${replay.loser.discordId}.png`}
                    onError={(e) => {
                            e.target.onerror = null
                            e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                        }
                    }
                    alt={replay.loserName}
                />
                <div>{!replay.loserName ? '' : replay.loserName?.length <= 17 ? replay.loserName : replay.loserName?.slice(0, 17)?.split(' ')[0] || ''}</div>
              </div>
          </td>

            <div className="deckType-cell">
                {replay.losingDeckType || '-'}
            </div>

          <td className="no-padding">
            <div className="date-cell">
                {replay.publishDate?.substring(0, 10) || ''}
            </div>
          </td>
        </tr>
    )
}
