
import './PoolRow.css'

export const PoolRow = (props = {}) => {
    const {format, status, createdAt, color, silhouette} = props
    if (!format || !status || !createdAt) return <div/>

    const difference = new Date() - new Date(createdAt)
    const timeAgo = difference < 1000 * 60 * 60 ? `${Math.round(difference / (1000 * 60))}m ago` :
        difference < 1000 * 60 * 60 * 24 ? `${Math.round(difference / (1000 * 60 * 60))}h ago` :
        `${Math.round(difference / (1000 * 60 * 60 * 24))}d ago`

    return (
        <div className="pool">
            <div className="pool-title">
                <div>{format.name}</div>
                <img
                    className="format-icon-small" 
                    src={`https://cdn.formatlibrary.com/images/emojis/${format.icon}.webp`}
                    alt={format.name}
                />
            </div>
            <div className="pool-icon" style={{backgroundColor: color}}>
                <img 
                    className="pool-emoji" 
                    src={silhouette}
                    alt="silhouette"
                />
            </div>
            <div className="center">{timeAgo}</div>
        </div>
    )
}
