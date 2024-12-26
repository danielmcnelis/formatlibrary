
import { camelize, urlize } from '@fl/utils'
import './PrintRow.css'

export const PrintRow = (props) => {
  const { index, print } = props
  const raritySymbol = print.rarity === '10000 Secret Rare' ? 'tenThousandSecretRare' : camelize(print.rarity)
  const evenOrOdd = index % 2 ? 'even' : 'odd'
  const prices = [print.unlimitedPrice, print.firstEditionPrice, print.limitedPrice].filter((e) => !!e)
  const minPrice = prices.length ? '$' + Math.min(...prices).toFixed(2) : 'N/A'
  const tcgPlayerUrl = `https://tcgplayer.pxf.io/XYZQm5?u=${encodeURIComponent(print.tcgPlayerUrl || `https://store.tcgplayer.com/yugioh/${urlize(print.setName)}/${urlize(print.cardName)}`)}`

  return (
    <tr onClick={() => window.open(tcgPlayerUrl, "_blank")} className={`${evenOrOdd}-print-row`}>
        <td className="print-cell-1">{minPrice}</td>
        <td className="rarity-cell" style={{backgroundImage: `url(https://cdn.formatlibrary.com/images/rarities/${raritySymbol}.png)`}}/>
        <td className="print-cell-2 desktop-only">{print.rarity}</td>
        <td className="print-cell-3">{print.cardCode}</td>
        <td className="print-cell-4 desktop-only">{print.setName}</td>
        <td className="print-cell-5">{print.set?.releaseDate}</td>
    </tr>
  )
}
