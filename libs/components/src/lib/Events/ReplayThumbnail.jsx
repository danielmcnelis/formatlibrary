
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
                <div className="replayThumbnail-flexbox">
                    <img 
                    className="replayThumbnail-player-pfp" 
                    src={`https://cdn.formatlibrary.com/images/pfps/${winner.discordId || winner.name}.png`}
                    onError={(e) => {
                            e.target.onerror = null
                            e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                        }
                    }
                    alt={winner.name}
                    />
                    <img 
                        className="replayThumbnail-image" 
                        src={`https://cdn.formatlibrary.com/images/emojis/versus.png`}
                        alt="vs"
                    />
                    <img 
                    className="replayThumbnail-player-pfp" 
                    src={`https://cdn.formatlibrary.com/images/pfps/${loser.discordId || loser.name}.png`}
                    onError={(e) => {
                            e.target.onerror = null
                            e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                        }
                    }
                    alt={loser.name}
                    />
                </div>
            </a>
        </div>
  )
}
