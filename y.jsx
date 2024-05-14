<div className="blogpost-title-flexbox">
    <div className="blogpost-title-text">
        <a href="/events/${event.abbreviation}">
            <h1 className="blogpost-title">${title}</h1>
        </a>
        <p className="blogpost-date">${blogTitleDate}</p>
    </div>
    <div className="blogpost-title-emojis">
        <img className="blogpost-format-icon" src="https://cdn.formatlibrary.com/images/emojis/${event.format.icon}.png"/>
        <img className="blogpost-event-icon" src="https://cdn.formatlibrary.com/images/emojis/event.png"/>
    </div>
</div>
<div className="blogpost-content-flexbox">
    <p className="blogpost-paragraph">
        `${team.playerA.name}, ${team.playerB.name}, and ${team.playerC.name} (${event.winner}) won <a className="blogpost-event-link" href="/events/${event.abbreviation}">${event.name}</a> on ${publishDate}!
    </p>
    <div className="blogpost-images-flexbox">
        <div className="blogpost-pfp-community-flexbox">
            <img className="blogpost-community"  src="https://cdn.formatlibrary.com/images/logos/${event.community?.replaceAll('+', '%2B')}.png" />
        </div>
        <div className="blogpost-deck-box"> 
            `${deckThumbnails[0]}
            `${deckThumbnails[1]}
            `${deckThumbnails[2]}
            +
        </div>
        <div className="blogpost-pfp-community-flexbox">
            <img className="blogpost-pfp" src="https://cdn.formatlibrary.com/images/pfps/${team.playerA.discordId || team.playerA.globalName || team.playerA.discordName || team.playerA.name}.png" />
            <img className="blogpost-pfp" src="https://cdn.formatlibrary.com/images/pfps/${team.playerB.discordId || team.playerB.globalName || team.playerB.discordName || team.playerB.name}.png" />
            <img className="blogpost-pfp" src="https://cdn.formatlibrary.com/images/pfps/${team.playerC.discordId || team.playerC.globalName || team.playerC.discordName || team.playerC.name}.png" />
        </div>
    </div>
    <p className="blogpost-paragraph">${conclusion}</p>
</div>