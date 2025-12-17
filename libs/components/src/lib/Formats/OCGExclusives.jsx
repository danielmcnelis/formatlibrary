
import { CardImage } from '../Cards/CardImage'
import './OCGExclusives.css'

export const OCGExclusives = (props) => {
    const ocgExclusives = {props}
    if (!ocgExclusives) return <div />
  
    return (
        <div>
            <div className="divider"/>
                <div id="ocg-exclusives" className="ocg-exclusives">
                    <h2 className="subheading">{'OCG Exclusives'}</h2>
                    {
                        <div>
                            <div id="limited" className="ocg-exclusives-bubble">
                                <div id="limited" className="ocg-exclusives-flexbox">
                                {
                                ocgExclusives.map((el) => 
                                <
                                    CardImage
                                    width='72px' 
                                    padding='1px' 
                                    margin='0px'
                                    key={el.card.id} 
                                    card={el.card}
                                />
                                )
                                }
                                </div>
                            </div>
                        </div>
                    }

                </div>
        </div>
    )
}
