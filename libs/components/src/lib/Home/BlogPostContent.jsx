
import { useState } from 'react'
import { styled, alpha } from '@mui/system'
import {Slider, sliderClasses } from '@mui/base/Slider'
import './Slider.css'

export const BlogPostContent = (props) => {
    const {
        eventLink, 
        eventAbbreviation, 
        eventWinnerName, 
        eventWinnerPfp, 
        eventWinningDeckId, 
        eventWinningDeckType, 
        eventDate, 
        eventName,
        formatIcon,
        serverCommunityName,
        serverInviteLink,
        eventWinningDeckIsPopular,
    } = props

    return (
        <>
            <div class="blogpost-title-flexbox">
                <div class="blogpost-title-text"><a href={eventLink}>
                        <h1 class="blogpost-title">Congrats to {eventWinnerName} on winning {eventAbbreviation}!</h1>
                    </a>
                    <p class="blogpost-date">{eventDate?.toSomething()}</p>
                </div>
                <div class="blogpost-title-emojis">
                    <img class="blogpost-format-icon" src={`https://cdn.formatlibrary.com/images/emojis/${formatIcon}.png`} alt={formatIcon || 'format icon'}/>
                    <img class="blogpost-event-icon" src="https://cdn.formatlibrary.com/images/emojis/event.png" alt="trophy"/></div>
            </div>
            <div class="blogpost-content-flexbox">
                <p class="blogpost-paragraph">{eventWinnerName} won <a class="blogpost-event-link" href={`/events/${eventAbbreviation}`}>{eventName}</a> on {eventDate.toSomething()} with a ${eventWinningDeckIsPopular ? 'popular' : 'rogue'} deck, ${eventWinningDeckType}!</p>
                <div class="blogpost-images-flexbox">
                    <div class="blogpost-pfp-community-flexbox">
                        <img class="blogpost-pfp" src={`https://cdn.formatlibrary.com/images/pfps/${eventWinnerPfp}.png`} alt="winner pfp"/>
                        <img class="blogpost-community" src={`https://cdn.formatlibrary.com/images/logos/${serverCommunityName}.png`} alt="server logo"/></div>
                    <div class="blogpost-deck-box">
                        <a class="blogpost-deck-link" href={`/decks/${eventWinningDeckId}`}>
                            <img class="blogpost-deck" src={`https://cdn.formatlibrary.com/images/decks/previews/${eventWinningDeckId}.png`} alt="winning deck preview"/>
                        </a>
                    </div>
                </div>
                <p class="blogpost-paragraph">
                    Join the <a class="blogpost-event-link" href={serverInviteLink}>{serverCommunityName} Discord community</a> to compete in similar events!
                </p>
            </div>
        </>
    )

    
}