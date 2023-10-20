import { Link } from 'react-router-dom'
import './MobileCardRow.css'

const symbols = {
  Aqua: 'https://cdn.formatlibrary.com/images/symbols/aqua.png',
  Beast: 'https://cdn.formatlibrary.com/images/symbols/beast.png',
  BeastWarrior: 'https://cdn.formatlibrary.com/images/beast-warrior.png',
  Continuous: 'https://cdn.formatlibrary.com/images/symbols/continuous.png',
  Counter: 'https://cdn.formatlibrary.com/images/symbols/counter.png',
  Cyberse: 'https://cdn.formatlibrary.com/images/symbols/cyberse.png',
  DARK: 'https://cdn.formatlibrary.com/images/symbols/dark.png',
  Dinosaur: 'https://cdn.formatlibrary.com/images/symbols/dinosaur.png',
  DIVINE: 'https://cdn.formatlibrary.com/images/symbols/divine.png',
  DivineBeast: 'https://cdn.formatlibrary.com/images/symbols/divine-beast.png',
  Dragon: 'https://cdn.formatlibrary.com/images/symbols/dragon.png',
  EARTH: 'https://cdn.formatlibrary.com/images/symbols/earth.png',
  Equip: 'https://cdn.formatlibrary.com/images/symbols/equip.png',
  Fairy: 'https://cdn.formatlibrary.com/images/symbols/fairy.png',
  Field: 'https://cdn.formatlibrary.com/images/symbols/field.png',
  Fiend: 'https://cdn.formatlibrary.com/images/symbols/fiend.png',
  FIRE: 'https://cdn.formatlibrary.com/images/symbols/fire.png',
  Fish: 'https://cdn.formatlibrary.com/images/symbols/fish.png',
  Insect: 'https://cdn.formatlibrary.com/images/symbols/insect.png',
  LIGHT: 'https://cdn.formatlibrary.com/images/symbols/light.png',
  LinkSymbol: 'https://cdn.formatlibrary.com/images/symbols/link.png',
  Machine: 'https://cdn.formatlibrary.com/images/symbols/machine.png',
  Normal: 'https://cdn.formatlibrary.com/images/symbols/normal.png',
  Plant: 'https://cdn.formatlibrary.com/images/symbols/plant.png',
  Psychic: 'https://cdn.formatlibrary.com/images/symbols/psychic.png',
  Pyro: 'https://cdn.formatlibrary.com/images/symbols/pyro.png',
  QuickPlay: 'https://cdn.formatlibrary.com/images/symbols/quick-play.png',
  Rank: 'https://cdn.formatlibrary.com/images/symbols/rank.png',
  Reptile: 'https://cdn.formatlibrary.com/images/symbols/reptile.png',
  Ritual: 'https://cdn.formatlibrary.com/images/symbols/ritual.png',
  Rock: 'https://cdn.formatlibrary.com/images/symbols/rock.png',
  Scale: 'https://cdn.formatlibrary.com/images/symbols/Scale.png',
  SeaSerpent: 'https://cdn.formatlibrary.com/images/symbols/sea-serpent.png',
  Spell: 'https://cdn.formatlibrary.com/images/symbols/spell.png',
  Spellcaster: 'https://cdn.formatlibrary.com/images/symbols/spellcaster.png',
  Star: 'https://cdn.formatlibrary.com/images/symbols/star.png',
  Thunder: 'https://cdn.formatlibrary.com/images/symbols/thunder.png',
  Trap: 'https://cdn.formatlibrary.com/images/symbols/trap.png',
  Warrior: 'https://cdn.formatlibrary.com/images/symbols/warrior.png',
  WATER: 'https://cdn.formatlibrary.com/images/symbols/water.png',
  WIND: 'https://cdn.formatlibrary.com/images/symbols/wind.png',
  WingedBeast: 'https://cdn.formatlibrary.com/images/symbols/winged-beast.png',
  Wyrm: 'https://cdn.formatlibrary.com/images/symbols/wyrm.png',
  Zombie: 'https://cdn.formatlibrary.com/images/symbols/zombie.png'
}

/* eslint-disable complexity */
export const MobileCardRow = (props) => {
    const { card, status } = props
    const { category, attribute, level, rating, atk, def } = card
    const line = card.type
    
    const symbol = symbols[card.attribute] || symbols[card.category]
    const symbol2 = card.link ? `https://cdn.formatlibrary.com/images/arrows/${card.arrows}.png` :
      card.xyz ? symbols.Rank :
      category === 'Monster' ? symbols.Star :
      card.icon ? symbols[card.icon.replace('-', '')] :
      ''
  
    const line2 = card.link ? `Lk${rating}` :
    card.xyz ? `Rk${level}` :
    category === 'Monster' ? `Lv${level}` :
    card.icon
  
    const symbol3 = category === 'Monster' && card.type ? symbols[card.type.replace(/[\s-]/g, '')] : null
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    const filePath = `https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`
    
    return (
        <tr className={`${evenOrOdd}-search-results-row`}>
                  <td className="no-padding-2" style={{verticalAlign: 'top'}}>
                      <Link 
                        className="search-results-link" 
                        to={`/cards/${card.cleanName.replaceAll(' ', '-')}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                          <div className='card-image-cell'>
                              <img
                                className="card-image"
                                src={filePath}
                                style={{width: '82px'}}
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
                        <Link className="search-results-link" 
                            to={`/cards/${card.cleanName.replaceAll(' ', '-')}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                          <table className="inner-cardRow-table">
                              <tbody>
                                  <tr>
                                  <th
                                      colSpan="5"
                                      style={{
                                      textAlign: 'left',
                                      fontSize: '24px',
                                      borderBottom: '2px solid #CFDCE5'
                                      }}
                                  >
                                      {card.name}
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
                                  {
                                      card.category === 'Monster' ? (
                                          <td height="25px" width="120px" style={{borderRight: '2px solid #CFDCE5'}}>
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
                                          <td height="25px" width="120px" />
                                      )
                                  }
                                  {
                                      atk !== null ? (
                                          <td height="25px" width="100px" style={{borderRight: '2px solid #CFDCE5'}}>
                                              {'ATK: ' + atk}
                                          </td>
                                      ) : (
                                          <td height="25px" width="100px" />
                                      )
                                  }
                                  {
                                      def !== null ? (
                                          <td height="25px" width="100px" style={{borderRight: '2px solid #CFDCE5'}}>
                                              {'DEF: ' + def}
                                          </td>
                                      ) : (
                                          <td height="25px" width="100px" />
                                      )
                                  }
                                  </tr>
                              </tbody>
                          </table>
                      </Link>
                  </td>
              </tr>
    )
}
