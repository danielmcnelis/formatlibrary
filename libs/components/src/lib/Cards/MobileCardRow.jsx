import { Link } from 'react-router-dom'
import './MobileCardRow.css'

const symbols = {
  Aqua: 'https://cdn.formatlibrary.com/images/symbols/aqua.webp',
  Beast: 'https://cdn.formatlibrary.com/images/symbols/beast.webp',
  BeastWarrior: 'https://cdn.formatlibrary.com/images/beast-warrior.webp',
  Continuous: 'https://cdn.formatlibrary.com/images/symbols/continuous.webp',
  Counter: 'https://cdn.formatlibrary.com/images/symbols/counter.webp',
  Cyberse: 'https://cdn.formatlibrary.com/images/symbols/cyberse.webp',
  DARK: 'https://cdn.formatlibrary.com/images/symbols/dark.webp',
  Dinosaur: 'https://cdn.formatlibrary.com/images/symbols/dinosaur.webp',
  DIVINE: 'https://cdn.formatlibrary.com/images/symbols/divine.webp',
  DivineBeast: 'https://cdn.formatlibrary.com/images/symbols/divine-beast.webp',
  Dragon: 'https://cdn.formatlibrary.com/images/symbols/dragon.webp',
  EARTH: 'https://cdn.formatlibrary.com/images/symbols/earth.webp',
  Equip: 'https://cdn.formatlibrary.com/images/symbols/equip.webp',
  Fairy: 'https://cdn.formatlibrary.com/images/symbols/fairy.webp',
  Field: 'https://cdn.formatlibrary.com/images/symbols/field.webp',
  Fiend: 'https://cdn.formatlibrary.com/images/symbols/fiend.webp',
  FIRE: 'https://cdn.formatlibrary.com/images/symbols/fire.webp',
  Fish: 'https://cdn.formatlibrary.com/images/symbols/fish.webp',
  Insect: 'https://cdn.formatlibrary.com/images/symbols/insect.webp',
  LIGHT: 'https://cdn.formatlibrary.com/images/symbols/light.webp',
  LinkSymbol: 'https://cdn.formatlibrary.com/images/symbols/link.webp',
  Machine: 'https://cdn.formatlibrary.com/images/symbols/machine.webp',
  Normal: 'https://cdn.formatlibrary.com/images/symbols/normal.webp',
  Plant: 'https://cdn.formatlibrary.com/images/symbols/plant.webp',
  Psychic: 'https://cdn.formatlibrary.com/images/symbols/psychic.webp',
  Pyro: 'https://cdn.formatlibrary.com/images/symbols/pyro.webp',
  QuickPlay: 'https://cdn.formatlibrary.com/images/symbols/quick-play.webp',
  Rank: 'https://cdn.formatlibrary.com/images/symbols/rank.webp',
  Reptile: 'https://cdn.formatlibrary.com/images/symbols/reptile.webp',
  Ritual: 'https://cdn.formatlibrary.com/images/symbols/ritual.webp',
  Rock: 'https://cdn.formatlibrary.com/images/symbols/rock.webp',
  Scale: 'https://cdn.formatlibrary.com/images/symbols/Scale.webp',
  SeaSerpent: 'https://cdn.formatlibrary.com/images/symbols/sea-serpent.webp',
  Spell: 'https://cdn.formatlibrary.com/images/symbols/spell.webp',
  Spellcaster: 'https://cdn.formatlibrary.com/images/symbols/spellcaster.webp',
  Star: 'https://cdn.formatlibrary.com/images/symbols/star.webp',
  Thunder: 'https://cdn.formatlibrary.com/images/symbols/thunder.webp',
  Trap: 'https://cdn.formatlibrary.com/images/symbols/trap.webp',
  Warrior: 'https://cdn.formatlibrary.com/images/symbols/warrior.webp',
  WATER: 'https://cdn.formatlibrary.com/images/symbols/water.webp',
  WIND: 'https://cdn.formatlibrary.com/images/symbols/wind.webp',
  WingedBeast: 'https://cdn.formatlibrary.com/images/symbols/winged-beast.webp',
  Wyrm: 'https://cdn.formatlibrary.com/images/symbols/wyrm.webp',
  Zombie: 'https://cdn.formatlibrary.com/images/symbols/zombie.webp'
}

/* eslint-disable complexity */
export const MobileCardRow = (props) => {
    let { status } = props
    const { card, isForged } = props
    if (isForged && status >= 3) {
        status = 'tres'
    } else if (isForged && status === 2) {
        status = 'semi-limited'
    } else if (isForged && status === 1) {
        status = 'limited'
    } else if (isForged && status === 0) {
        status = 'zero'
    }

    const { category, attribute, level, rating, atk, def } = card
    const line = card.type
    
    const symbol = symbols[card.attribute] || symbols[card.category]
    const symbol2 = card.isLink ? `https://cdn.formatlibrary.com/images/arrows/${card.arrows}.webp` :
      card.isXyz ? symbols.Rank :
      category === 'Monster' ? symbols.Star :
      card.icon ? symbols[card.icon.replace('-', '')] :
      ''
  
    const line2 = card.isLink ? `Lk${rating}` :
    card.isXyz ? `Rk${level}` :
    category === 'Monster' ? `Lv${level}` :
    card.icon
  
    const symbol3 = category === 'Monster' && card.type ? symbols[card.type.replace(/[\s-]/g, '')] : null
    const evenOrOdd = props.index % 2 ? 'even' : 'odd'
    const filePath = `https://cdn.formatlibrary.com/images/medium_cards/${card.artworkId}.jpg`
    
    return (     
        <tr className={`${evenOrOdd}-search-results-row`} onClick={() => {window.open(`/cards/${card.cleanName.toLowerCase().replaceAll(' ', '-')}`, '_blank')}}>
            <td className="no-padding-2" style={{verticalAlign: 'top'}}>
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
                        src={`https://cdn.formatlibrary.com/images/emojis/${status}.webp`}
                        alt={status}
                        />
                    ) : ''
                    }
                </div>
            </td>
            <td className="no-padding-2" style={{verticalAlign: 'top'}}>
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
            </td>
        </tr>
    )
}
