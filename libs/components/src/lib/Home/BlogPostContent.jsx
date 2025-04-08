
import { dateToVerbose } from "@fl/utils"
import './BlogPostContent.css'

export const BlogPostContent = (props) => {
    const { blogpost } = props

    const {
        eventAbbreviation,
        eventDate,
        eventName,
        winnerName,
        winnerId,
        winningDeckId,
        winningDeckTypeName,
        winningDeckTypeIsPopular,
        formatName,
        formatIcon,
        communityName,
        serverInviteLink
    } = blogpost
    
    return (
        <>
            <div class="BlogPostContent-title-flexbox">
                <div class="BlogPostContent-title-text"><a href={`/events/${eventAbbreviation}`}>
                        <h1 class="BlogPostContent-title">Congrats to {winnerName} on winning {eventAbbreviation}!</h1>
                    </a>
                    <p class="BlogPostContent-date">{dateToVerbose(eventDate, false, false, true)}</p>
                </div>
                <div class="BlogPostContent-title-emojis">
                    <img class="BlogPostContent-format-icon" src={`https://cdn.formatlibrary.com/images/emojis/${formatIcon}.png`} alt={formatIcon || 'format icon'}/>
                    <img class="BlogPostContent-event-icon" src="https://cdn.formatlibrary.com/images/emojis/event.png" alt="trophy"/></div>
            </div>
            <div class="BlogPostContent-content-flexbox">
                <p class="BlogPostContent-paragraph">{winnerName} won <a class="BlogPostContent-event-link" href={`/events/${eventAbbreviation}`}>{eventName}</a> on {dateToVerbose(eventDate, true, true, false)} with a {winningDeckTypeIsPopular ? 'popular' : 'rogue'} deck, {winningDeckTypeName}!</p>
                <div class="BlogPostContent-images-flexbox">
                    <div class="BlogPostContent-pfp-community-flexbox">
                        <img class="BlogPostContent-pfp" src={`/api/players/${winnerId}/avatar`} alt="winner pfp"/>
                        <img class="BlogPostContent-community" src={`https://cdn.formatlibrary.com/images/logos/${communityName}.png`} alt="server logo"/>
                    </div>
                    <div class="BlogPostContent-deck-box">
                        <a class="BlogPostContent-deck-link" href={`/decks/${winningDeckId}`}>
                            <img class="BlogPostContent-deck" src={`https://cdn.formatlibrary.com/images/decks/previews/${winningDeckId}.png`} alt="winning deck preview"/>
                        </a>
                    </div>
                </div>
                <p class="BlogPostContent-paragraph">
                    Join the <a class="BlogPostContent-event-link" href={serverInviteLink}>{communityName} Discord community</a> to compete in similar {formatName} Format events!
                </p>
            </div>
        </>
    )
}