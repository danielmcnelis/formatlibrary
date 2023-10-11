/* eslint-disable max-statements */

import './FocalCard.css'

export const FocalCard = (props) => {
    const {card} = props
    if (!card.id) return <div className="focal-card-flexbox"/>
  
    return (
        <div className="focal-card-flexbox">
            <img className="focal-card-image" src={`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`} alt={card.name}/>
            <div className="focal-card-description">{card.description}</div>
        </div>
        
    )
}
