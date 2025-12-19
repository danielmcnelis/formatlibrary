
import './MobilePlayerRow.css'
import {PlayerRowBadge} from './PlayerRowBadge'
import {PlayerRowPlacement} from './PlayerRowPlacement'

export const MobilePlayerRow = (props) => {
    const {player, stats = [], decks = []} = props
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'

    return (    
        <tr onClick={() => window.open(`https://formatlibrary.com/players/${player.name}`, "_blank")} className={`${evenOrOdd}-search-results-row`}>
            <td className="no padding mobile-replay-row-players-flexbox" style={{paddingTop: '2px', paddingBottom: '2px', width: '25%'}}>
                <div className="player-cell">
                <img 
                    className="player-cell-pfp"
                    src={`/api/players/${player.id}/avatar`} 
                    alt={player.name}
                />
                <div style={{fontSize: '18px'}}>{player.name}</div>
                </div>
            </td>
{/*             
            <td style={{paddingTop: '2px', paddingBottom: '2px', paddingLeft: '12px', paddingRight: '12px', height: '76px', width: '25%'}}>    
                {stats.length ? (
                    <div className="horizontal-centered-flexbox link">
                        {stats.map((s) => (
                        <PlayerRowBadge color={"primary"} key={s.formatName} stats={s} />
                        ))}
                    </div>
                ) : (
                    'N/A'
                )}
            </td> */}

            <td style={{paddingTop: '2px', paddingBottom: '2px', paddingLeft: '12px', paddingRight: '12px', width: '25%'}}>   
                {decks.length ? (
                    <div className="horizontal-centered-flexbox link">
                        {decks.map((d) => (
                        <PlayerRowPlacement color={"primary"} key={d.tournamentId} deck={d} />
                        ))}
                    </div>
                ) : (
                    'N/A'
                )}
            </td>
        </tr>
    )
}
