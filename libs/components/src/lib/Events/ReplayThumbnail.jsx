
import './ReplayThumbnail.css'

export const ReplayThumbnail = (props = {}) => {
    const {url, roundName, winner, loser} = props
    if (!url || !roundName || !winner || !loser) return <div/>

  return (
        <div className="replayThumbnail" >  
            <h3>{roundName}</h3>
            <a
                href={url}
                target="_blank" 
                rel="noopener noreferrer"
            >
                <div className="thumbnail-flexbox">
                    <div className="replay-player">
                        <img 
                            className="thumbnail-player-pfp" 
                            src={`https://cdn.formatlibrary.com/images/pfps/${winner.discordId || winner.name}.png`}
                            onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                                }
                            }
                            alt={winner.name}
                        />                
                        <p className="playerName">{winner.name}</p>
                    </div>

                    <img 
                        className="replayThumbnail-image" 
                        src={`https://cdn.formatlibrary.com/images/emojis/versus.png`}
                        alt="vs"
                    />
                    
                    <div className="replay-player">
                        <img 
                            className="thumbnail-player-pfp" 
                            src={`https://cdn.formatlibrary.com/images/pfps/${loser.discordId || loser.name}.png`}
                            onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                                }
                            }
                            alt={loser.name}
                        />
                        <p className="playerName">{loser.name}</p>
                    </div>
                    
                </div>
            </a>
        </div>
  )
}
