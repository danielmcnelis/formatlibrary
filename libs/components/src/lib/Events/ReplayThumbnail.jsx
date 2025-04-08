
import './ReplayThumbnail.css'
import { abbreviateString } from '@fl/utils'

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
                            src={`/api/players/${winner.id}/avatar`}
                            alt={winner.name}
                        />                
                        <p className="playerName">{abbreviateString(winner.name)}</p>
                    </div>

                    <img 
                        className="replayThumbnail-image" 
                        src={`https://cdn.formatlibrary.com/images/emojis/versus.png`}
                        alt="vs"
                    />
                    
                    <div className="replay-player">
                        <img 
                            className="thumbnail-player-pfp" 
                            src={`/api/players/${loser.id}/avatar`}
                            alt={loser.name}
                        />
                        <p className="playerName">{abbreviateString(loser.name)}</p>
                    </div>
                    
                </div>
            </a>
        </div>
  )
}
