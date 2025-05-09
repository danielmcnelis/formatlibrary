
import './MobileReplayRow.css'

export const MobileReplayRow = (props) => {
    const {replay} = props
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    const openNewTab = () => window.open(replay.url, "_blank")

    return (
        <tr onClick={() => openNewTab()} className={`${evenOrOdd}-search-results-row`}>
          <td className="no-padding">
              <div className="format-cell-flexbox" style={{padding: '0px'}}>
                <img src={`https://cdn.formatlibrary.com/images/emojis/${replay.format?.icon}.png`} alt="format icon"/>
              </div>
          </td>

          <td className="no-padding">
              <div className="replay-event-cell">
                {replay.eventAbbreviation}
              </div>
          </td>

          <td className="no-padding">
            <div className="round-cell">
                {replay.roundName}
            </div>
          </td>

          <td className="no-padding mobile-replay-row-players-flexbox">
                <img 
                    style={{margin: '0px 5px'}}
                    className="player-cell-pfp"
                    src={`https://cdn.formatlibrary.com/images/pfps/${replay.winner.discordId}.png`}
                    onError={(e) => {
                            e.target.onerror = null
                            e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                        }
                    }
                    alt={!replay.winnerName ? '' : replay.winnerName?.length > 0 && replay.winnerName?.length <= 17 ? replay.winnerName : replay.winnerName.slice(0, 17)?.split(' ')[0] || ''}
                />
                <div><i>VS</i></div>
                <img
                    style={{margin: '0px 5px'}}
                    className="player-cell-pfp"
                    src={`https://cdn.formatlibrary.com/images/pfps/${replay.loser.discordId}.png`}
                    onError={(e) => {
                            e.target.onerror = null
                            e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                        }
                    }
                    alt={!replay.loserName ? '' : replay.loserName?.length <= 17 ? replay.loserName : replay.loserName.slice(0, 17)?.split(' ')[0] || ''}
                />
          </td>
        </tr>
    )
}
