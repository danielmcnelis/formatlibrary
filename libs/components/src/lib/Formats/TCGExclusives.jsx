
import { CardImage } from '../Cards/CardImage'
import './TCGExclusives.css'

export const TCGExclusives = (props) => {
    const {tcgExclusives} = props
    console.log('TCG EXCLUSIVES', tcgExclusives)
    if (!tcgExclusives?.length) return <div />
  
    return (
        <div>
            <div className="divider"/>
                <div id="tcg-exclusives" className="tcg-exclusives">
                    <h2 className="subheading">{'TCG Exclusives (excluding Normal Monsters)'}</h2>
                    {
                        <div>
                            <div id="limited" className="tcg-exclusives-bubble">
                                <div id="limited" className="tcg-exclusives-flexbox">
                                {
                                tcgExclusives.map((el) => 
                                <
                                    CardImage
                                    width='72px' 
                                    padding='1px' 
                                    margin='0px'
                                    key={el.id} 
                                    card={el}
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
