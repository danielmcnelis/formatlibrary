
import './PlayerRow.css'
import { PlayerRowBadge } from './PlayerRowBadge'
import { PlayerRowPlacement } from './PlayerRowPlacement'

export const PlayerRow = (props) => {
    const {player, stats = [], decks = [], deckTypes = []} = props
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'

    return (    
        <tr onClick={() => window.open(`https://formatlibrary.com/players/${player.name}`, "_blank")} className={`${evenOrOdd}-search-results-row`}>
            <td style={{paddingTop: '2px', paddingBottom: '2px', width: '25%', paddingRight: '12px',}}>
                <div className="player-cell">
                <img 
                    className="player-cell-pfp"
                    src={`/api/players/${player.id}/avatar`} 
                    alt={player.name}
                />
                <div style={{fontSize: '18px'}}>{player.name}</div>
                </div>
            </td>
            
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
            </td>

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

            <td style={{paddingTop: '2px', paddingBottom: '2px', paddingLeft: '12px', width: '25%'}}>
                {
                    deckTypes.length ? (
                        <div className="player-cell">
                        {deckTypes.map((dt) => (
                            <img
                                className="player-cell-pfp"
                                style={{width: '48px', height: '48px', marginLeft: '10px', marginRight: '10px'}}
                                src={`https://cdn.formatlibrary.com/images/artworks/${dt.centerCardArtworkId}.jpg`} 
                                alt={dt.name}
                            />
                        ))}
                        </div>
                    ) : 'N/A'
                }
            </td>
        </tr>
    )
}
