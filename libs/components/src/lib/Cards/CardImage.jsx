import { Link } from 'react-router-dom'
import { camelize } from '@fl/utils'
import './CardImage.css'

export const CardImage = (props) => {
    let {isForged, addCard, selectCard, removeCard, card, previous, points, status, rarity, width, margin, padding, index, locale, disableLink, setCard, isDraft, isPackSimulator} = props
    if (rarity?.includes('Short Print')) rarity = 'Common'
    if (isForged && status >= 3) {
        status = 'tres'
    } else if (isForged && status === 2) {
        status = 'semi-limited'
    } else if (isForged && status === 1) {
        status = 'limited'
    } else if (isForged && status === 0) {
        status = 'zero'
    }
    
    if (isDraft) {
        return (
            <div className="CardImage-box">
                <div className="card-image-cell"  >
                {
                    rarity ? <img src={`https://cdn.formatlibrary.com/images/rarities/${camelize(rarity)}.png`} alt={rarity} className="rarity-icon"/> : null
                }
                <img
                    src={`https://cdn.formatlibrary.com/images/medium_cards/${card.artworkId}.jpg`}
                    card={card}
                    onMouseOver={() => setCard(card)}
                    onClick={()=> disableLink ? '' : selectCard(card)}
                    style={{width, margin, padding}}
                    className="CardImages"
                    alt={card.name}
                />
                </div>
            </div>
          )
    } else if (isPackSimulator) {
         return (
            <div className="CardImage-box">
                <Link to={`/cards/${card.cleanName.toLowerCase().replaceAll(' ', '-')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                >
                    <div className="card-image-cell"  >
                    {
                        rarity ? <img src={`https://cdn.formatlibrary.com/images/rarities/${camelize(rarity)}.png`} alt={rarity} className="rarity-icon"/> : null
                    }
                    <img
                        src={`https://cdn.formatlibrary.com/images/medium_cards/${card.artworkId}.jpg`}
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
                    src={`https://cdn.formatlibrary.com/images/medium_cards/${card.artworkId}.jpg`}
                    card={card}
                    onMouseOver={() => setCard(card)}
                    onContextMenu={(e)=> {
                        e?.preventDefault()
                        if (locale === 'main' || locale === 'side' || locale === 'extra') {
                            return removeCard(locale, index)
                        } else if (e.shiftKey) {
                            return addCard(card, 'side')
                        } else if (card.isExtraDeck) {
                            return addCard(card, 'extra')
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
    } else if (props.points) {
        return (
            <div className="CardImage-box">
              {
                parseInt(width, 10) < 48 ? (
                  <img
                    src={`https://cdn.formatlibrary.com/images/medium_cards/${card.artworkId}.jpg`}
                    card={card}
                    style={{width, margin, padding}}
                    className="SmallCardImages"
                    alt={card.name}
                  />
                ) : parseInt(width) >= 48 && parseInt(width, 10) < 96 ? (
                  <Link to={`/cards/${card.cleanName.toLowerCase().replaceAll(' ', '-')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                      <div className="card-image-cell">
                        {
                          <img src={`https://cdn.formatlibrary.com/images/emojis/${points}.png`} alt={points} className="points-icon"/>
                        }
                        <img
                          src={`https://cdn.formatlibrary.com/images/medium_cards/${card.artworkId}.jpg`}
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
                      </div>
                </Link>
                ) : (
                    <Link to={`/cards/${card.cleanName.toLowerCase().replaceAll(' ', '-')}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                        <div className="card-image-cell">
                          {
                            status && status !== 'no longer on list' ? <img src={`https://cdn.formatlibrary.com/images/emojis/${status}.png`} alt={status} className="status-icon"/> : null
                          }
                          <img
                            src={`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`}
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
    } else {
        return (
            <div className="CardImage-box">
              {
                parseInt(width, 10) < 48 ? (
                  <img
                    src={`https://cdn.formatlibrary.com/images/medium_cards/${card.artworkId}.jpg`}
                    card={card}
                    style={{width, margin, padding}}
                    className="SmallCardImages"
                    alt={card.name}
                  />
                ) : parseInt(width) >= 48 && parseInt(width, 10) < 96 ? (
                  <Link to={`/cards/${card.cleanName.toLowerCase().replaceAll(' ', '-')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                      <div className="card-image-cell">
                        {
                          status && status !== 'no longer on list' ? <img src={`https://cdn.formatlibrary.com/images/emojis/${status}.png`} alt={status} className="status-icon"/> : null
                        }
                        <img
                          src={`https://cdn.formatlibrary.com/images/medium_cards/${card.artworkId}.jpg`}
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
                ) : (
                    <Link to={`/cards/${card.cleanName.toLowerCase().replaceAll(' ', '-')}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                        <div className="card-image-cell">
                          {
                            status && status !== 'no longer on list' ? <img src={`https://cdn.formatlibrary.com/images/emojis/${status}.png`} alt={status} className="status-icon"/> : null
                          }
                          <img
                            src={`https://cdn.formatlibrary.com/images/cards/${card.artworkId}.jpg`}
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
