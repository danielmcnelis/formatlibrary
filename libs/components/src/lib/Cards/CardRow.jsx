
import { Link } from 'react-router-dom'
import './CardRow.css'

export const CardRow = (props) => {
    const { card, status } = props
    const { category, attribute, level, rating, scale, atk, def } = card
    const stats = []
  
    if (category === 'Monster') {
      stats.push(card.type)
      if (card.isNormal) stats.push("Normal")
      if (card.isFusion) stats.push("Fusion")
      if (card.isRitual) stats.push("Ritual")
      if (card.isSynchro) stats.push("Synchro")
      if (card.isXyz) stats.push("Xyz")
      if (card.isPendulum) stats.push("Pendulum")
      if (card.isLink) stats.push("Link")
      if (card.isFlip) stats.push("Flip")
      if (card.isGemini) stats.push("Gemini")
      if (card.isSpirit) stats.push("Spirit")
      if (card.isToon) stats.push("Toon")
      if (card.isTuner) stats.push("Tuner")
      if (card.isUnion) stats.push("Union")
      if (card.isEffect) stats.push("Effect")
    }
  
    const line = stats.join(' / ')
    const symbol = card.attribute ? `https://cdn.formatlibrary.com/images/symbols/${card.attribute.toLowerCase()}.png` :
        `https://cdn.formatlibrary.com/images/symbols/${card.category.toLowerCase()}.png`

    const symbol2 = card.isLink ? `https://cdn.formatlibrary.com/images/arrows/${card.arrows}.png` :
      card.isXyz ? `https://cdn.formatlibrary.com/images/symbols/rank.png` :
      category === 'Monster' ? `https://cdn.formatlibrary.com/images/symbols/star.png` :
      card.icon ? `https://cdn.formatlibrary.com/images/symbols/${card.icon.toLowerCase().replaceAll(' ', '-')}.png` :
      ''
  
    const line2 = card.isLink ? `Link ${rating}` :
        card.isXyz ? `Rank ${level}` :
        category === 'Monster' ? `Level ${level}` :
        card.icon
  
    const symbol3 = category === 'Monster' && card.type ? `https://cdn.formatlibrary.com/images/symbols/${card.type.toLowerCase().replaceAll(' ', '-')}.png` : null
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    const filePath = `https://cdn.formatlibrary.com/images/medium_cards/${card.artworkId}.jpg`
    
    return (
        <tr className={`${evenOrOdd}-search-results-row`}>
          <td className="no-padding-2" style={{verticalAlign: 'top'}}>
              <Link className="search-results-link" to={`/cards/${
                  card.cleanName.toLowerCase().replaceAll(' ', '-')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
              >
                  <div className='card-image-cell'>
                      <img
                        className="card-image"
                        src={filePath}
                        style={{width: '96px'}}
                        alt={card.name}
                      />
                      {
                      status ? (
                          <img
                          className="small-status-icon"
                          src={`https://cdn.formatlibrary.com/images/emojis/${status}.png`}
                          alt={status}
                          />
                      ) : ''
                      }
                  </div>
              </Link>
          </td>
          <td className="no-padding-2" style={{verticalAlign: 'top'}}>
              <Link className="search-results-link" to={`/cards/${card.cleanName.toLowerCase().replaceAll(' ', '-')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
              >
                  <table className="inner-cardRow-table">
                      <tbody>
                          <tr>
                          <th
                              colSpan="4"
                              style={{
                              textAlign: 'left',
                              fontSize: '24px',
                              borderBottom: '2px solid #CFDCE5'
                            }}
                          >
                              {card.name}
                          </th>
                          <th
                              colSpan="2"
                              style={{
                              fontWeight: 'isNormal',
                              fontSize: '14px',
                              textAlign: 'right',
                              padding: '10px 20px 20px 10px',
                              borderBottom: '2px solid #CFDCE5'
                              }}
                          >
                            {
                                props.region?.includes('speed') ? `Speed Release: ${card.speedDate?.substring(0, 10) || 'N/A'}` : 
                                props.region?.includes('ocg') ? `OCG Release: ${card.ocgDate?.substring(0, 10) || 'N/A'}` : 
                                `TCG Release: ${card.tcgDate?.substring(0, 10) || 'N/A'}`            
                            }
                          </th>
                          </tr>
                          <tr>
                          <td height="25px" width="90px" style={{borderRight: '2px solid #CFDCE5'}}>
                              <img
                                src={symbol}
                                height="24px"
                                style={{verticalAlign: 'middle'}}
                                alt={attribute || category?.toUpperCase()}
                              />
                              {' ' + (attribute || category?.toUpperCase())}
                          </td>
                          {symbol2 ? (
                              <td height="25px" width="120px" style={{borderRight: '2px solid #CFDCE5'}}>
                              <img
                                  src={symbol2}
                                  margin="0px"
                                  height="24px"
                                  style={{verticalAlign: 'middle'}}
                                  alt={line2}
                              />
                              {' ' + line2}
                              </td>
                          ) : (
                              <td height="25px" width="120px" />
                          )}
                          {stats.length > 1 ? (
                              <td height="25px" width="300px" style={{borderRight: '2px solid #CFDCE5'}}>
                              <img
                                  src={symbol3}
                                  margin="0px"
                                  height="24px"
                                  style={{verticalAlign: 'middle'}}
                                  alt="level/category"
                              />
                              {' ' + line}
                              </td>
                          ) : (
                              <td height="25px" width="220px" />
                          )}
                          {atk !== null ? (
                              <td height="25px" width="100px" style={{borderRight: '2px solid #CFDCE5'}}>
                              {'ATK: ' + atk}
                              </td>
                          ) : (
                              <td height="25px" width="100px" />
                          )}
                          {def !== null ? (
                              <td height="25px" width="100px" style={{borderRight: '2px solid #CFDCE5'}}>
                              {'DEF: ' + def}
                              </td>
                          ) : (
                              <td height="25px" width="100px" />
                          )}
                          <td />
                          </tr>
                          {card.isPendulum ? (
                              <tr>
                              <td height="25px" width="110px" style={{borderRight: '2px solid #CFDCE5', borderTop: '2px solid #CFDCE5'}}>
                                  <img
                                  src={`https://cdn.formatlibrary.com/images/symbols/scale.png`}
                                  height="24px"
                                  style={{verticalAlign: 'middle'}}
                                  alt="Scale"
                                  />
                                  {' Scale ' + scale}
                              </td>
                              <td
                                  colSpan="5"
                                  className="cardrow-description"
                                  style={{fontSize: '16px', borderTop: '2px solid #CFDCE5'}}
                              >
                                  {card.pendulumEffect || ''}
                              </td>
                              </tr>
                          ) : (
                              <tr></tr>
                          )}
                          {
                            <tr>
                            <td
                                colSpan="6"
                                className="cardrow-description"
                                style={{padding: '10px 20px 20px 10px', fontSize: '16px', borderTop: '2px solid #CFDCE5'}}
                            >
                                {
                                    card.isNormal ? <i>{card.description}</i> : card.description
                                }
                            </td>
                            </tr>
                          }
                      </tbody>
                  </table>
              </Link>
          </td>
        </tr>
    )
}
