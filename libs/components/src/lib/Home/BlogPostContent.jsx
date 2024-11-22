
import { dateToVerbose } from "@fl/utils"

export const BlogPostContent = (props) => {
    const { blogpost } = props
    console.log('BlogPostContent blogpost', blogpost)
    const {
        eventAbbreviation,
        eventDate,
        eventName,
        winnerName,
        winnerPfp,
        winningDeckId,
        winningDeckType,
        winningDeckTypeIsPopular,
        formatName,
        formatIcon,
        communityName,
        serverInviteLink
    } = blogpost
    
    return (
        <>
            <div class="blogpost-title-flexbox">
                <div class="blogpost-title-text"><a href={`/events/${eventAbbreviation}`}>
                        <h1 class="blogpost-title">Congrats to {winnerName} on winning {eventAbbreviation}!</h1>
                    </a>
                    <p class="blogpost-date">{dateToVerbose(eventDate, false, false, true)}</p>
                </div>
                <div class="blogpost-title-emojis">
                    <img class="blogpost-format-icon" src={`https://cdn.formatlibrary.com/images/emojis/${formatIcon}.png`} alt={formatIcon || 'format icon'}/>
                    <img class="blogpost-event-icon" src="https://cdn.formatlibrary.com/images/emojis/event.png" alt="trophy"/></div>
            </div>
            <div class="blogpost-content-flexbox">
                <p class="blogpost-paragraph">{winnerName} won <a class="blogpost-event-link" href={`/events/${eventAbbreviation}`}>{eventName}</a> on {dateToVerbose(eventDate, true, true, false)} with a {winningDeckTypeIsPopular ? 'popular' : 'rogue'} deck, {winningDeckType}!</p>
                <div class="blogpost-images-flexbox">
                    <div class="blogpost-pfp-community-flexbox">
                        <img class="blogpost-pfp" src={`https://cdn.formatlibrary.com/images/pfps/${winnerPfp}.png`} alt="winner pfp"/>
                        <img class="blogpost-community" src={`https://cdn.formatlibrary.com/images/logos/${communityName}.png`} alt="server logo"/></div>
                    <div class="blogpost-deck-box">
                        <a class="blogpost-deck-link" href={`/decks/${winningDeckId}`}>
                            <img class="blogpost-deck" src={`https://cdn.formatlibrary.com/images/decks/previews/${winningDeckId}.png`} alt="winning deck preview"/>
                        </a>
                    </div>
                </div>
                <p class="blogpost-paragraph">
                    Join the <a class="blogpost-event-link" href={serverInviteLink}>{communityName} Discord community</a> to compete in similar {formatName} Format events!
                </p>
            </div>
        </>
    )

    
}