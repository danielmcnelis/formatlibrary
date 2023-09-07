
import { Link } from 'react-router-dom'
import './CardRow.css'

export const CardRow = (props) => {
    const { card, status } = props
    const { category, attribute, level, rating, scale, atk, def } = card
    const stats = []
  
    if (category === 'Monster') {
      stats.push(card.type)
      if (card.normal) stats.push("Normal")
      if (card.fusion) stats.push("Fusion")
      if (card.ritual) stats.push("Ritual")
      if (card.synchro) stats.push("Synchro")
      if (card.xyz) stats.push("Xyz")
      if (card.pendulum) stats.push("Pendulum")
      if (card.link) stats.push("Link")
      if (card.flip) stats.push("Flip")
      if (card.gemini) stats.push("Gemini")
      if (card.spirit) stats.push("Spirit")
      if (card.toon) stats.push("Toon")
      if (card.tuner) stats.push("Tuner")
      if (card.union) stats.push("Union")
      if (card.effect) stats.push("Effect")
    }
  
    const line = stats.join(' / ')
    const symbol = card.attribute ? `https://cdn.formatlibrary.com/images/symbols/${card.attribute.toLowerCase()}.png` :
        `https://cdn.formatlibrary.com/images/symbols/${card.category.toLowerCase()}.png`

    const symbol2 = card.link ? `https://cdn.formatlibrary.com/images/arrows/${card.arrows}.png` :
      card.xyz ? `https://cdn.formatlibrary.com/images/symbols/rank.png` :
      category === 'Monster' ? `https://cdn.formatlibrary.com/images/symbols/star.png` :
      card.icon ? `https://cdn.formatlibrary.com/images/symbols/${card.icon.toLowerCase().replaceAll(' ', '-')}.png` :
      ''
  
    const line2 = card.link ? `Link ${rating}` :
    card.xyz ? `Rank ${level}` :
    category === 'Monster' ? `Level ${level}` :
    card.icon
  
    const symbol3 = category === 'Monster' && card.type ? `https://cdn.formatlibrary.com/images/symbols/${card.type.toLowerCase().replaceAll(' ', '-')}.png` : null
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    const filePath = `https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`
    
    return (
        <tr className={`${evenOrOdd}-search-results-row`}>
          <td className="no-padding-2" style={{verticalAlign: 'top'}}>
              <Link className="black-text" to={`/cards/${
                  card.name.replaceAll('%', '%252525')
                  .replaceAll('/', '%2F')
                  .replaceAll(' ', '_')
                  .replaceAll('#', '%23')
                  .replaceAll('?', '%3F')
                  }`}
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
              <Link className="black-text" to={`/cards/${
                  card.name.replaceAll('%', '%252525')
                  .replaceAll('/', '%2F')
                  .replaceAll(' ', '_')
                  .replaceAll('#', '%23')
                  .replaceAll('?', '%3F')
                  }`}
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
                              fontWeight: 'normal',
                              fontSize: '14px',
                              textAlign: 'right',
                              padding: '10px 20px 20px 10px',
                              borderBottom: '2px solid #CFDCE5'
                              }}
                          >
                              {card.tcgDate.substring(0, 10)}
                          </th>
                          </tr>
                          <tr>
                          <td height="25px" width="90px" style={{borderRight: '2px solid #CFDCE5'}}>
                              <img
                              src={symbol}
                              height="24px"
                              style={{verticalAlign: 'middle'}}
                              alt="symbol"
                              />
                              {' ' + (attribute || category.toUpperCase())}
                          </td>
                          {symbol2 ? (
                              <td height="25px" width="120px" style={{borderRight: '2px solid #CFDCE5'}}>
                              <img
                                  src={symbol2}
                                  margin="0px"
                                  height="24px"
                                  style={{verticalAlign: 'middle'}}
                                  alt="level/category"
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
                          {card.pendulum ? (
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
                                  {
                                  card.description.includes('[ Pendulum Effect ]') ? 
                                  card.description.slice(20, card.description.indexOf('----')) :
                                  ''
                                  }
                              </td>
                              </tr>
                          ) : (
                              <tr></tr>
                          )}
                          {card.pendulum ? (
                              <tr>
                              <td
                                  colSpan="6"
                                  className="cardrow-description"
                                  style={{padding: '10px 20px 20px 10px', fontSize: '16px', borderTop: '2px solid #CFDCE5'}}
                              >
                                  {
                                  card.description.includes('[ Monster Effect ]') ? 
                                  card.description.slice(card.description.indexOf('[ Monster Effect ]') + 19) :
                                  card.description.includes('[ Flavor Text ]') ?
                                  <i>{card.description.slice(card.description.indexOf('[ Flavor Text ]') + 16)}</i> :
                                  card.description
                                  }
                              </td>
                              </tr>
                          ) : (
                              <tr>
                              <td
                                  colSpan="6"
                                  className="cardrow-description"
                                  style={{padding: '10px 20px 20px 10px', fontSize: '16px', borderTop: '2px solid #CFDCE5'}}
                              >
                                  {
                                    card.normal ? <i>{card.description}</i> : card.description
                                  }
                              </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </Link>
          </td>
        </tr>
    )
}
