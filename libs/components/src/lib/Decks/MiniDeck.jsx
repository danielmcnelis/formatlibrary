
import './MiniDeck.css'

export const MiniDeck = (props) => {
    const { deck } = props
    if (!deck || !deck.id) return
    
    const main = deck.ydk.split('#main')[1].split('#extra')[0].split(/[\s]+/).filter((e) => e.length).map((e) => parseInt(e))
    const extra = deck.ydk.split('#extra')[1].split('!side')[0].split(/[\s]+/).filter((e) => e.length).map((e) => parseInt(e))
    const side = deck.ydk.split('!side')[1].split(/[\s]+/).filter((e) => e.length).map((e) => parseInt(e))

  return (
    <>
        <div className="mini-deck-flexbox">
        {
            main.map((kc, index) => (
                <img
                    key={`main-${deck.id}-${index}`}
                    src={`https://cdn.formatlibrary.com/images/cards/${kc}.jpg`}
                    style={{width: '36px', margin: '0px', padding: '0px'}}
                    alt={kc}
                />
            ))            
        }
        </div>
        {
            side.length ? (
                <div className="mini-deck-flexbox">
                {
                    side.map((kc, index) => (
                        <img
                            key={`side-${deck.id}-${index}`}
                            src={`https://cdn.formatlibrary.com/images/cards/${kc}.jpg`}
                            style={{width: '24px', margin: '0px', padding: '0px'}}
                            alt={kc}
                        />
                    ))
                }
                </div>
            ) : ''
        }
        {
            extra.length ? (
                <div className="mini-deck-flexbox">
                {
                    extra.map((kc, index) => (
                        <img
                            key={`extra-${deck.id}-${index}`}
                            src={`https://cdn.formatlibrary.com/images/cards/${kc}.jpg`}
                            style={{width: '24px', margin: '0px', padding: '0px'}}
                            alt={kc}
                        />
                    ))
                }
                </div>
            ) : ''
        }
    </>
  )
}
