
import './PortalButton.css'
import { Helmet } from 'react-helmet'
import './Subscriptions.css'

//SUBSCRIPTIONS 
export const Subscriptions = () => {
    return (
        <>
            <Helmet>
                <script async src="https://js.stripe.com/v3/buy-button.js"/>
            </Helmet>
            <div className="body">
                <h2>Format Library Subscription Tiers</h2>
                <h4 style={{margin: '0px auto'}}><i>Important: Purchase a subscription using the email connected to your account!</i></h4>
                <div className="horizontal-products-flex" style={{margin: '20px 20%'}}>
                    <div>
                        <stripe-buy-button
                            buy-button-id="buy_btn_1Qnl1UI2hSs9VrZuCUsVQp3Q"
                            publishable-key="pk_live_51LIfMzI2hSs9VrZuWjHlUvJ8zOkyDrNFZ1AEkOpDOoCvdcNcpqyJV0Xne7JDmVUir9Rz7VkD9NjzUaR3Ykcz17hg00AbKIB6VY"
                        >
                        </stripe-buy-button>
                        <ul>
                            <h3>Supporter Perks</h3>
                            <li>
                                Ad-free browsing
                            </li>
                            <li>
                                Access all tournament decks, replays, matchup data
                            </li>
                            <li>
                                Free entry to monthly $50 rotating format tournaments (Discord)
                            </li>
                            <li>
                                Add Discord "flair" from 25 custom Yu-Gi-Oh! emojis
                            </li>
                        </ul>
                    </div>
                    <div>
                        <stripe-buy-button
                           buy-button-id="buy_btn_1Qnl0UI2hSs9VrZuMfyJdF6x"
                           publishable-key="pk_live_51LIfMzI2hSs9VrZuWjHlUvJ8zOkyDrNFZ1AEkOpDOoCvdcNcpqyJV0Xne7JDmVUir9Rz7VkD9NjzUaR3Ykcz17hg00AbKIB6VY"
                        >
                        </stripe-buy-button>
                        <ul>
                            <h3>Premium Perks</h3>
                            <li>
                                Ad-free browsing
                            </li>
                            <li>
                                Access all tournament decks, replays, matchup data
                            </li>
                            <li>
                                Free entry to monthly Edison World Championship Qualifiers (Discord)
                            </li>
                            <li>
                                Free entry to monthly $50 rotating format tournaments (Discord)
                            </li>
                            <li>
                                Add Discord "flair" from 25 custom Yu-Gi-Oh! emojis
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    )
}
