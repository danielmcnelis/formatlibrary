import { Link } from 'react-router-dom'
import './CardImage.css'

export const CardImage = (props) => {
    const {addCard, removeCard, card, previous, status, width, margin, padding, index, locale} = props
  
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
              card.name.replaceAll('%', '%252525')
                .replaceAll('/', '%2F')
                .replaceAll(' ', '_')
                .replaceAll('#', '%23')
                .replaceAll('?', '%3F')
              }`}
              target="_blank" 
              rel="noopener noreferrer"
              >
                <div className="card-image-cell"  >
                  {
                    status && status !== 'no longer on list' ? <img src={`https://cdn.formatlibrary.com/images/emojis/${status}.png`} className="status-icon"/> : null
                  }
                  <img
                    src={`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`}
                    card={card}
                    onContextMenu={(e)=> {
                      e.preventDefault();
                      if (locale === 'main' || locale === 'side' || locale === 'extra') {
                          return removeCard(e, locale, index)
                      } else if (e.shiftKey) {
                          return addCard(e, card, 'side')
                      } else {
                          return addCard(e, card, 'main')
                      }
                    }}
                    style={{width, margin, padding}}
                    className="CardImages"
                    alt={card.name}
                  />
                  {
                    previous ? <img src={`https://cdn.formatlibrary.com/images/emojis/${previous === 'forbidden' ? 'from0' : previous === 'limited' ? 'from1' : previous === 'semi-limited' ? "from2" : 'new'}.png`} className="remarks-icon"/> : null
                  }
                </div>
          </Link>
          )
        }
      </div>
    )
}
