
import './PairingRow.css'

// PAIRING ROW
export const PairingRow = (props = {}) => {
    const {format, status, playerA, playerB} = props
    if (!format || !status || !playerA || !playerB) return <div/>

    return (
        <div>  
            <div className="pairing-title">
                <h3>{format.name}</h3>
                <img
                    className="format-icon-small" 
                    src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.png`}
                    alt={format.name}
                />
            </div>
            <div className="thumbnail-flexbox">
                <div className="pairing-player">
                    <img 
                        className="thumbnail-player-pfp" 
                        src={`https://cdn.formatlibrary.com/images/pfps/${playerA.discordId || playerA.name}.png`}
                        onError={(e) => {
                                e.target.onerror = null
                                e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                            }
                        }
                        alt={playerA.discordName || playerA.name}
                    />                
                    <p className="playerName">{playerA.name}</p>
                </div>

                <img 
                    className="replayThumbnail-image" 
                    src={`https://cdn.formatlibrary.com/images/emojis/versus.png`}
                    alt="vs"
                />
                
                <div className="pairing-player">
                    <img 
                        className="thumbnail-player-pfp" 
                        src={`https://cdn.formatlibrary.com/images/pfps/${playerB.discordId || playerB.name}.png`}
                        onError={(e) => {
                                e.target.onerror = null
                                e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                            }
                        }
                        alt={playerB.discordName || playerB.name}
                    />
                    <p className="playerName">{playerB.name}</p>
                </div>
                
            </div>
        </div>
    )
}
