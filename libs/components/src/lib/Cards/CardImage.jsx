import { Link } from 'react-router-dom'
import { camelize } from '@fl/utils'
import './CardImage.css'

export const CardImage = (props) => {
    let {addCard, removeCard, card, previous, status, rarity, width, margin, padding, index, locale, disableLink, setCard, isDraft, isPackOpener} = props
    if (rarity?.includes('Short Print')) rarity = 'Common' 
    
    if (isDraft) {
        return (
            <div className="CardImage-box">
                <div className="card-image-cell"  >
                <img
                    src={`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`}
                    card={card}
                    onMouseOver={() => setCard(card)}
                    onClick={()=> disableLink ? '' : addCard(card)}
                    style={{width, margin, padding}}
                    className="CardImages"
                    alt={card.name}
                />
                </div>
            </div>
          )
    } else if (isPackOpener) {
         return (
            <div className="CardImage-box">
                <Link to={`/cards/${
                card.name.replaceAll('%', '%25')
                    .replaceAll('/', '%2F')
                    .replaceAll(' ', '-')
                    .replaceAll('#', '%23')
                    .replaceAll('?', '%3F')
                    .replaceAll('&', '%26')
                    .replaceAll('★', '-')
                }`}
                target="_blank" 
                rel="noopener noreferrer"
                >
                    <div className="card-image-cell"  >
                    {
                        rarity ? <img src={`https://cdn.formatlibrary.com/images/rarities/${camelize(rarity)}.png`} alt={rarity} className="rarity-icon"/> : null
                    }
                    <img
                        src={`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`}
                        card={card}
                        onMouseOver={() => setCard(card)}
                        onClick={()=> disableLink ? '' : addCard(card)}
                        style={{width, margin, padding}}
                        className="CardImages"
                        alt={card.name}
                    />
                    </div>
                </Link>
            </div>
          )
    } else if (disableLink) {
        return (
            <div className="CardImage-box">
                <div className="card-image-cell"  >
                {
                    status && status !== 'no longer on list' ? <img src={`https://cdn.formatlibrary.com/images/emojis/${status}.png`} alt={status} className="status-icon"/> : null
                }
                <img
                    src={`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`}
                    card={card}
                    onMouseOver={() => setCard(card)}
                    onContextMenu={(e)=> {
                        e?.preventDefault()
                        if (locale === 'main' || locale === 'side' || locale === 'extra') {
                            return removeCard(locale, index)
                        } else if (e.shiftKey) {
                            return addCard(card, 'side')
                        } else {
                            return addCard(card, 'main')
                        } 
                    }}
                    style={{width, margin, padding}}
                    className="CardImages"
                    alt={card.name}
                />
                {
                    previous ? <img src={`https://cdn.formatlibrary.com/images/emojis/${previous === 'forbidden' ? 'from0' : previous === 'limited' ? 'from1' : previous === 'semi-limited' ? "from2" : 'new'}.png`} alt={card.name} className="remarks-icon"/> : null
                }
                </div>
            </div>
          )
    } else {
        return (
            <div className="CardImage-box">
              {
                parseInt(width, 10) < 48 ? (
                  <img
                    src={`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`}
                    card={card}
                    style={{width, margin, padding}}
                    className="SmallCardImages"
                    alt={card.name}
                  />
                ) : (
                  <Link to={`/cards/${
                    card.name.replaceAll('%', '%25')
                      .replaceAll('/', '%2F')
                      .replaceAll(' ', '_')
                      .replaceAll('#', '%23')
                      .replaceAll('?', '%3F')
                      .replaceAll('&', '%26')
                      .replaceAll('★', '_')
                    }`}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                      <div className="card-image-cell">
                        {
                          status && status !== 'no longer on list' ? <img src={`https://cdn.formatlibrary.com/images/emojis/${status}.png`} alt={status} className="status-icon"/> : null
                        }
                        <img
                          src={`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`}
                          card={card}
                          style={{width, margin, padding}}
                          onContextMenu={(e)=> {
                              e?.preventDefault()
                              if (locale === 'main' || locale === 'side' || locale === 'extra') {
                                  return removeCard(locale, index)
                              } else if (e.shiftKey) {
                                  return addCard(card, 'side')
                              } else {
                                  return addCard(card, 'main')
                              }
                          }}
                          className="CardImages"
                          alt={card.name}
                        />
                        {
                          previous ? <img src={`https://cdn.formatlibrary.com/images/emojis/${previous === 'forbidden' ? 'from0' : previous === 'limited' ? 'from1' : previous === 'semi-limited' ? "from2" : 'new'}.png`} alt={card.name} className="remarks-icon"/> : null
                        }
                      </div>
                </Link>
                )
              }
            </div>
          )
    }

}
